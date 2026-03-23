"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Cache the connection across serverless invocations (Vercel)
let cached = {
    conn: null,
    promise: null,
};
const connectDB = async () => {
    if (cached.conn)
        return;
    const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/task-management';
    if (!cached.promise) {
        cached.promise = mongoose_1.default.connect(uri, { bufferCommands: false });
    }
    try {
        cached.conn = await cached.promise;
        console.info('MongoDB connected successfully');
    }
    catch (error) {
        cached.promise = null;
        console.error('MongoDB connection error:', error);
        throw error;
    }
};
exports.connectDB = connectDB;
//# sourceMappingURL=database.js.map