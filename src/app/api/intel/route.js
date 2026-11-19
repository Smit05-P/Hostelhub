import mongoose from "mongoose";
import { createIntelPostHandler } from "@/lib/intel-handler";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { hostelService } from "@/services/server/hostelService";
import { studentService } from "@/services/server/studentService";
import Hostel from "@/models/Hostel";
import Student from "@/models/Student";
import Complaint from "@/models/Complaint";
import Fee from "@/models/Fee";

const complaintStatuses = ["Pending", "In-Progress", "Resolved", "Closed"];

async function authorizeHostel(session, hostelId) {
  if (session.role === "super_admin") return true;
  if (session.role === "student") {
    return String(session.hostelId || "") === hostelId;
  }

  const hostel = await Hostel.findOne({
    _id: hostelId,
    ownerId: String(session.userId),
  }).select("_id").lean();

  return Boolean(hostel);
}

async function loadAdminContext(hostelId) {
  const [stats, studentResult, complaints, fees, complaintCounts] = await Promise.all([
    hostelService.getDashboardStats(hostelId),
    studentService.getStudents({ hostelId, limit: 100 }),
    Complaint.find({ hostelId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("subject status category priority roomNumber createdAt")
      .lean(),
    Fee.find({ hostelId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("studentName amount status month year dueDate")
      .lean(),
    Complaint.aggregate([
      { $match: { hostelId: new mongoose.Types.ObjectId(hostelId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const { students } = studentResult;
  const complaintStats = Object.fromEntries(complaintStatuses.map((status) => [status, 0]));
  for (const { _id, count } of complaintCounts) {
    if (Object.hasOwn(complaintStats, _id)) complaintStats[_id] = count;
  }

  return {
    stats,
    complaintStats,
    students: students.map((student) => ({
      name: student.name,
      status: student.status,
      room: student.roomNumber || student.roomId?.roomNumber || null,
    })),
    complaints: complaints.map((complaint) => ({
      subject: complaint.subject,
      status: complaint.status,
      category: complaint.category,
      priority: complaint.priority,
      roomNumber: complaint.roomNumber,
      createdAt: complaint.createdAt,
    })),
    fees: fees.map((fee) => ({
      studentName: fee.studentName || null,
      amount: fee.amount,
      status: fee.status,
      month: fee.month,
      year: fee.year,
      dueDate: fee.dueDate,
    })),
  };
}

async function loadStudentContext(userId, hostelId) {
  const student = await Student.findOne({ _id: userId, hostelId })
    .select("name status hostelStatus roomId")
    .populate("roomId", "roomNumber")
    .lean();

  if (!student) return null;

  const [complaints, fees, complaintCounts] = await Promise.all([
    Complaint.find({ hostelId, studentId: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("subject status category priority createdAt")
      .lean(),
    Fee.find({ hostelId, studentId: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("amount status month year dueDate")
      .lean(),
    Complaint.aggregate([
      {
        $match: {
          hostelId: new mongoose.Types.ObjectId(hostelId),
          studentId: new mongoose.Types.ObjectId(userId),
        },
      },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const complaintStats = Object.fromEntries(complaintStatuses.map((status) => [status, 0]));
  for (const { _id, count } of complaintCounts) {
    if (Object.hasOwn(complaintStats, _id)) complaintStats[_id] = count;
  }

  return {
    stats: {},
    complaintStats,
    students: [],
    student: {
      name: student.name,
      status: student.status,
      hostelStatus: student.hostelStatus,
      room: student.roomId?.roomNumber || null,
    },
    complaints,
    fees,
  };
}

export const POST = createIntelPostHandler({
  protect,
  dbConnect,
  authorizeHostel,
  loadAdminContext,
  loadStudentContext,
  getApiKey: () => process.env.OPENROUTER_API_KEY,
  fetch: (...args) => fetch(...args),
  logger: console,
});
