import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes"; 

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use("/api/auth",authRoutes);

export default app;