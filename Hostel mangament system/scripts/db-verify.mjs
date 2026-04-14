import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import fs from "fs";
import path from "path";

// 1. Manually load env from .env.local on Windows
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [key, value] = line.split("=");
  if (key && value) env[key.trim()] = value.trim();
});

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verifyMigration() {
  console.log("--- 🕵️ Firestore Migration Verification ---");

  // 1. Check Hostels
  const hostelsSnap = await getDocs(collection(db, "hostels"));
  console.log(`\n🏠 Hostels: ${hostelsSnap.size} found.`);
  hostelsSnap.forEach((d) => {
    const data = d.data();
    const fields = ["hostelName", "ownerName", "address", "createdAt"];
    const missing = fields.filter((f) => !data[f]);
    if (missing.length > 0) {
      console.warn(`   ⚠️ Hostel [${d.id}]: Missing fields: ${missing.join(", ")}`);
    } else {
      console.log(`   ✅ Hostel [${d.id}]: ${data.hostelName} (Owner: ${data.ownerName})`);
    }
  });

  // 2. Check Students (users with role 'student')
  const studentsSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
  console.log(`\n👨‍🎓 Students: ${studentsSnap.size} found.`);
  
  let orphans = [];
  studentsSnap.forEach((d) => {
    const data = d.data();
    if (!data.hostelId) {
      orphans.push(d.id);
    }
  });

  if (orphans.length > 0) {
    console.warn(`   ❌ Orphans: ${orphans.length} students missing 'hostelId'. Migrating to 'primary-hostel'...`);
    for (const id of orphans) {
      await updateDoc(doc(db, "users", id), { hostelId: "primary-hostel" });
      console.log(`      ✅ Migrated ${id}`);
    }
  } else {
    console.log("   ✅ All students have 'hostelId'.");
  }

  // 3. Other collections (Rooms, Complaints, etc.)
  const collectionsToCheck = ["rooms", "complaints", "visitors", "fees"];
  for (const colName of collectionsToCheck) {
      const snap = await getDocs(collection(db, colName));
      let missing = 0;
      for (const d of snap.docs) {
          if (!d.data().hostelId) missing++;
      }
      if (missing > 0) {
          console.warn(`   ⚠️ Collection [${colName}]: ${missing} documents missing 'hostelId'.`);
      } else {
          console.log(`   ✅ Collection [${colName}]: All documents have 'hostelId'.`);
      }
  }

  console.log("\n--- Verification Complete ---");
}

verifyMigration().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
