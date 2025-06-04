import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

export async function GET() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }
    return Response.json({ success: true, message: 'Connected to MongoDB!' });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message });
  }
} 