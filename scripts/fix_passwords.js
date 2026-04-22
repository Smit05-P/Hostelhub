const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb+srv://smit005prajapati_db_user:Smit%401234@cluster0.hfgoy5i.mongodb.net/test?retryWrites=true&w=majority';

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  
  const salt = await bcrypt.genSalt(10);
  const passwordStr = await bcrypt.hash('password123', salt);
  
  await db.collection('admins').updateOne(
    { email: 'admin1111@gmail.com' },
    { $set: { password: passwordStr } }
  );
  
  const admin = await db.collection('admins').findOne({ email: 'admin1111@gmail.com' });
  console.log('Admin hostel ID:', admin.hostelId);
  
  await db.collection('students').updateOne(
    { email: 'student1111@gmail.com' },
    { 
      $set: { 
        name: 'Test Student', 
        passwordHash: passwordStr, 
        hostelId: admin.hostelId, // associate with admin's hostel if any
        status: 'Active',
        paymentStatus: 'Pending',
        assignedRoomId: null,
      } 
    },
    { upsert: true }
  );

  console.log('Done resetting passwords');
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
