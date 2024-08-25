import mongoose from "mongoose";
import dotenv from "dotenv";
import { error, log } from "../utils/logger";

dotenv.config();

const URI = process.env.MONGO_URI;

export const connectToDatabase = async () => {
  try {
    if (!URI) {
      error(
        "MongoDB connection string (MONGO_URI) is not defined in the environment variables."
      );
    }
    await mongoose.connect(URI!);
    log("Connected to MongoDB");
  } catch (err: any) {
    if (err.name === "MongoNetworkError") {
      error(
        "Network error when attempting to connect to MongoDB:",
        err.message
      );
    } else if (err.name === "MongoParseError") {
      error("Error parsing MongoDB connection string:", err.message);
    } else if (err.name === "MongoTimeoutError") {
      error("Connection to MongoDB timed out:", err.message);
    } else if (err.name === "MongoServerError") {
      error("MongoDB server returned an error:", err.message);
    } else if (err.name === "MongoAuthenticationError") {
      error(
        "Authentication failed when connecting to MongoDB:",
        err.message
      );
    } else {
      error(
        "An unknown error occurred while connecting to MongoDB:",
        err.message
      );
    }

    process.exit(1); // Exit the process with failure
  }
};
