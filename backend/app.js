import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { restrictToLoggedinUserOnly } from "./middleware/isAuthenticated.js";
import userRouter from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import connectDb from "./config/db.js";

// Setup __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDb();

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Routes
app.use("/api", chatRoutes);
app.use("/user", userRouter);

// Pages
app.get("/", (req, res) => {
  res.send(`Hello, ${req.user?.name || "User"}`);
});

app.get("/home", restrictToLoggedinUserOnly, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/home.html"));
});

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

app.get("/logout", (req, res) => {
  res.clearCookie("uid");
  res.redirect("/login");
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// app.listen(3000, () => {
//   console.log("Server running at http://localhost:3000");
// });
