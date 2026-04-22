import dbConnect from '@/lib/mongodb';
import Hostel from '@/models/Hostel';
import Student from '@/models/Student';
import Room from '@/models/Room';
import Fee from '@/models/Fee';
import Complaint from '@/models/Complaint';
import Admin from '@/models/Admin';
import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);
const mapHostel = async (h) => {
  const studentCount = await Student.countDocuments({ hostelId: h._id, status: 'Active' });
  const admin = await Admin.findById(h.ownerId).select('name');
  return {
    _id: h._id.toString(),
    id: h._id.toString(),
    hostelName: h.name,
    address: h.address,
    ownerId: h.ownerId,
    ownerName: admin?.name || "Administrator",
    contactNumber: h.phone,
    capacity: h.capacity,
    joinCode: h.joinCode,
    status: h.status,
    autoApprove: h.autoApprove,
    totalStudents: studentCount,
    settings: h.settings,
    createdAt: h.createdAt
  };
};

export const hostelService = {
  async getHostelById(hostelId) {
    await dbConnect();
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return null;
    return await mapHostel(hostel);
  },

  async getHostelByOwner(ownerId) {
    await dbConnect();
    const hostels = await Hostel.find({ ownerId }).lean();
    return await Promise.all(hostels.map(h => mapHostel(h)));
  },

  async searchHostels(queryStr) {
    await dbConnect();
    const q = queryStr.toLowerCase();
    return await Hostel.find({
      status: 'Active',
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } }
      ]
    }).limit(10).select('name address settings');
  },

  async validateJoinCode(code) {
    await dbConnect();
    return await Hostel.findOne({
      joinCode: code.toUpperCase().trim(),
      status: 'Active'
    });
  },

  async updateHostelSettings(hostelId, settings) {
    await dbConnect();
    return await Hostel.findByIdAndUpdate(hostelId, {
      $set: { settings }
    }, { new: true });
  },

  async regenerateJoinCode(hostelId) {
    await dbConnect();
    const newCode = nanoid();
    return await Hostel.findByIdAndUpdate(hostelId, {
      joinCode: newCode
    }, { new: true });
  },

  async createHostel(data) {
    await dbConnect();
    const hostel = await Hostel.create({
      name: data.name,
      address: data.address,
      ownerId: data.ownerId,
      phone: data.phone,
      capacity: data.capacity || 0,
      autoApprove: data.autoApprove || false,
      settings: data.settings || {}
    });
    return await mapHostel(hostel);
  },

  async getDashboardStats(hostelId) {
    await dbConnect();

    const normalizedHostelId = new mongoose.Types.ObjectId(hostelId);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const trendMonths = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: date.toLocaleString('default', { month: 'short' }),
      };
    });

    const [
      totalStudents,
      upcomingVacancies,
      pendingComplaints,
      rooms,
      currentFees,
      monthlyFees,
    ] = await Promise.all([
      Student.countDocuments({ hostelId, status: 'Active' }),
      Student.countDocuments({ 
        hostelId, 
        status: 'Active', 
        termEndDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } 
      }),
      Complaint.countDocuments({ hostelId, status: 'Pending' }),
      Room.find({ hostelId })
        .select('roomNumber capacity occupants status rent')
        .lean(),
      Fee.find({
        hostelId,
        month: currentMonth,
        year: currentYear,
      })
        .select('amount status')
        .lean(),
      Fee.aggregate([
        {
          $match: {
            hostelId: normalizedHostelId,
            $or: trendMonths.map(({ month, year }) => ({ month, year })),
          },
        },
        {
          $group: {
            _id: { month: '$month', year: '$year' },
            collected: {
              $sum: {
                $cond: [{ $eq: ['$status', 'Paid'] }, '$amount', 0],
              },
            },
            pending: {
              $sum: {
                $cond: [{ $eq: ['$status', 'Pending'] }, '$amount', 0],
              },
            },
          },
        },
      ]),
    ]);

    const roomTotals = rooms.reduce(
      (acc, room) => {
        const capacity = room.capacity || 0;
        const occupiedBeds = room.occupants?.length || 0;

        acc.totalCapacity += capacity;
        acc.occupiedBeds += occupiedBeds;
        acc.totalRooms += 1;
        if (occupiedBeds >= capacity && capacity > 0) {
          acc.occupiedRooms += 1;
        }

        return acc;
      },
      { totalCapacity: 0, occupiedBeds: 0, totalRooms: 0, occupiedRooms: 0 }
    );

    const totalRevenue = currentFees.reduce(
      (sum, fee) => sum + (fee.status === 'Paid' ? fee.amount : 0),
      0
    );
    const pendingCollection = currentFees.reduce(
      (sum, fee) => sum + (fee.status === 'Pending' ? fee.amount : 0),
      0
    );

    const monthlyFeeMap = new Map(
      monthlyFees.map((item) => [`${item._id.month}-${item._id.year}`, item])
    );

    const chartData = trendMonths.map(({ month, year, label }) => {
      const bucket = monthlyFeeMap.get(`${month}-${year}`);
      return {
        month: label,
        collected: bucket?.collected || 0,
        pending: bucket?.pending || 0,
      };
    });

    const occupancyPct = roomTotals.totalCapacity > 0
      ? Math.round((roomTotals.occupiedBeds / roomTotals.totalCapacity) * 100)
      : 0;

    return {
      totalStudents,
      upcomingVacancies,
      totalRooms: roomTotals.totalRooms,
      occupiedRooms: roomTotals.occupiedRooms,
      availableRooms: Math.max(roomTotals.totalRooms - roomTotals.occupiedRooms, 0),
      totalRevenue,
      pendingComplaints,
      pendingCollection,
      occupancyPct,
      chartData,
    };
  }
};
