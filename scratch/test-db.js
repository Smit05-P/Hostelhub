const mongoose = require('mongoose');

async function test() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to URI starting with:', uri ? uri.substring(0, 20) + '...' : 'undefined');
    if (!uri) {
        console.error('MONGODB_URI is not defined in process.env');
        process.exit(1);
    }
    await mongoose.connect(uri);
    console.log('Connected successfully');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
}

test();
