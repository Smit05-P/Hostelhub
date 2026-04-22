import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';

export const notificationService = {
  async getNotifications({ hostelId, recipientId, recipientRole, isRead, limit = 20, cursor }) {
    await dbConnect();
    
    let query = { hostelId };
    
    // Recipient filter can be specific ID or broadcast tags like 'all_students'
    if (recipientId) {
      if (Array.isArray(recipientId)) {
        query.recipientId = { $in: recipientId };
      } else {
        query.recipientId = { $in: [recipientId, `all_${recipientRole}s`] };
      }
    }
    
    if (recipientRole) query.recipientRole = recipientRole;
    if (typeof isRead === 'boolean') query.isRead = isRead;
    
    if (cursor) {
      query._id = { $lt: cursor };
    }
    
    const notifications = await Notification.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1);
      
    const hasNextPage = notifications.length > limit;
    if (hasNextPage) notifications.pop();
    
    const nextCursor = hasNextPage ? notifications[notifications.length - 1]._id : null;
    
    return { notifications, nextCursor };
  },

  async createNotification(data) {
    await dbConnect();
    return await Notification.create(data);
  },

  async markAsRead(id) {
    await dbConnect();
    return await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
  },

  async markAllAsRead({ hostelId, recipientId, recipientRole }) {
    await dbConnect();
    return await Notification.updateMany(
      { hostelId, recipientId, recipientRole, isRead: false },
      { isRead: true }
    );
  },

  async deleteNotification(id) {
    await dbConnect();
    return await Notification.findByIdAndDelete(id);
  }
};
