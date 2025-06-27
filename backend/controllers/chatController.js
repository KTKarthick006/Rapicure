// backend/controllers/chatController.js

import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import Chat from "../models/chat.js";
import Prescription from "../models/Prescription.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function aiHealthChat(req, res) {
  const { message, chatId } = req.body;
  const user = req.user;

  if (!message || typeof message !== "string" || !user) {
    return res.status(400).json({ error: "Missing message or user context." });
  }

  try {
    const allAdviceDocs = await Prescription.find({
      createdBy: user._id,
      healthAdvice: { $ne: "" }
    });

    const allAdviceText = allAdviceDocs
      .map((doc, i) => {
        try {
          const parsed = JSON.parse(doc.healthAdvice);
          return `Advice ${i + 1}:
` + Object.entries(parsed)
            .map(([section, text]) => `🔹 ${section}:
${text}`)
            .join("\n\n");
        } catch (e) {
          return `Advice ${i + 1} (raw):\n${doc.healthAdvice}`;
        }
      })
      .join("\n\n---\n\n");

    const prompt = `Use the stored ${allAdviceText} context for medical history.\n\nPatient: ${message}. please don't use text formating, no bold, no different text size, no nothing, just simple text and emojis`;

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
    console.error("Gemini AI chat error:", err);
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

export async function getChatById(req, res) {
  try {
    const chatId = req.params.chatId;
    const chat = await Chat.findById(chatId);

    if (!chat) return res.status(404).json({ error: "Chat not found." });

    res.json(chat);
  } catch (err) {
    console.error("Error fetching chat:", err);
    res.status(500).json({ error: "Server error while fetching chat." });
  }
}
