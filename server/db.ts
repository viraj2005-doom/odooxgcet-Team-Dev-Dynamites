import mongoose from "mongoose";

// Connect to MongoDB
export async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI must be set in your .env file. Did you forget to provision a database?",
    );
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ Connected to MongoDB");
    console.log(`  Database: ${mongoose.connection.name}`);
    console.log(`  Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
  } catch (error: any) {
    console.error("✗ MongoDB connection error:");
    console.error(`  ${error.message}`);
    console.error("\n  Troubleshooting:");
    console.error("  1. Make sure MongoDB is running on your machine");
    console.error("  2. Check your MONGODB_URI in .env file");
    console.error("  3. For local MongoDB, try: mongodb://localhost:27017/hrm-system");
    console.error("  4. Start MongoDB service: Start-Service MongoDB (Windows)");
    throw error;
  }
}

// Disconnect from MongoDB
export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("MongoDB disconnection error:", error);
    throw error;
  }
}

// Export mongoose for use in models
export { mongoose };
