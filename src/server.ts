
import dotenv from "dotenv";
import app from "./app";
import startServer from "./config/db";

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT,() => {
    console.log(`Server is running on http://localhost:${PORT}`);
})




startServer();