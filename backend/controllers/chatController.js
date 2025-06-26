// controllers/chatController.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import Chat from "../models/chat.js";

const genAI = new GoogleGenerativeAI("AIzaSyCYVDksNi7T5I5yUlJj2HNCmSMcEPpMuKo");

export async function aiHealthChat(req, res) {
  const { message, chatId } = req.body;
  const user = req.user; // ensure this is set via auth middleware

  if (!message || typeof message !== "string" || !user) {
    return res.status(400).json({ error: "Missing message or user context." });
  }

  try {
    const prompt = `
You are Healo, an empathetic AI health assistant.
You can answer medical questions (non-emergency), offer comfort, and casually chat.
Respond warmly, clearly, and helpfully.
User: ${message}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });

    const reply = result.response.text().trim();

    let chatDoc;
    if (chatId) {
      chatDoc = await Chat.findById(chatId);
    }

    if (!chatDoc) {
      chatDoc = await Chat.create({
        createdBy: user._id,
        messages: []
      });
    }

    chatDoc.messages.push({ role: "user", text: message });
    chatDoc.messages.push({ role: "bot", text: reply });
    await chatDoc.save();

    res.json({ reply, chatId: chatDoc._id });
  } catch (err) {
    console.error("Gemini API chat error:", err.message);
    res.status(500).json({ error: "AI response generation failed." });
  }
}

export async function getUserChats(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).send("Unauthorized");

    const chats = await Chat.find({ createdBy: user._id })
      .sort({ createdAt: -1 })
      .select("_id createdAt messages");

    res.json(chats);
  } catch (err) {
    console.error("Failed to load chats:", err);
    res.status(500).send("Server Error");
  }
}
