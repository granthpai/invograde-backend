import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL as string;


const startServer = async() => {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Mongoose connected");

        app.listen(PORT,() => {
            console.log(`Server is running on http://localhost:${PORT}`);
        })
    } catch (error) {
        console.error("Database connection error:", error);        
    }
}

startServer();