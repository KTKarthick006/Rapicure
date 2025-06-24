import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { restrictToLoggedinUserOnly } from "./middleware/isAuthenticated.js";
import userRouter from "./routes/authRoutes.js";

// 📁 Setup for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🌐 Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/sarthakdbs", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// 🚀 Create Express app
const app = express();

// 🧠 Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 📁 Serve static files from /front
app.use(express.static(path.join(__dirname, "front")));

// 🔗 Route setup
app.use("/user", userRouter);

// 🏠 Protected Home Route
app.get("/", restrictToLoggedinUserOnly, (req, res) => {
  res.send(`Hello, ${req.user.name}`);
});

// 📝 Auth-related HTML pages
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/signup.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

// 🚪 Logout Route
app.get("/logout", (req, res) => {
  res.clearCookie("uid");
  res.redirect("/login");
});

// ❌ 404 Fallback
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// 🌐 Start server
app.listen(3000, () => {
  console.log("✅ Server running at http://localhost:3000");
});
