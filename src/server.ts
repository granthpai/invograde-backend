// ---- src/server.ts ----
import dotenv from 'dotenv';
import app from './app';
import { connectDB } from './config/db';

dotenv.config();

connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in on port ${PORT}`);
});
