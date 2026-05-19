import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import pool from "@/config/db";

import driverRouter from "@/features/drivers/driver.router";
import registrationRouter from "@/features/registrations/registration.router";
import vehicleRouter from "@/features/vehicles/vehicle.router";
import violationRouter from "@/features/violations/violation.router";
import { initializeDatabase } from "./seed";

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.use((req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === "string" && ["license_number", "plate_number", "engine_number", "chassis_number"].includes(key)) {
        req.body[key] = req.body[key].toUpperCase().trim();
      }
    }
  }
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === "string" && ["license_number", "plate_number", "engine_number", "chassis_number"].includes(key)) {
        req.query[key] = req.query[key].toUpperCase().trim();
      }
    }
  }
  next();
});

app.get("/", (req, res) => {
  res.send("CMSC 127 RUNNING");
});

app.use("/api/drivers", driverRouter);
app.use("/api/vehicles", vehicleRouter);
app.use("/api/registrations", registrationRouter);
app.use("/api/violations", violationRouter);

const PORT = process.env.PORT;
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  try {
    await pool.query("SELECT 1");
    console.log("Database connected");
    
    // Check if the drivers table exists before initializing
    const [tables] = await pool.query<any[]>("SHOW TABLES LIKE 'drivers'");
    if (tables.length === 0) {
      console.log("Drivers table not found. Initializing database...");
      const populate = process.env.POPULATE_DB === "true";
      await initializeDatabase(populate);
    } else {
      console.log("Database already initialized. Skipping drop and recreation of tables.");
    }
  } catch (err) {
    console.error("Database connection/initialization failed:", err);
  }
});
