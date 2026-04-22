import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import Room from '@/models/Room';

export const studentService = {
  async getStudents({ hostelId, search, roomId, status, hostelStatus, limit = 10, cursor }) {
    await dbConnect();

    let query = { hostelId };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (roomId && roomId !== 'all') {
      if (roomId === 'none') {
        query.roomId = { $exists: false };
      } else {
        query.roomId = roomId;
      }
    }

    if (status && status !== 'all') {
      const searchStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      query.status = searchStatus;
    }

    if (hostelStatus && hostelStatus !== 'all') {
      const searchHostelStatus = hostelStatus.charAt(0).toUpperCase() + hostelStatus.slice(1).toLowerCase();
      query.hostelStatus = searchHostelStatus;
    }

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const students = await Student.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('roomId', 'roomNumber capacity rent status')
      .lean();

    const hasNextPage = students.length > limit;
    if (hasNextPage) students.pop();

    const nextCursor = hasNextPage ? students[students.length - 1]._id : null;

    return { students, nextCursor };
  },

  async getStudentById(id) {
    await dbConnect();
    return await Student.findById(id)
      .populate('roomId', 'roomNumber capacity rent status')
      .lean();
  },

  async createStudent(data) {
    await dbConnect();
    const student = await Student.create(data);

    if (data.roomId) {
      await Room.findByIdAndUpdate(data.roomId, {
        $push: { occupants: student._id }
      });
    }

    return student;
  },

  async updateStudent(id, data) {
    await dbConnect();
    
    // Normalize roomId from possible frontend aliases
    const newRoomId = data.roomId || data.assignedRoomId;
    if (newRoomId) {
      data.roomId = newRoomId;
    }

    const student = await Student.findById(id);
    if (!student) throw new Error("Identity record not found.");

    const oldRoomIdStr = student.roomId?.toString();
    const newRoomIdStr = data.roomId?.toString();

    // Map new data to student document
    student.set(data);
    await student.save();

    // Handle room occupancy transition if roomId has changed
    if (data.roomId !== undefined && newRoomIdStr !== oldRoomIdStr) {
      if (oldRoomIdStr) {
        await Room.findByIdAndUpdate(oldRoomIdStr, {
          $pull: { occupants: id }
        });
      }
      if (newRoomIdStr) {
        await Room.findByIdAndUpdate(newRoomIdStr, {
          $push: { occupants: id }
        });
      }
    }

    return student;
  },

  async deleteStudent(id) {
    await dbConnect();
    const student = await Student.findById(id);
    if (student && student.roomId) {
      await Room.findByIdAndUpdate(student.roomId, {
        $pull: { occupants: id }
      });
    }
    return await Student.findByIdAndDelete(id);
  },

  async updateHostelStatus(studentId, hostelId, status, hostelStatus) {
    await dbConnect();
    return await Student.findByIdAndUpdate(studentId, {
      hostelId,
      status: status || 'Active',
      hostelStatus: hostelStatus || 'APPROVED'
    }, { new: true });
  }
};
