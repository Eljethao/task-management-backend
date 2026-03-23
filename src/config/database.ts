import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async ()=> {
    try {
      console.log("MONGODB_URI:", process.env.MONGODB_URI); // Debug log
        await mongoose.connect(process.env.MONGODB_URI as string || '');
        console.log('Database connected');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

export default connectDB;