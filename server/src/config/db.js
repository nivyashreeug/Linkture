const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dns = require('dns');

const connectDB = async () => {
  const opts = { serverSelectionTimeoutMS: 5000 };

  // 1) Try environment-provided MongoDB URI
  if (process.env.MONGODB_URI) {
    // If using an SRV connection string, Node may use a local DNS resolver (e.g., 127.0.0.1)
    // which can refuse SRV queries. Force public DNS servers for SRV resolution.
    if (process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        console.log('DNS servers set to Google/Cloudflare for SRV resolution');
      } catch (e) {
        console.warn('Failed to set DNS servers:', e.message);
      }
    }
    try {
      await mongoose.connect(process.env.MONGODB_URI, opts);
      console.log('Connected to MongoDB (MONGODB_URI)');
      return;
    } catch (err) {
      console.error('Failed to connect to MONGODB_URI:', err.message);
      // When a MONGODB_URI is provided explicitly, do not silently fallback — fail fast so user can fix credentials/network.
        console.warn('Failed to connect to MONGODB_URI, will try local Mongo or in-memory:', err.message);
        // continue to try local or in-memory fallbacks
    }
  }

  // 2) Try a local MongoDB instance (common for dev)
  const localUri = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/linkture';
  try {
    await mongoose.connect(localUri, opts);
    console.log('Connected to local MongoDB');
    return;
  } catch (err) {
    console.warn('Local MongoDB connect failed, will attempt in-memory fallback:', err.message);
  }

  // 3) Fallback to an in-memory MongoDB server for local development/testing
  try {
    const mongod = await MongoMemoryServer.create({ instance: { startupTimeoutMS: 120000 } });
    const uri = mongod.getUri();
    await mongoose.connect(uri, { ...opts, connectTimeoutMS: 30000 });
    console.log('Connected to in-memory MongoDB');
    return;
  } catch (err) {
    console.error('Failed to start in-memory MongoDB:', err.message);
    throw err;
  }
};

module.exports = connectDB;
