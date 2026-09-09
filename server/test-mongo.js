const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const maskUri = (uri) => {
  if (!uri) return '<undefined>';
  try {
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1*****$3');
  } catch {
    return '<configured>';
  }
};

const testConnection = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not set in environment variables.');
    process.exit(1);
  }

  console.log('Testing MongoDB connection...');
  console.log('URI:', maskUri(uri));

  // Force public DNS for SRV if needed
  if (uri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      console.log('DNS servers configured for SRV resolution');
    } catch (e) {
      console.warn('Could not set custom DNS servers:', e.message);
    }
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      retryWrites: true,
    });
    console.log('✅ Successfully connected to MongoDB!');

    const admin = mongoose.connection.getClient().db('admin');
    const serverStatus = await admin.admin().serverStatus();
    console.log('Server version:', serverStatus.version);
    console.log('Databases:', (await admin.admin().listDatabases()).databases.map((d) => d.name));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error code:', error.code || 'UNKNOWN');
    console.error('Error message:', error.message);

    if (error.message.includes('bad auth')) {
      console.error('\n⚠️  Authentication failed. Check:');
      console.error('  1. Database username exists in MongoDB');
      console.error('  2. Database password in MONGODB_URI is correct');
      console.error('  3. User has read/write privileges for the target database');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('connect ECONNREFUSED')) {
      console.error('\n⚠️  Connection refused. Check:');
      console.error('  1. Current IP address is whitelisted in Atlas Network Access');
      console.error('  2. MongoDB service/cluster is active');
    } else if (error.message.includes('getaddrinfo')) {
      console.error('\n⚠️  DNS resolution failed. Check:');
      console.error('  1. Internet connection is active');
      console.error('  2. Cluster hostname in MONGODB_URI is correct');
    }

    process.exit(1);
  }
};

testConnection();

