import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // We use the variable from your .env file
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    
    console.log(` MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If DB fails, the app is useless. Kill the process to restart it (Docker will handle restart).
    console.error(` Error: ${(error as Error).message}`);
    process.exit(1);
  }
};