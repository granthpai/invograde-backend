import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import errorHandler from './middlewares/errorHandler';

dotenv.config();

const app: Application = express();

app.use(express.json());

app.use(cors());

app.use('/api/auth', authRoutes);

app.use(errorHandler);

export default app;

