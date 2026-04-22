const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://smit005prajapati_db_user:Smit%401234@cluster0.hfgoy5i.mongodb.net/hostelhub?retryWrites=true&w=majority';


// Define specific normalization mapping for known values
const normalizationMap = {
  // Common
  'active': 'Active',
  'inactive': 'Inactive',
  'pending': 'Pending',
  'PENDING': 'Pending',
  'approved': 'Approved',
  'APPROVED': 'Approved',
  'rejected': 'Rejected',
  'REJECTED': 'Rejected',
  
  // Complaints / Payments
  'open': 'Open',
  'resolved': 'Resolved',
  'closed': 'Closed',
  'paid': 'Paid',
  'unpaid': 'Unpaid',
  'partially_paid': 'Partially-Paid',
  'Partially_Paid': 'Partially-Paid',
  
  // Rooms
  'available': 'Available',
  'occupied': 'Occupied',
  'maintenance': 'Maintenance',
  
  // Student Hostel Status
  'no_hostel': 'No-Hostel',
  'NO_HOSTEL': 'No-Hostel',
};

async function repairDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    for (const name of collectionNames) {
      // Skip system collections
      if (name.startsWith('system.')) continue;

      console.log(`\nProcessing collection: ${name}`);
      const collection = db.collection(name);

      // 1. Repair 'status' field
      console.log(`  Checking 'status' field...`);
      for (const [oldVal, newVal] of Object.entries(normalizationMap)) {
        const result = await collection.updateMany(
          { status: oldVal },
          { $set: { status: newVal } }
        );
        if (result.modifiedCount > 0) {
          console.log(`    Updated ${result.modifiedCount} docs: status '${oldVal}' -> '${newVal}'`);
        }
      }

      // 2. Repair 'hostelStatus' field (mainly for Students)
      console.log(`  Checking 'hostelStatus' field...`);
      for (const [oldVal, newVal] of Object.entries(normalizationMap)) {
        const result = await collection.updateMany(
          { hostelStatus: oldVal },
          { $set: { hostelStatus: newVal } }
        );
        if (result.modifiedCount > 0) {
          console.log(`    Updated ${result.modifiedCount} docs: hostelStatus '${oldVal}' -> '${newVal}'`);
        }
      }
      
      // 3. Catch-all for any other lowercase values that might have been missed
      // (This is more aggressive, only applies if it looks like a single word lowercase)
      // We skip this for now to avoid side effects on non-enum strings.
    }

    console.log('\nDatabase repair completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during database repair:', error);
    process.exit(1);
  }
}

repairDatabase();
