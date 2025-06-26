// app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { restrictToLoggedinUserOnly } from "./middleware/isAuthenticated.js";
import userRouter from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

// OCR dependencies
import { PDFDocument } from "pdf-lib";
import { createCanvas } from "canvas";
import { createWorker } from "tesseract.js";

// Setup for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/sarthakdbs", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Create Express app
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api", chatRoutes);

// Serve static files from /front
app.use(express.static(path.join(__dirname, "front")));

// Route setup
app.use("/user", userRouter);

// Protected Home Route
app.get("/", (req, res) => {
  res.send(`Hello, ${req.user?.name || "User"}`);
});

app.get("/home", restrictToLoggedinUserOnly, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/home.html"));
});

// Auth-related HTML pages
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/signup.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

app.get("/upload", restrictToLoggedinUserOnly, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/upload.html"));
});

app.get("/my-prescriptions", restrictToLoggedinUserOnly, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/my-prescriptions.html"));
});

// Logout Route
app.get("/logout", (req, res) => {
  res.clearCookie("uid");
  res.redirect("/login");
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Start server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

// OCR Function
export async function extractMeds(pdfBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const numPages = pdfDoc.getPageCount();

  const worker = await createWorker("eng", 1);
  await worker.loadLanguage("eng");
  await worker.initialize("eng");

  let extractedText = "";

  for (let i = 0; i < numPages; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText("OCR cannot see real PDF text from here", 50, 100);

    const buffer = canvas.toBuffer("image/png");

    const {
      data: { text }
    } = await worker.recognize(buffer);

    extractedText += `Page ${i + 1}\n${text}\n\n`;
  }

  await worker.terminate();
  return extractedText.trim();
}
