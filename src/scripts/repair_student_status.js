const mongoose = require('mongoose');

// Define temporary schemas to avoid model collisions
const StudentSchema = new mongoose.Schema({
  hostelStatus: String,
  email: String
});

const JoinRequestSchema = new mongoose.Schema({
  userId: String,
  status: String,
  createdAt: Date
});

const MONGODB_URI = 'mongodb+srv://smit005prajapati_db_user:Smit%401234@cluster0.hfgoy5i.mongodb.net/hostelhub?retryWrites=true&w=majority';

async function repair() {
  try {
    console.log('--- Starting Database Repair ---');
    await mongoose.connect(MONGODB_URI);
    
    const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
    const JoinRequest = mongoose.models.JoinRequest || mongoose.model('JoinRequest', JoinRequestSchema);

    // 1. Find all students who are PENDING (or potentially stuck)
    const students = await Student.find({});
    console.log(`Analyzing ${students.length} students...`);

    let repairedCount = 0;

    for (const student of students) {
      // Find the latest join request for this student
      // userId might be a string or ObjectId so we check both
      const request = await JoinRequest.findOne({
        $or: [
          { userId: student._id.toString() },
          { userId: student._id }
        ]
      }).sort({ createdAt: -1 });

      if (request) {
        const normalizedRequestStatus = request.status.toUpperCase();
        const normalizedStudentStatus = student.hostelStatus?.toUpperCase();

        if (normalizedRequestStatus !== normalizedStudentStatus) {
          console.log(`[FIX] Syncing student ${student.email}: ${normalizedStudentStatus} -> ${normalizedRequestStatus}`);
          student.hostelStatus = normalizedRequestStatus;
          await student.save();
          repairedCount++;
        }
      }
    }

    console.log(`--- Repair Complete: ${repairedCount} students synced ---`);
    process.exit(0);
  } catch (error) {
    console.error('Repair failed:', error);
    process.exit(1);
  }
}

repair();
