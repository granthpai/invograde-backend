import dotenv from 'dotenv';
import app from './app';
import { connectDB } from './config/db';

dotenv.config();

connectDB();

const PORT = process.env.PORT;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});