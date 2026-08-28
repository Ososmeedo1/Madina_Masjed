import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global._masjedMongoose;

if (!cached) {
  cached = global._masjedMongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB using a cached global connection (safe across hot reloads and serverless invocations).
 * @returns {Promise<typeof mongoose>} The connected mongoose instance.
 * @throws {Error} If MONGODB_URI is missing or the driver cannot connect within 5s.
 */
async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Copy .env.example to .env.local and set it.');
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default dbConnect;
