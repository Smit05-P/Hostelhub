import mongoose from "mongoose";

const globalForMongoose = globalThis;

if (!globalForMongoose.__mongooseCache) {
  globalForMongoose.__mongooseCache = {
    conn: null,
    promise: null,
  };
}

const cached = globalForMongoose.__mongooseCache;

async function dbConnect() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined. Please configure MONGODB_URI in your environment variables (.env.local)."
    );
  }

  // If we have an existing connection and readyState is connected (1), reuse it
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If connection state is disconnected (0), reset cached promise so we reconnect
  if (mongoose.connection.readyState === 0) {
    cached.promise = null;
    cached.conn = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: process.env.NODE_ENV !== "production",
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    console.error("[MongoDB] Connection failure:", error.message);
    throw error;
  }

  return cached.conn;
}

export default dbConnect;
