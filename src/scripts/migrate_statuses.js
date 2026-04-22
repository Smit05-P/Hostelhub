const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log("--- Starting Database Status Migration ---");
    
    // Find .env.local
    let envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        envPath = path.join(process.cwd(), '.env');
    }
    
    if (!fs.existsSync(envPath)) {
        console.error("Could not find .env file");
        return;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGODB_URI=(.*)/);
    if (!match) {
        console.error("MONGODB_URI not found in env");
        return;
    }
    
    const uri = match[1].trim().replace(/['"]/g, '');
    
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");
        
        // Use loose schemas for migration
        const JoinRequest = mongoose.model('JoinRequest', new mongoose.Schema({}, { strict: false }), 'joinrequests');
        const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }), 'students');
        
        console.log("Migrating JoinRequests...");
        const jrPending = await JoinRequest.updateMany({ status: 'pending' }, { status: 'PENDING' });
        const jrApproved = await JoinRequest.updateMany({ status: 'approved' }, { status: 'APPROVED' });
        const jrRejected = await JoinRequest.updateMany({ status: 'rejected' }, { status: 'REJECTED' });
        console.log(`Updated JoinRequests: ${jrPending.modifiedCount} Pending, ${jrApproved.modifiedCount} Approved, ${jrRejected.modifiedCount} Rejected.`);

        console.log("Migrating Students...");
        const sPending = await Student.updateMany({ hostelStatus: 'pending' }, { hostelStatus: 'PENDING' });
        const sApproved = await Student.updateMany({ hostelStatus: 'approved' }, { hostelStatus: 'APPROVED' });
        const sRejected = await Student.updateMany({ hostelStatus: 'rejected' }, { hostelStatus: 'REJECTED' });
        const sNoHostel = await Student.updateMany({ hostelStatus: 'no_hostel' }, { hostelStatus: 'NO_HOSTEL' });
        console.log(`Updated Students: ${sPending.modifiedCount} Pending, ${sApproved.modifiedCount} Approved, ${sRejected.modifiedCount} Rejected, ${sNoHostel.modifiedCount} NoHostel.`);

        // Final check
        const remainingJR = await JoinRequest.countDocuments({ status: /^[a-z]+$/ });
        const remainingS = await Student.countDocuments({ hostelStatus: /^[a-z]+$/ });
        
        console.log(`Migration Complete. Remaining lowercase JoinRequests: ${remainingJR}, Students: ${remainingS}`);

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
