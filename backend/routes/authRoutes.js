import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import Prescription from "../models/Prescription.js";
import {
  handelUserSignup,
  handelUserLogin,
} from "../controllers/authController.js";
import { restrictToLoggedinUserOnly } from "../middleware/isAuthenticated.js";
import { handlePdfUpload } from "../controllers/ocrController.js";
import { getHealthAdviceByFilename } from "../controllers/getHealthAdviceByFilename.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get("/signup", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/signup.html"))
);
router.post("/signup", handelUserSignup);

router.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/login.html"))
);
router.post("/login", handelUserLogin);

// Protect below routes
router.use(restrictToLoggedinUserOnly);

// Dashboard & views
router.get("/home", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/home.html"))
);
router.get("/upload", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/upload.html"))
);
router.post("/upload", upload.single("pdf"), handlePdfUpload);
router.get("/my-prescriptions", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/my-prescriptions.html"))
);

// API endpoints
router.get("/my-prescriptions/json", async (req, res) => {
  try {
    const list = await Prescription.find({ createdBy: req.user._id });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch prescriptions" });
  }
});

router.get("/suggestions", getHealthAdviceByFilename);

// Download PDF by filename
router.get("/view/:filename", async (req, res) => {
  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "prescriptions",
    });
    const stream = bucket.openDownloadStreamByName(req.params.filename);
    res.set("Content-Type", "application/pdf");
    stream.pipe(res);
    stream.on("error", () => res.status(404).send("PDF not found"));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error streaming PDF");
  }
});

// Health advice endpoint
router.get("/healthadvice/:filename", getHealthAdviceByFilename);

export default router;
