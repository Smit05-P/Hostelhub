import dbConnect from '@/lib/mongodb';
import Room from '@/models/Room';

export const roomService = {
  async getRooms(hostelId) {
    await dbConnect();
    return await Room.find({ hostelId })
      .select('roomNumber capacity rent status occupants floor type')
      .populate('occupants', 'name email roomId')
      .lean();
  },

  async getRoomById(id) {
    await dbConnect();
    return await Room.findById(id)
      .select('roomNumber capacity rent status occupants floor type')
      .populate('occupants', 'name email roomId')
      .lean();
  },

  async createRoom(data) {
    await dbConnect();
    return await Room.create(data);
  },

  async updateRoom(id, data) {
    await dbConnect();
    const room = await Room.findById(id);
    if (!room) return null;
    Object.assign(room, data);
    return await room.save();
  },

  async deleteRoom(id) {
    await dbConnect();
    return await Room.findByIdAndDelete(id);
  }
};
