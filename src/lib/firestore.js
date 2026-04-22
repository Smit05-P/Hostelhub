/**
 * lib/firestore.js — Central Firestore service layer
 * All reusable Firestore helpers live here.
 * No business logic should be written directly in API routes or frontend.
 */

import { db } from "@/lib/firebase";
export { db };
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  runTransaction,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
  getCountFromServer,
  limit,
  startAfter,
} from "firebase/firestore";

// ─── USERS / STUDENTS ────────────────────────────────────────────────────────

export async function getUserById(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function findStudentByEmail(email) {
  if (!email) return null;

  const q = query(
    collection(db, "users"),
    where("email", "==", email),
    where("role", "==", "student")
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const studentDoc = snap.docs[0];
  return { id: studentDoc.id, ...studentDoc.data() };
}

export async function getAllStudents({ 
  hostelId, 
  search = "", 
  filterRoom = "all", 
  filterStatus = "all",
  pageSize = 10,
  cursor = null
} = {}) {
  try {
    let constraints = [
      where("role", "==", "student"),
      orderBy("createdAt", "desc")
    ];

    if (hostelId && hostelId !== "primary-hostel") {
      constraints.push(where("hostelId", "==", hostelId));
    }

    if (filterStatus !== "all") {
      constraints.push(where("status", "==", filterStatus));
    }

    if (cursor) {
      if (typeof cursor === "string") {
        const cursorDoc = await getDoc(doc(db, "users", cursor));
        if (cursorDoc.exists()) constraints.push(startAfter(cursorDoc));
      } else {
        constraints.push(startAfter(cursor));
      }
    }

    constraints.push(limit(pageSize + 1));

    const q = query(collection(db, "users"), ...constraints);
    const snap = await getDocs(q);
    
    const docs = snap.docs;
    const hasMore = docs.length > pageSize;
    const results = (hasMore ? docs.slice(0, pageSize) : docs).map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    // Filter legacy records in-memory if default hostel (until migration)
    let filteredResults = results;
    if (hostelId === "primary-hostel") {
      filteredResults = results.filter(s => !s.hostelId || s.hostelId === "primary-hostel");
    }

    // Filter by room in-memory for now (complex query would need more indexes)
    if (filterRoom === "none") filteredResults = filteredResults.filter((s) => !s.assignedRoomId);
    else if (filterRoom !== "all") filteredResults = filteredResults.filter((s) => s.assignedRoomId === filterRoom);

    // Apply simple search filter in-memory if provided
    // Note: This is not ideal for pagination, but Firestore text search is limited.
    if (search) {
      const q2 = search.toLowerCase();
      filteredResults = filteredResults.filter(
        (s) =>
          s.name?.toLowerCase().includes(q2) ||
          s.email?.toLowerCase().includes(q2) ||
          s.enrollmentId?.toLowerCase().includes(q2)
      );
    }

    const nextCursor = hasMore ? docs[pageSize - 1].id : null;

    return { 
      students: filteredResults, 
      nextCursor, 
      hasMore,
      totalCount: results.length // This is just the count for current fetch
    };
  } catch (error) {
    console.error("Error in getAllStudents:", error);
    throw error;
  }
}

export async function createStudent(data) {
  const { name, email, phone, enrollmentId, status, joinedDate, uid, hostelId } = data;
  
  const studentData = {
    name: name || "",
    email: email || "",
    phone: phone || "",
    enrollmentId: enrollmentId || "",
    role: "student",
    status: status || "Active",
    joinedDate: joinedDate || null,
    assignedRoomId: null,
    hostelId: hostelId || "primary-hostel",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (uid) {
    await setDoc(doc(db, "users", uid), studentData);
    return uid;
  } else {
    const docRef = await addDoc(collection(db, "users"), studentData);
    return docRef.id;
  }
}

export async function updateStudent(uid, data) {
  const allowed = ["name", "phone", "enrollmentId", "status", "joinedDate", "emergencyContact", "guardianName", "address", "profileImage"];
  const sanitized = {};
  for (const key of allowed) {
    if (data[key] !== undefined) sanitized[key] = data[key];
  }
  await updateDoc(doc(db, "users", uid), { ...sanitized, updatedAt: serverTimestamp() });
}

export async function deleteStudent(uid) {
  const student = await getUserById(uid);
  if (!student) return false;

  return await runTransaction(db, async (transaction) => {
    if (student.assignedRoomId) {
      const roomRef = doc(db, "rooms", student.assignedRoomId);
      transaction.update(roomRef, {
        occupants: arrayRemove(uid),
        status: "Available",
        updatedAt: serverTimestamp(),
      });
    }
    transaction.delete(doc(db, "users", uid));
    return true;
  });
}

// ─── ROOMS ───────────────────────────────────────────────────────────────────

export async function getAllRooms({ hostelId, includeAll = true } = {}) {
  try {
    let q = collection(db, "rooms");
    if (hostelId && hostelId !== "primary-hostel") {
      q = query(q, where("hostelId", "==", hostelId));
    }
    
    // FETCH DATA FIRST - Bypassing index requirements for sorting
    const snap = await getDocs(q);
    let rooms = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    if (hostelId === "primary-hostel") {
      rooms = rooms.filter(r => !r.hostelId || r.hostelId === "primary-hostel");
    }

    // SORT IN-MEMORY
    if (includeAll) {
      rooms.sort((a, b) => {
        const numA = (a.roomNumber || a.room_number || "").toString();
        const numB = (b.roomNumber || b.room_number || "").toString();
        return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
      });
    } else {
      // Filter Maintenance and sort by status
      rooms = rooms.filter(r => r.status !== "Maintenance");
      rooms.sort((a, b) => (a.status || "").localeCompare(b.status || ""));
    }
    return rooms;
  } catch (error) {
    console.error("Error in getAllRooms:", error);
    throw error;
  }
}

export async function getRoomById(roomId) {
  const snap = await getDoc(doc(db, "rooms", roomId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateRoom(roomId, data) {
  const ref = doc(db, "rooms", roomId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRoom(roomId) {
  const ref = doc(db, "rooms", roomId);
  await deleteDoc(ref);
}

// ─── ALLOCATIONS (ATOMIC) ─────────────────────────────────────────────────────

/**
 * Atomically allocates a student to a room:
 * 1. Validates capacity and student eligibility
 * 2. Updates room.occupants + room.status
 * 3. Updates user.assignedRoomId
 * 4. Creates an allocations record
 * 5. Auto-generates a fee record for current month
 */
export async function allocateStudentToRoom({ studentId, roomId, adminId }) {
  return await runTransaction(db, async (transaction) => {
    const studentRef = doc(db, "users", studentId);
    const roomRef = doc(db, "rooms", roomId);

    const [studentDoc, roomDoc] = await Promise.all([
      transaction.get(studentRef),
      transaction.get(roomRef),
    ]);

    if (!studentDoc.exists()) throw new Error("Student not found.");
    if (!roomDoc.exists()) throw new Error("Room not found.");

    const studentData = studentDoc.data();
    const roomData = roomDoc.data();

    if (studentData.assignedRoomId) throw new Error("Student is already assigned to a room. Deallocate first.");
    if (roomData.status === "Maintenance") throw new Error("Room is under maintenance.");

    const currentOccupants = roomData.occupants || [];
    if (currentOccupants.length >= roomData.capacity) throw new Error("Room is at full capacity.");

    const newOccupantCount = currentOccupants.length + 1;
    const newStatus = newOccupantCount >= roomData.capacity ? "Full" : "Available";

    // 1. Update room
    transaction.update(roomRef, {
      occupants: arrayUnion(studentId),
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    // 2. Update student
    transaction.update(studentRef, {
      assignedRoomId: roomId,
      updatedAt: serverTimestamp(),
    });

    // 3. Create allocation record
    const allocationRef = doc(collection(db, "allocations"));
    transaction.set(allocationRef, {
      studentId,
      studentName: studentData.name || "",
      roomId,
      roomNumber: roomData.roomNumber || "",
      hostelId: roomData.hostelId || "primary-hostel",
      allocatedAt: serverTimestamp(),
      deallocatedAt: null,
      status: "Active",
      allocatedBy: adminId || "system",
    });

    // 4. Auto-generate fee for current month
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 5); // 5th of next month
    const feeRef = doc(collection(db, "fees"));
    transaction.set(feeRef, {
      studentId,
      studentName: studentData.name || "",
      roomId,
      roomNumber: roomData.roomNumber || "",
      hostelId: roomData.hostelId || "primary-hostel",
      amount: roomData.price || 0,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      dueDate: Timestamp.fromDate(dueDate),
      status: "Pending",
      paidAt: null,
      paymentMethod: null,
      createdAt: serverTimestamp(),
    });

    return { allocationId: allocationRef.id };
  });
}

/**
 * Atomically removes a student from a room.
 * Updates room.occupants, room.status, user.assignedRoomId, and archives allocation.
 */
export async function deallocateStudent({ studentId, roomId, adminId }) {
  return await runTransaction(db, async (transaction) => {
    const studentRef = doc(db, "users", studentId);
    const roomRef = doc(db, "rooms", roomId);

    const [studentDoc, roomDoc] = await Promise.all([
      transaction.get(studentRef),
      transaction.get(roomRef),
    ]);

    if (!studentDoc.exists()) throw new Error("Student not found.");
    if (!roomDoc.exists()) throw new Error("Room not found.");

    // Update room
    transaction.update(roomRef, {
      occupants: arrayRemove(studentId),
      status: "Available",
      updatedAt: serverTimestamp(),
    });

    // Update student
    transaction.update(studentRef, {
      assignedRoomId: null,
      updatedAt: serverTimestamp(),
    });

    // Find and archive active allocation (best effort — outside transaction)
    return { success: true };
  });
}

// ─── FEES ─────────────────────────────────────────────────────────────────────

/**
 * Computes the effective fee status.
 * Does not mutate Firestore — returns derived value.
 */
export function computeFeeStatus(fee) {
  if (fee.status === "Paid") return "Paid";
  const now = new Date();
  const due = fee.dueDate?.toDate ? fee.dueDate.toDate() : new Date(fee.dueDate);
  if (due < now) return "Overdue";
  return "Pending";
}

export async function getAllFees({ hostelId, studentId, month, year, status } = {}) {
  try {
    let q = query(collection(db, "fees"));
    // FIX: Avoid strict equality when legacy records lacked hostelId
    if (hostelId && hostelId !== "primary-hostel") q = query(q, where("hostelId", "==", hostelId));
    if (studentId) q = query(q, where("studentId", "==", studentId));
    if (month && !isNaN(parseInt(month))) q = query(q, where("month", "==", parseInt(month)));
    if (year && !isNaN(parseInt(year))) q = query(q, where("year", "==", parseInt(year)));

    const snap = await getDocs(q);
    let fees = snap.docs.map((d) => {
      const data = d.data();
      const computedStatus = computeFeeStatus({
        ...data,
        dueDate: data.dueDate,
      });
      return {
        id: d.id,
        ...data,
        dueDate: data.dueDate?.toDate?.()?.toISOString() || data.dueDate || null,
        paidAt: data.paidAt?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        status: computedStatus,
      };
    });

    // FIX: Filter legacy records in-memory if default hostel
    if (hostelId === "primary-hostel") {
      fees = fees.filter(f => !f.hostelId || f.hostelId === "primary-hostel");
    }

    // In-memory sort by createdAt desc
    fees.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (status && status !== "All") {
      fees = fees.filter((f) => f.status === status);
    }

    return fees;
  } catch (error) {
    console.error("Error in getAllFees:", error);
    throw error;
  }
}

export async function markFeeAsPaid(feeId, { paymentMethod }) {
  const feeRef = doc(db, "fees", feeId);
  await updateDoc(feeRef, {
    status: "Paid",
    paidAt: serverTimestamp(),
    paymentMethod: paymentMethod || "Cash",
    updatedAt: serverTimestamp(),
  });
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export async function getTransactions(hostelId, studentId) {
  try {
    let q = query(collection(db, "transactions"), orderBy("timestamp", "desc"));
    if (hostelId) q = query(q, where("hostelId", "==", hostelId));
    if (studentId) q = query(q, where("studentId", "==", studentId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate?.()?.toISOString() || null,
    }));
  } catch (err) {
    console.error("Error in getTransactions:", err);
    throw err;
  }
}

/**
 * Atomically processes a payment:
 * 1. Updates fee record to "Paid"
 * 2. Creates a permanent transaction log
 */
export async function processPayment(feeId, { studentId, studentName, amount, method, reference }) {
  return await runTransaction(db, async (transaction) => {
    const feeRef = doc(db, "fees", feeId);
    const feeSnap = await transaction.get(feeRef);
    if (!feeSnap.exists()) throw new Error("Fee record not found.");
    if (feeSnap.data().status === "Paid") throw new Error("Fee is already paid.");

    // 1. Update Fee
    transaction.update(feeRef, {
      status: "Paid",
      paidAt: serverTimestamp(),
      paymentMethod: method,
      updatedAt: serverTimestamp(),
      transactionId: reference
    });

    // 2. Create Transaction record
    const transRef = doc(collection(db, "transactions"));
    transaction.set(transRef, {
      feeId,
      studentId,
      studentName,
      hostelId: feeSnap.data().hostelId || "primary-hostel",
      amount: parseFloat(amount),
      method,
      reference,
      status: "Success",
      timestamp: serverTimestamp(),
    });

    return { transactionId: transRef.id };
  });
}

export async function getFeeById(id) {
  const snap = await getDoc(doc(db, "fees", id));
  if (!snap.exists()) return null;
  return { 
    id: snap.id, 
    ...snap.data(),
    dueDate: snap.data().dueDate?.toDate?.()?.toISOString() || snap.data().dueDate || null,
    paidAt: snap.data().paidAt?.toDate?.()?.toISOString() || null
  };
}

// ─── VISITORS ────────────────────────────────────────────────────────────────

export async function getAllVisitors({ hostelId, hostStudentId } = {}) {
  try {
    const visitorsCol = collection(db, "visitors");
    let q = query(visitorsCol);

    if (hostelId) {
      q = query(q, where("hostelId", "==", hostelId));
    }

    if (hostStudentId) {
      q = query(q, where("hostStudentId", "==", hostStudentId));
    }

    const snap = await getDocs(q);
    let visitorsList = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      checkIn: d.data().checkIn?.toDate?.()?.toISOString() || d.data().checkIn || null,
      checkOut: d.data().checkOut?.toDate?.()?.toISOString() || d.data().checkOut || null,
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    // In-memory sort by checkIn desc
    visitorsList.sort((a, b) => new Date(b.checkIn || 0) - new Date(a.checkIn || 0));

    return visitorsList;
  } catch (error) {
    console.error("Error in getAllVisitors:", error);
    throw error;
  }
}

export async function getVisitorById(id) {
  const snap = await getDoc(doc(db, "visitors", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createVisitor(data) {
  const { name, phone, hostStudentId, studentName, roomNo, purpose, type, hostelId } = data;
  const docRef = await addDoc(collection(db, "visitors"), {
    name: name || "",
    phone: phone || "",
    hostStudentId: hostStudentId || "",
    studentName: studentName || "",
    roomNo: roomNo || "",
    purpose: purpose || "",
    type: type || "Personal",
    hostelId: hostelId || "primary-hostel",
    status: "Inside",
    checkIn: serverTimestamp(),
    checkOut: null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateVisitorStatus(visitorId, { status }) {
  const ref = doc(db, "visitors", visitorId);
  const updates = { status };
  if (status === "Departed") {
    updates.checkOut = serverTimestamp();
  }
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
}

export async function updateVisitor(visitorId, data) {
  const ref = doc(db, "visitors", visitorId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteVisitor(visitorId) {
  const ref = doc(db, "visitors", visitorId);
  await deleteDoc(ref);
}

// ─── COMPLAINTS ───────────────────────────────────────────────────────────────

export async function getAllComplaints({ hostelId, studentId, status } = {}) {
  try {
    let q = query(collection(db, "complaints"));
    // FIX: Bypass where filter for primary hostel to allow old records missing the field
    if (hostelId && hostelId !== "primary-hostel") q = query(q, where("hostelId", "==", hostelId));
    if (studentId) q = query(q, where("studentId", "==", studentId));
    if (status && status !== "All") q = query(q, where("status", "==", status));

    const snap = await getDocs(q);
    let complaints = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));

    // FIX: Show complaints matching standard or legacy (null)
    if (hostelId === "primary-hostel") {
      complaints = complaints.filter(c => !c.hostelId || c.hostelId === "primary-hostel");
    }

    // In-memory sort by createdAt desc
    complaints.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return complaints;
  } catch (error) {
    console.error("Error in getAllComplaints:", error);
    throw error;
  }
}

export async function createComplaint({ hostelId, studentId, studentName, roomNumber, subject, description, category, priority }) {
  if (!studentId || !subject || !description) throw new Error("Missing required fields.");
  const docRef = await addDoc(collection(db, "complaints"), {
    hostelId: hostelId || "primary-hostel",
    studentId,
    studentName: studentName || "Unknown",
    roomNumber: roomNumber || "",
    subject,
    description,
    category: category || "Other",
    priority: priority || "Normal",
    status: "Open",
    response: "",
    internalNotes: "",
    createdAt: serverTimestamp(),
    updatedAt: null,
  });
  return docRef.id;
}

export async function updateComplaint(complaintId, { status, response, internalNotes }) {
  const updates = { updatedAt: serverTimestamp() };
  if (status !== undefined) updates.status = status;
  if (response !== undefined) updates.response = response;
  if (internalNotes !== undefined) updates.internalNotes = internalNotes;
  await updateDoc(doc(db, "complaints", complaintId), updates);
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

export async function getDashboardStats(hostelId) {
  const constraints = hostelId ? [where("hostelId", "==", hostelId)] : [];
  
  const [usersCountSnap, roomsSnap, feesSnap, complaintsSnap, allocationsSnap, transactionsSnap] = await Promise.all([
    getCountFromServer(query(collection(db, "users"), where("role", "==", "student"), ...constraints)),
    getDocs(query(collection(db, "rooms"), ...constraints)),
    getDocs(query(collection(db, "fees"), ...constraints)),
    getDocs(query(collection(db, "complaints"), ...constraints)),
    getDocs(query(collection(db, "allocations"), ...constraints)), // Removed orderBy
    getDocs(query(collection(db, "transactions"), ...constraints)) // Removed orderBy
  ]);

  const rooms = roomsSnap.docs.map((d) => d.data());
  const fees = feesSnap.docs.map((d) => d.data());
  const complaints = complaintsSnap.docs.map((d) => d.data());

  const totalStudents = usersCountSnap.data().count;
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === "Full").length;
  const availableRooms = rooms.filter((r) => r.status === "Available").length;
  const occupancyPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const pendingComplaints = complaints.filter(c => c.status === "Open").length;

  // Revenue: sum paid fees by month
  const revenueByMonth = {};
  fees.forEach((fee) => {
    const key = `${fee.year}-${String(fee.month).padStart(2, "0")}`;
    if (!revenueByMonth[key]) revenueByMonth[key] = { collected: 0, pending: 0 };
    const status = computeFeeStatus(fee);
    if (status === "Paid") {
      revenueByMonth[key].collected += Number(fee.amount) || 0;
    } else {
      revenueByMonth[key].pending += Number(fee.amount) || 0;
    }
  });

  const totalRevenue = Object.values(revenueByMonth).reduce((sum, m) => sum + m.collected, 0);

  // Convert revenueByMonth object to a sorted array for the frontend
  const revenueByMonthArray = Object.entries(revenueByMonth)
    .map(([key, val]) => {
      const [year, month] = key.split("-");
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        month: d.toLocaleString("en-US", { month: "short" }),
        year: parseInt(year),
        collected: val.collected,
        pending: val.pending,
        key
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  // Last 6 months of chart data
  const now = new Date();
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthName = d.toLocaleString("en-US", { month: "short" });
    chartData.push({
      month: monthName,
      collected: revenueByMonth[key]?.collected || 0,
      pending: revenueByMonth[key]?.pending || 0,
    });
  }

  // Complaints by category
  const complaintsByCategoryMap = {
    Plumbing: 0,
    Electrical: 0,
    WiFi: 0,
    Noise: 0,
    Cleaning: 0,
    Other: 0
  };
  complaints.forEach(c => {
    const cat = c.category || "Other";
    if (complaintsByCategoryMap[cat] !== undefined) {
      complaintsByCategoryMap[cat]++;
    } else {
      complaintsByCategoryMap["Other"]++;
    }
  });
  const complaintsByCategory = Object.entries(complaintsByCategoryMap).map(([category, count]) => ({ category, count }));

  // Recent Activity — Now with manual in-memory sorting
  let recentActivity = [];
  
  // Sort allocations and transactions in memory before slicing
  const sortedAllocations = allocationsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.allocatedAt?.toMillis?.() || 0) - (a.allocatedAt?.toMillis?.() || 0));

  const sortedTransactions = transactionsSnap.docs
     .map(d => ({ id: d.id, ...d.data() }))
     .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));

  sortedAllocations.slice(0, 3).forEach(data => {
    recentActivity.push({
      action: `Allocated ${data.studentName || 'Student'} to Room ${data.roomNumber || ''}`,
      time: data.allocatedAt?.toDate?.()?.toLocaleString() || new Date().toLocaleString(),
      dateObj: data.allocatedAt?.toDate?.() || new Date(0)
    });
  });

  sortedTransactions.slice(0, 3).forEach(data => {
    recentActivity.push({
      action: `Payment of $${data.amount} received from ${data.studentName || 'Student'}`,
      time: data.timestamp?.toDate?.()?.toLocaleString() || new Date().toLocaleString(),
      dateObj: data.timestamp?.toDate?.() || new Date(0)
    });
  });

  complaintsSnap.docs
    .map(d => d.data())
    .filter(d => d.createdAt)
    .sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    .slice(0, 3)
    .forEach(data => {
      recentActivity.push({
        action: `New complaint filed: ${data.subject}`,
        time: data.createdAt?.toDate?.()?.toLocaleString() || new Date().toLocaleString(),
        dateObj: data.createdAt?.toDate?.() || new Date(0)
      });
    });

  recentActivity.sort((a, b) => b.dateObj - a.dateObj);
  recentActivity = recentActivity.slice(0, 6); // Keep top 6 most recent
  
  // Remove the temporary dateObj to pass pure JSON to Next.js
  recentActivity = recentActivity.map(r => ({ action: r.action, time: r.time }));

  return {
    totalStudents,
    totalRooms,
    occupiedRooms,
    availableRooms,
    occupancyPct,
    pendingComplaints,
    totalRevenue,
    chartData,
    revenueByMonth: revenueByMonthArray, // For detailed reports (now as array)
    complaintsByCategory,
    recentActivity
  };
}

export async function updateUserProfile(uid, data) {
  // Students can update limited fields
  const allowed = ["phone", "emergencyContact", "name", "guardianName", "address", "profileImage"];
  const sanitized = {};
  for (const key of allowed) {
    if (data[key] !== undefined) sanitized[key] = data[key];
  }
  await updateDoc(doc(db, "users", uid), { ...sanitized, updatedAt: serverTimestamp() });
}

// ─── NOTICES ─────────────────────────────────────────────────────────────────

export async function getAllNotices(hostelId) {
  try {
    const noticesCol = collection(db, "notices");
    // FIX: If primary-hostel, fetch all to retrieve legacy notices, filter below
    const q = (hostelId && hostelId !== "primary-hostel")
      ? query(noticesCol, where("hostelId", "==", hostelId))
      : query(noticesCol);
    const snap = await getDocs(q);
    const notices = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }));

    // FIX: Legacy compatibility
    if (hostelId === "primary-hostel") {
      notices = notices.filter(n => !n.hostelId || n.hostelId === "primary-hostel");
    }

    notices.sort((a, b) => {
      const da = a.date ? new Date(a.date) : new Date(0);
      const db2 = b.date ? new Date(b.date) : new Date(0);
      return db2 - da;
    });
    return notices;
  } catch (error) {
    console.error("Error in getAllNotices:", error);
    throw error;
  }
}

export async function getNoticeById(id) {
  const snap = await getDoc(doc(db, "notices", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createNotice(data) {
  const { title, description, date, priority, hostelId } = data;
  const docRef = await addDoc(collection(db, "notices"), {
    title,
    description,
    date,
    priority: priority || "normal",
    hostelId: hostelId || "primary-hostel",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ─── COMPLAINTS (ADDITIONAL) ──────────────────────────────────────────────────

export async function getComplaintById(id) {
  const snap = await getDoc(doc(db, "complaints", id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { 
    id: snap.id, 
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
  };
}

export async function deleteComplaint(id) {
  const ref = doc(db, "complaints", id);
  await deleteDoc(ref);
}

// ─── HOSTELS ─────────────────────────────────────────────────────────────────

export async function getAllHostels(adminId) {
  let q = collection(db, "hostels");
  if (adminId) {
    q = query(q, where("adminId", "==", adminId));
  }
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getHostelsWithStats(adminId) {
  let hostelsQuery = collection(db, "hostels");
  if (adminId) {
    hostelsQuery = query(hostelsQuery, where("adminId", "==", adminId));
  }
  const hostelsSnap = await getDocs(hostelsQuery);
  const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
  
  const studentCounts = {};
  usersSnap.docs.forEach(d => {
    const hid = d.data().hostelId;
    if (hid) studentCounts[hid] = (studentCounts[hid] || 0) + 1;
  });

  return hostelsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      totalStudents: studentCounts[doc.id] || 0,
      status: data.status || "Active"
    };
  });
}

export async function getHostelById(id) {
  const snap = await getDoc(doc(db, "hostels", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ─── JOIN CODE HELPERS ───────────────────────────────────────────────────────

function _generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "HST";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code; // e.g. "HSTAB23X"
}

export async function generateUniqueJoinCode() {
  let attempts = 0;
  while (attempts < 10) {
    const code = _generateCode();
    const q = query(collection(db, "hostels"), where("joinCode", "==", code));
    const snap = await getDocs(q);
    if (snap.empty) return code;
    attempts++;
  }
  throw new Error("Could not generate a unique join code. Please try again.");
}

export async function createHostel(data) {
  const { hostelName, ownerName, address, contactNumber, capacity, adminId } = data;
  const joinCode = await generateUniqueJoinCode();
  const docRef = await addDoc(collection(db, "hostels"), {
    hostelName,
    ownerName,
    address,
    contactNumber,
    capacity: parseInt(capacity) || 0,
    adminId: adminId || null,
    joinCode,
    autoApprove: false,
    status: "Active",
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, joinCode };
}

export async function regenerateJoinCode(hostelId) {
  const code = await generateUniqueJoinCode();
  await updateDoc(doc(db, "hostels", hostelId), { joinCode: code, updatedAt: serverTimestamp() });
  return code;
}

export async function updateHostelSettings(hostelId, settings) {
  const allowed = ["autoApprove", "status", "hostelName", "address", "contactNumber", "capacity"];
  const sanitized = {};
  for (const key of allowed) {
    if (settings[key] !== undefined) sanitized[key] = settings[key];
  }
  await updateDoc(doc(db, "hostels", hostelId), { ...sanitized, updatedAt: serverTimestamp() });
}

export async function getHostelByJoinCode(code) {
  const q = query(collection(db, "hostels"), where("joinCode", "==", code.toUpperCase().trim()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function validateJoinCode(code) {
  if (!code) return null;

  const hostel = await getHostelByJoinCode(code);
  if (!hostel) return null;

  return {
    ...hostel,
    createdAt: hostel.createdAt?.toDate?.()?.toISOString() || hostel.createdAt || null,
    updatedAt: hostel.updatedAt?.toDate?.()?.toISOString() || hostel.updatedAt || null,
  };
}

export async function searchHostelsByName(searchQuery) {
  // Returns only public-safe fields — no joinCode
  if (!searchQuery || searchQuery.trim().length < 2) return [];
  const snap = await getDocs(collection(db, "hostels"));
  const q = searchQuery.toLowerCase().trim();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(h => h.status !== "Inactive" && (
      h.hostelName?.toLowerCase().includes(q) ||
      h.address?.toLowerCase().includes(q)
    ))
    .map(h => ({
      id: h.id,
      hostelName: h.hostelName,
      address: h.address,
      capacity: h.capacity,
    }))
    .slice(0, 10);
}

export async function createRoom(data) {
  const { roomNumber, capacity, price, floor, type, status, hostelId } = data;
  const docRef = await addDoc(collection(db, "rooms"), {
    roomNumber,
    capacity: parseInt(capacity) || 1,
    price: parseFloat(price) || 0,
    floor: floor || "",
    type: type || "Standard",
    status: status || "Available",
    occupants: [],
    hostelId: hostelId || "primary-hostel",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// ─── VISITOR REQUESTS (PRE-REGISTRATION) ──────────────────────────────────────

export async function getAllVisitorRequests({ hostelId, studentId, status } = {}) {
  try {
    let q = query(collection(db, "visitorRequests"));
    if (hostelId) q = query(q, where("hostelId", "==", hostelId));
    if (studentId) q = query(q, where("studentId", "==", studentId));
    if (status && status !== "All") q = query(q, where("status", "==", status.toLowerCase()));

    const snap = await getDocs(q);
    let requests = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      visitDate: d.data().visitDate?.toDate?.()?.toISOString() || d.data().visitDate || null,
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));

    requests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return requests;
  } catch (error) {
    console.error("Error in getAllVisitorRequests:", error);
    throw error;
  }
}

export async function createVisitorRequest(data) {
  const { 
    hostelId, studentId, studentName, roomNo, 
    visitorName, visitorPhone, relation, 
    visitDate, visitTime, duration, purpose, notes 
  } = data;

  const docRef = await addDoc(collection(db, "visitorRequests"), {
    hostelId: hostelId || "primary-hostel",
    studentId,
    studentName: studentName || "Unknown",
    roomNo: roomNo || "",
    visitorName: visitorName || "",
    visitorPhone: visitorPhone || "",
    relation: relation || "Other",
    visitDate: visitDate ? Timestamp.fromDate(new Date(visitDate)) : null,
    visitTime: visitTime || "Morning",
    duration: duration || "1 hour",
    purpose: purpose || "Personal",
    notes: notes || "",
    status: "pending",
    adminNote: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateVisitorRequestStatus(requestId, { status, adminNote }) {
  const ref = doc(db, "visitorRequests", requestId);
  const updates = { 
    status: status.toLowerCase(),
    adminNote: adminNote || "",
    updatedAt: serverTimestamp() 
  };
  await updateDoc(ref, updates);
  return true;
}

export async function deleteVisitorRequest(requestId) {
  const ref = doc(db, "visitorRequests", requestId);
  await deleteDoc(ref);
  return true;
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function createNotification({
  hostelId,
  recipientId,
  recipientRole,
  senderId = "system",
  senderRole = "system",
  senderName = "System",
  type,
  title,
  message,
  actionUrl = ""
}) {
  const docRef = await addDoc(collection(db, "notifications"), {
    hostelId: hostelId || "primary-hostel",
    recipientId,
    recipientRole,
    senderId,
    senderRole,
    senderName,
    type,
    title,
    message,
    actionUrl,
    isRead: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getNotifications({ hostelId, userId, role }) {
  try {
    let notifications = [];

    if (role === "admin") {
      let q = query(collection(db, "notifications"));
      if (hostelId) q = query(q, where("hostelId", "==", hostelId));
      q = query(q, where("recipientRole", "==", "admin"));
      const snap = await getDocs(q);
      notifications = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
      }));
    } else if (userId) {
      let qPersonal = query(collection(db, "notifications"));
      if (hostelId) qPersonal = query(qPersonal, where("hostelId", "==", hostelId));
      qPersonal = query(qPersonal, where("recipientId", "==", userId));
      
      let qGlobal = query(collection(db, "notifications"));
      if (hostelId) qGlobal = query(qGlobal, where("hostelId", "==", hostelId));
      qGlobal = query(qGlobal, where("recipientId", "==", "all_students"));

      const [snapPersonal, snapGlobal] = await Promise.all([getDocs(qPersonal), getDocs(qGlobal)]);
      
      notifications = [
        ...snapPersonal.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null })),
        ...snapGlobal.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null }))
      ];
    }
    
    notifications.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId) {
  const ref = doc(db, "notifications", notificationId);
  await updateDoc(ref, { isRead: true });
}

export async function deleteNotification(notificationId) {
  const ref = doc(db, "notifications", notificationId);
  await deleteDoc(ref);
}

export async function markAllNotificationsAsRead({ userId, hostelId, role }) {
  let q;
  if (role === "admin") {
    q = query(collection(db, "notifications"), where("recipientRole", "==", "admin"), where("isRead", "==", false));
    if (hostelId) q = query(q, where("hostelId", "==", hostelId));
  } else {
    q = query(collection(db, "notifications"), where("recipientId", "==", userId), where("isRead", "==", false));
    if (hostelId) q = query(q, where("hostelId", "==", hostelId));
  }
  
  const snap = await getDocs(q);
  const promises = snap.docs.map(d => updateDoc(d.ref, { isRead: true }));
  await Promise.all(promises);
}

export async function getUnreadNotificationCount({ userId, hostelId, role }) {
  try {
    let q;
    if (role === "admin") {
      q = query(collection(db, "notifications"), where("recipientRole", "==", "admin"), where("isRead", "==", false));
      if (hostelId) q = query(q, where("hostelId", "==", hostelId));
    } else {
      q = query(collection(db, "notifications"), where("recipientId", "==", userId), where("isRead", "==", false));
      if (hostelId) q = query(q, where("hostelId", "==", hostelId));
    }
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch (error) {
    console.error("Error in getUnreadNotificationCount:", error);
    return 0;
  }
}

export async function clearHostelNotifications({ userId, hostelId, role }) {
  let q;
  if (role === "admin") {
    q = query(collection(db, "notifications"), where("recipientRole", "==", "admin"));
    if (hostelId) q = query(q, where("hostelId", "==", hostelId));
  } else {
    q = query(collection(db, "notifications"), where("recipientId", "==", userId));
    if (hostelId) q = query(q, where("hostelId", "==", hostelId));
  }

  const snap = await getDocs(q);
  const promises = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(promises);
}

// ─── HOSTEL MEMBERS & JOIN SYSTEM ────────────────────────────────────────────

/**
 * Add a student as a member of a hostel (atomic operation).
 * Updates both hostelMembers collection and user's hostelId.
 */
export async function addHostelMember({ userId, hostelId, role = "member", status = "approved" }) {
  return await runTransaction(db, async (transaction) => {
    // 1. Create hostelMember record
    const memberRef = doc(collection(db, "hostelMembers"));
    transaction.set(memberRef, {
      userId,
      hostelId,
      role,
      status,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Update user's hostelId (for easy lookup)
    const userRef = doc(db, "users", userId);
    transaction.update(userRef, {
      hostelId,
      updatedAt: serverTimestamp(),
    });

    // 3. Create notification for admin
    const hostelRef = doc(db, "hostels", hostelId);
    const hostelSnap = await transaction.get(hostelRef);
    const hostelData = hostelSnap.data();

    const notifRef = doc(collection(db, "notifications"));
    transaction.set(notifRef, {
      hostelId,
      recipientRole: "admin",
      senderId: "system",
      senderRole: "system",
      senderName: "System",
      type: "member_added",
      title: "New Member Joined",
      message: `A new student has joined your hostel`,
      actionUrl: `/admin/students`,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return memberRef.id;
  });
}

/**
 * Get all members of a hostel with user details.
 */
export async function getHostelMembers({ hostelId, status = null }) {
  try {
    let q = query(collection(db, "hostelMembers"), where("hostelId", "==", hostelId));
    if (status) {
      q = query(q, where("status", "==", status));
    }

    const snap = await getDocs(q);
    const members = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Enrich with user details
    const enrichedMembers = await Promise.all(
      members.map(async (m) => {
        const userSnap = await getDoc(doc(db, "users", m.userId));
        const userData = userSnap.exists() ? userSnap.data() : null;
        return {
          ...m,
          userName: userData?.name || "Unknown",
          userEmail: userData?.email || "",
          enrollmentId: userData?.enrollmentId || "",
        };
      })
    );

    return enrichedMembers;
  } catch (error) {
    console.error("Error in getHostelMembers:", error);
    throw error;
  }
}

/**
 * Get all hostels a student has joined (approved members).
 */
export async function getUserHostels(userId) {
  try {
    const q = query(
      collection(db, "hostelMembers"),
      where("userId", "==", userId),
      where("status", "==", "approved")
    );
    const snap = await getDocs(q);
    const members = snap.docs.map((d) => d.data());

    // Get hostel details
    const hostels = await Promise.all(
      members.map(async (m) => {
        const hostelSnap = await getDoc(doc(db, "hostels", m.hostelId));
        const hostelData = hostelSnap.exists() ? hostelSnap.data() : null;
        return {
          id: m.hostelId,
          ...hostelData,
          joinedAt: m.joinedAt?.toDate?.()?.toISOString() || null,
        };
      })
    );

    return hostels;
  } catch (error) {
    console.error("Error in getUserHostels:", error);
    throw error;
  }
}

/**
 * Check if a student is already a member of a hostel.
 * Returns { isMember: boolean, status: "pending" | "approved" | "rejected" | null }
 */
export async function getHostelMemberStatus(userId, hostelId) {
  try {
    const q = query(
      collection(db, "hostelMembers"),
      where("userId", "==", userId),
      where("hostelId", "==", hostelId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return { isMember: false, status: null };

    const data = snap.docs[0].data();
    return { isMember: true, status: data.status };
  } catch (error) {
    console.error("Error in getHostelMemberStatus:", error);
    throw error;
  }
}

/**
 * Atomic operation: Join hostel via join code.
 * If hostel has autoApprove=true, member is immediately approved.
 * Otherwise, enters pending state and admin must approve.
 */
export async function joinHostelByCode({ userId, joinCode }) {
  return await runTransaction(db, async (transaction) => {
    // 1. Find hostel by join code
    const hostelsRef = collection(db, "hostels");
    const q = query(hostelsRef, where("joinCode", "==", joinCode.toUpperCase().trim()));
    const hostelsSnap = await getDocs(q);
    
    if (hostelsSnap.empty) {
      throw new Error("Invalid join code. Hostel not found.");
    }

    const hostelDoc = hostelsSnap.docs[0];
    const hostelId = hostelDoc.id;
    const hostelData = hostelDoc.data();

    if (hostelData.status === "Inactive") {
      throw new Error("This hostel is no longer active.");
    }

    // 2. Check if user is already a member
    const membersQ = query(
      collection(db, "hostelMembers"),
      where("userId", "==", userId),
      where("hostelId", "==", hostelId)
    );
    const membersSnap = await getDocs(membersQ);
    
    if (!membersSnap.empty) {
      const existingMember = membersSnap.docs[0].data();
      if (existingMember.status === "approved") {
        throw new Error("You are already a member of this hostel.");
      }
      if (existingMember.status === "pending") {
        throw new Error("Your join request is pending approval.");
      }
      if (existingMember.status === "rejected") {
        throw new Error("Your previous request was rejected. Contact the hostel admin.");
      }
    }

    // 3. Create hostelMember record
    const memberRef = doc(collection(db, "hostelMembers"));
    const initialStatus = hostelData.autoApprove ? "approved" : "pending";
    
    transaction.set(memberRef, {
      userId,
      hostelId,
      role: "member",
      status: initialStatus,
      joinedAt: serverTimestamp(),
      joinCode: joinCode.toUpperCase().trim(),
      updatedAt: serverTimestamp(),
    });

    // 4. If auto-approve, update user's hostelId
    if (hostelData.autoApprove) {
      const userRef = doc(db, "users", userId);
      transaction.update(userRef, {
        hostelId,
        updatedAt: serverTimestamp(),
      });
    }

    // 5. Send appropriate notification
    const notifRef = doc(collection(db, "notifications"));
    if (hostelData.autoApprove) {
      // Auto-approved: notify student and admin
      transaction.set(notifRef, {
        hostelId,
        recipientId: userId,
        recipientRole: "student",
        senderId: "system",
        senderRole: "system",
        senderName: "System",
        type: "hostel_joined",
        title: "Successfully Joined Hostel",
        message: `You have been added to ${hostelData.hostelName}`,
        actionUrl: `/student/dashboard`,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    } else {
      // Pending: notify admin
      transaction.set(notifRef, {
        hostelId,
        recipientRole: "admin",
        senderId: "system",
        senderRole: "system",
        senderName: "System",
        type: "join_request_pending",
        title: "New Join Request",
        message: `A student has requested to join your hostel`,
        actionUrl: `/admin/notifications`,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    }

    return {
      hostelId,
      hostelName: hostelData.hostelName,
      status: initialStatus,
      memberId: memberRef.id,
    };
  });
}

/**
 * Create a request to join hostel (without code).
 * Can be used for students who found the hostel via search.
 */
export async function createJoinRequest({ userId, userName, hostelId }) {
  try {
    // Check if already a member
    const memberStatus = await getHostelMemberStatus(userId, hostelId);
    if (memberStatus.isMember) {
      throw new Error("You have already requested or are a member of this hostel.");
    }

    const docRef = await addDoc(collection(db, "joinRequests"), {
      userId,
      userName,
      hostelId,
      status: "pending",
      requestedAt: serverTimestamp(),
      respondedAt: null,
    });

    // Notify admin
    const hostelSnap = await getDoc(doc(db, "hostels", hostelId));
    const hostelData = hostelSnap.data();

    await addDoc(collection(db, "notifications"), {
      hostelId,
      recipientRole: "admin",
      senderId: "system",
      senderRole: "system",
      senderName: "System",
      type: "join_request",
      title: "New Join Request",
      message: `${userName} has requested to join your hostel`,
      actionUrl: `/admin/select-hostel/${hostelId}?tab=requests`,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error in createJoinRequest:", error);
    throw error;
  }
}

/**
 * Get pending join requests for a hostel.
 */
export async function getJoinRequests({ hostelId, status = null }) {
  try {
    let q = collection(db, "joinRequests");
    if (hostelId && hostelId !== "primary-hostel") q = query(q, where("hostelId", "==", hostelId));
    if (status) {
      q = query(q, where("status", "==", status));
    }

    const snap = await getDocs(q);
    const requests = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      requestedAt: d.data().requestedAt?.toDate?.()?.toISOString() || null,
      respondedAt: d.data().respondedAt?.toDate?.()?.toISOString() || null,
    }));

    if (hostelId === "primary-hostel") {
      requests = requests.filter(r => !r.hostelId || r.hostelId === "primary-hostel");
    }

    requests.sort((a, b) => new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0));
    return requests;
  } catch (error) {
    console.error("Error in getJoinRequests:", error);
    throw error;
  }
}

export async function getStudentJoinRequest({ userId }) {
  if (!userId) return null;

  const q = query(collection(db, "joinRequests"), where("userId", "==", userId));
  const snap = await getDocs(q);

  if (snap.empty) return null;

  const requests = snap.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
      requestedAt: d.data().requestedAt?.toDate?.()?.toISOString() || null,
      respondedAt: d.data().respondedAt?.toDate?.()?.toISOString() || null,
    }))
    .sort((a, b) => new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0));

  return requests[0];
}

/**
 * Approve a join request (atomic operation).
 */
export async function approveJoinRequest({ requestId, userId, hostelId }) {
  return await runTransaction(db, async (transaction) => {
    const requestRef = doc(db, "joinRequests", requestId);
    const requestSnap = await transaction.get(requestRef);
    
    if (!requestSnap.exists()) {
      throw new Error("Join request not found.");
    }

    const requestData = requestSnap.data();
    if (requestData.status !== "pending") {
      throw new Error("This request has already been processed.");
    }

    // 1. Update join request to approved
    transaction.update(requestRef, {
      status: "approved",
      respondedAt: serverTimestamp(),
    });

    // 2. Create hostelMember record
    const memberRef = doc(collection(db, "hostelMembers"));
    transaction.set(memberRef, {
      userId: requestData.userId,
      hostelId,
      role: "member",
      status: "approved",
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 3. Update user's hostelId
    const userRef = doc(db, "users", requestData.userId);
    transaction.update(userRef, {
      hostelId,
      updatedAt: serverTimestamp(),
    });

    // 4. Notify student
    const notifRef = doc(collection(db, "notifications"));
    const hostelSnap = await transaction.get(doc(db, "hostels", hostelId));
    const hostelData = hostelSnap.data();

    transaction.set(notifRef, {
      hostelId,
      recipientId: requestData.userId,
      recipientRole: "student",
      senderId: "system",
      senderRole: "system",
      senderName: "System",
      type: "request_approved",
      title: "Join Request Approved",
      message: `Your request to join ${hostelData.hostelName} has been approved!`,
      actionUrl: `/student/dashboard`,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return { memberId: memberRef.id };
  });
}

/**
 * Reject a join request.
 */
export async function rejectJoinRequest({ requestId, reason = "" }) {
  return await runTransaction(db, async (transaction) => {
    const requestRef = doc(db, "joinRequests", requestId);
    const requestSnap = await transaction.get(requestRef);
    
    if (!requestSnap.exists()) {
      throw new Error("Join request not found.");
    }

    const requestData = requestSnap.data();
    if (requestData.status !== "pending") {
      throw new Error("This request has already been processed.");
    }

    // Update request status
    transaction.update(requestRef, {
      status: "rejected",
      reason,
      respondedAt: serverTimestamp(),
    });

    // Notify student
    const notifRef = doc(collection(db, "notifications"));
    const hostelSnap = await transaction.get(doc(db, "hostels", requestData.hostelId));
    const hostelData = hostelSnap.data();

    transaction.set(notifRef, {
      hostelId: requestData.hostelId,
      recipientId: requestData.userId,
      recipientRole: "student",
      senderId: "system",
      senderRole: "system",
      senderName: "System",
      type: "request_rejected",
      title: "Join Request Rejected",
      message: `Your request to join ${hostelData.hostelName} could not be approved.`,
      actionUrl: `/student/select-hostel`,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return true;
  });
}

/**
 * Remove a member from a hostel.
 */
export async function removeHostelMember({ membershipId, userId, hostelId }) {
  return await runTransaction(db, async (transaction) => {
    // 1. Delete hostelMember record
    const memberRef = doc(db, "hostelMembers", membershipId);
    transaction.delete(memberRef);

    // 2. Clear user's hostelId (or set to null)
    const userRef = doc(db, "users", userId);
    transaction.update(userRef, {
      hostelId: null,
      updatedAt: serverTimestamp(),
    });

    // 3. Create notification
    const notifRef = doc(collection(db, "notifications"));
    transaction.set(notifRef, {
      hostelId,
      recipientId: userId,
      recipientRole: "student",
      senderId: "system",
      senderRole: "system",
      senderName: "System",
      type: "member_removed",
      title: "Removed from Hostel",
      message: "You have been removed from the hostel.",
      actionUrl: `/student/select-hostel`,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return true;
  });
}
