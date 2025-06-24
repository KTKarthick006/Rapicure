import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { handelUserSignup, handelUserLogin } from "../controllers/authController.js";

// 📍 Path setup for sendFile
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Create a single router
const router = express.Router();

// ✅ API routes
router.post("/signup", handelUserSignup);
router.post("/login", handelUserLogin);

router.get("/", (req, res) => {
  res.send("User GET working!");
});

// ✅ Serve signup form
router.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../front/signup.html"));
});

// ✅ Serve login form (optional, if you need it here too)
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../front/login.html"));
});

export default router;
