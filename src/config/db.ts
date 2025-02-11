import mongoose from "mongoose";


const MONGO_URL = process.env.MONGO_URL as string;

const startServer = async() => {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Mongoose connected");

       
    } catch (error) {
        console.error("Database connection error:", error);        
    }
}

export default startServer;