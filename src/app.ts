import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import errorHandler from "./middlewares/errorHandler";
import fileUploadRoutes from "./routes/fileUploadRoutes";
import projectRoutes from "./routes/projectRoutes";
import profileRoutes from "./routes/profileRoutes";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
const allowedOrigins =
  process.env.FRONTEND_URLS?.split(",").map((origin) =>
    origin.trim().replace(/\/+$/, "")
  ) || [];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const cleanedOrigin = origin.trim().replace(/\/+$/, "");
      if (allowedOrigins.includes(cleanedOrigin)) {
        callback(null, true);
      } else {
        console.error("❌ CORS BLOCKED:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/files", fileUploadRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/profile", profileRoutes);

app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;
