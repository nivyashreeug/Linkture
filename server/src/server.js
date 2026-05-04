const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.warn('Database connection failed (continuing without DB):', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
