import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import errorHandler from "./middlewares/errorHandler";
import fileUploadRoutes from "./routes/fileUploadRoutes";
import projectRoutes from "./routes/projectRoutes";
import resumeRoutes from "./routes/resumeRoutes";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/files", fileUploadRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/resume", resumeRoutes);

app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;
