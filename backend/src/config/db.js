import mongoose from 'mongoose';

/**
 * Connects to MongoDB.
 * - If MONGO_URI is set (e.g. MongoDB Atlas), connect to that.
 * - Otherwise spin up an in-memory MongoDB (mongodb-memory-server) so the API
 *   runs with zero setup. Production should always set MONGO_URI.
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (uri) {
    await mongoose.connect(uri);
    const safe = uri.replace(/\/\/[^@]+@/, '//***@');
    console.log(`✔ MongoDB connected: ${safe}`);
    return;
  }

  console.log('ℹ MONGO_URI not set — starting in-memory MongoDB…');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('foodrush'));
  console.log(`✔ MongoDB connected (in-memory): ${mongod.getUri('foodrush')}`);
}
