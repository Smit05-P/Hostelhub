const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local to avoid adding 'dotenv' dependency
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkConnection() {
  if (!MONGODB_URI) {
    console.error('\x1b[31m%s\x1b[0m', '❌ MONGODB_URI is not defined in .env.local');
    process.exit(1);
  }

  // Hide credentials for logging
  const safeUri = MONGODB_URI.includes('@') 
    ? `mongodb+srv://...${MONGODB_URI.split('@').pop()}` 
    : MONGODB_URI;

  console.log('\x1b[36m%s\x1b[0m', `📡 Checking MongoDB Connectivity...`);
  console.log(`🔗 Target: ${safeUri}`);

  try {
    // Increase timeout to avoid hanging
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    
    console.log('\x1b[32m%s\x1b[0m', '✅ MongoDB Connection Successful!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '❌ MongoDB Connection Failed!');
    console.error(`Error Detail: ${err.message}`);
    
    if (MONGODB_URI.includes('127.0.0.1') || MONGODB_URI.includes('localhost')) {
      console.log('\n\x1b[33m%s\x1b[0m', '💡 PRO TIP: Your local MongoDB is not running.');
      console.log('1. Press Win+R, type "services.msc"');
      console.log('2. Find "MongoDB Server", right-click it, and select "Start"');
      console.log('3. Set Startup Type to "Automatic" to fix this forever.');
    } else {
      console.log('\n\x1b[33m%s\x1b[0m', '💡 PRO TIP: Your Atlas connection is failing.');
      console.log('1. Check if your internet is working.');
      console.log('2. Ensure your current IP is whitelisted in Atlas -> Network Access.');
    }
    
    process.exit(1);
  }
}

checkConnection();
