const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const LEGACY_ID = "69e1d324e68864eeeb59a94e"; // Has requests
const ACTIVE_ID = "69e1d5b5e68864eeeb59a94f"; // Admin managed

async function mergeHostels() {
    console.log("--- Starting Hostel Merger ---");
    console.log(`Targeting migration from ${LEGACY_ID} to ${ACTIVE_ID}...`);
    
    let envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) envPath = path.join(process.cwd(), '.env');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGODB_URI=(.*)/);
    const uri = match[1].trim().replace(/['"]/g, '');
    
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB.");
        
        const JoinRequest = mongoose.model('JoinRequest', new mongoose.Schema({}, { strict: false }), 'joinrequests');
        const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }), 'students');
        const Hostel = mongoose.model('Hostel', new mongoose.Schema({}, { strict: false }), 'hostels');

        // 1. Update JoinRequests
        const jrResult = await JoinRequest.updateMany(
            { hostelId: new mongoose.Types.ObjectId(LEGACY_ID) },
            { $set: { hostelId: new mongoose.Types.ObjectId(ACTIVE_ID) } }
        );
        console.log(`Migrated ${jrResult.modifiedCount} JoinRequests.`);

        // 2. Update Students
        const sResult = await Student.updateMany(
            { hostelId: new mongoose.Types.ObjectId(LEGACY_ID) },
            { $set: { hostelId: new mongoose.Types.ObjectId(ACTIVE_ID) } }
        );
        console.log(`Migrated ${sResult.modifiedCount} Students.`);

        // 3. Delete Duplicate Hostel
        const hDelete = await Hostel.findByIdAndDelete(LEGACY_ID);
        if (hDelete) {
            console.log(`Deleted duplicate legacy hostel: ${hDelete.name} (${LEGACY_ID})`);
        }

        console.log("\n--- Merger Success ---");
        console.log(`All data from duplicate LDRP-A has been moved to the active instance managed by the admin.`);

    } catch (err) {
        console.error("Merger Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

mergeHostels();
