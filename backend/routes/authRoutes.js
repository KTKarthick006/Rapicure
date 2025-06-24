import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import {
  handelUserSignup,
  handelUserLogin,
} from "../controllers/authController.js";
import { restrictToLoggedinUserOnly } from "../middleware/isAuthenticated.js";
import upload from "../utils/extractMeds.js";
import Prescription from "../models/Prescription.js";
import { handlePdfUpload } from "../controllers/ocrController.js";

//  Path setup for sendFile
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//  Create a single router
const router = express.Router();

//  API routes
router.post("/signup", handelUserSignup);
router.post("/login", handelUserLogin);
router.post(
  "/upload", restrictToLoggedinUserOnly, upload.single("pdf"), handlePdfUpload
);

router.get("/", (req, res) => {
  res.send("User GET working!");
});

// Serve signup form
router.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../front/signup.html"));
});

// Serve login form (optional, if you need it here too)
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../front/login.html"));
});

router.get("/my-prescriptions/json", restrictToLoggedinUserOnly, async (req, res) => {
  const prescriptions = await Prescription.find({ createdBy: req.user._id });
  res.json(prescriptions);
});

router.get("/view/:filename", restrictToLoggedinUserOnly, async (req, res) => {
  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "prescriptions"
    });

    const stream = bucket.openDownloadStreamByName(req.params.filename);
    res.set("Content-Type", "application/pdf");
    stream.pipe(res);
  } catch (err) {
    console.error("PDF view error:", err.message);
    res.status(404).send("PDF not found");
  }
});

export default router;
