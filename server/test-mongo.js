const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const testConnection = async () => {
  console.log('Testing MongoDB Atlas connection...');
  console.log('URI:', process.env.MONGODB_URI);
  
  // Force public DNS for SRV
  if (process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    console.log('DNS servers set to Google/Cloudflare');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      retryWrites: true
    });
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Try a simple operation
    const admin = mongoose.connection.getClient().db('admin');
    const serverStatus = await admin.admin().serverStatus();
    console.log('Server version:', serverStatus.version);
    console.log('Databases:', (await admin.admin().listDatabases()).databases.map(d => d.name));
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Parse and provide helpful hints
    if (error.message.includes('bad auth')) {
      console.error('\n⚠️  Authentication failed. Check:');
      console.error('  1. Username (Nivya) exists in MongoDB Atlas');
      console.error('  2. Password is correct (nivyashree0711)');
      console.error('  3. User has roles for the "linkture" database');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('connect ECONNREFUSED')) {
      console.error('\n⚠️  Connection refused. Check:');
      console.error('  1. Machine IP (157.51.59.165) is whitelisted in Atlas Network Access');
      console.error('  2. Cluster is deployed and active');
    } else if (error.message.includes('getaddrinfo')) {
      console.error('\n⚠️  DNS resolution failed. Check:');
      console.error('  1. Internet connection is working');
      console.error('  2. Cluster hostname is correct');
    }
    
    process.exit(1);
  }
};

testConnection();
