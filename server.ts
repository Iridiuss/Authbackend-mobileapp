import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/database';
import { verifyEmailConfig } from './config/email';

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  await connectDB();
  await verifyEmailConfig();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch(console.error);