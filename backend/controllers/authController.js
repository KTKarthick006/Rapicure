import { v4 as uuidv4 } from "uuid";
import User from "../models/User.js";
import { setUser } from "./auth.js";

export async function handelUserSignup (req, res) {
    try {
    const { name, email, password } = req.body;

    await User.create({ name, email, password });

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Signup Successful</title>
        <style>
          body {
            background: linear-gradient(to right, #000428, #004e92);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: 'Segoe UI', sans-serif;
          }
          .message-box {
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem 3rem;
            border-radius: 12px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
            text-align: center;
            backdrop-filter: blur(10px);
          }
          h2 {
            margin-bottom: 0.5rem;
          }
        </style>
        <script>
          setTimeout(() => {
            window.location.href = '/login';
          }, 4000); // 4 seconds
        </script>
      </head>
      <body>
        <div class="message-box">
          <h2> Signup Successful</h2>
          <p>You will be redirected to the login page shortly...</p>
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).send("Internal Server Error");
  }
}

export async function handelUserLogin(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.render("login", {
        error: "Invalid credentials",
      });
    }

    const sessionId = uuidv4();
    console.log(sessionId)
    setUser(sessionId, user);
    res.cookie("uid", sessionId);
    res.redirect("/");
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).send("Internal Server Error");
  }
}