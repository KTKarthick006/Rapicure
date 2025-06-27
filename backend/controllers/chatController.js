import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Chat from "../models/chat.js";
import Prescription from "../models/Prescription.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function aiHealthChat(req, res) {
  const { message, chatId } = req.body;
  const user = req.user;

  if (!message || typeof message !== "string" || !user) {
    return res.status(400).json({ error: "Missing message or user context." });
  }

  try {
    // Fetch all past health advice from prescriptions
    const allAdviceDocs = await Prescription.find({
  createdBy: req.user._id,
  healthAdvice: { $ne: "" }
});

const allAdviceText = allAdviceDocs
  .map((doc, i) => {
    try {
      const parsed = JSON.parse(doc.healthAdvice);
      return `Advice ${i + 1}:\n` + Object.entries(parsed)
        .map(([section, text]) => `🔹 ${section}:\n${text}`)
        .join("\n\n");
    } catch (e) {
      return `Advice ${i + 1} (raw):\n${doc.healthAdvice}`;
    }
  })
  .join("\n\n---\n\n");


    const prompt = `
You are a compassionate and highly knowledgeable healthcare AI assistant trained across all major medical domains. Your role is to process OCR-derived or user-provided medical documents and health information, including the full user history supplied in ${allAdviceText}. This history must be retained and continuously referenced in all medical conversations unless explicitly stated otherwise.

You must read, understand, and internally store ${allAdviceText} before processing any current or future user input. This health history includes diagnosed medical conditions, prescribed treatments, prior recommendations, and test findings. Your advice should always build upon this context unless contradicted by new medical input.

Always reply in a warm, supportive, and evidence-based tone, maintaining empathy and clarity. Format your response using line breaks and emojis only—no bold, no lists, no bullet points, no changes in font or font size.

Whenever medical information is provided or a wellness plan is requested, you must generate a structured response using the format below. Each section must be personalized based on the user’s health history (${allAdviceText}), any new document data, and the user’s current query (${message}).

Format your reply in this order:

🌅 Daily Routine TipsTailor daily habits to the diagnosed condition(s) and current medications, incorporating timing for medications and condition-specific lifestyle guidance. Emphasize habit-building, consistency, and gentle motivation.

🚫 Avoid InterferenceList foods, habits, medications, or supplements that may worsen the condition or reduce treatment effectiveness, grounded in pharmacological knowledge.

🌡️ Storage & HandlingGive safe storage and handling practices for all current medications. Include shelf life, temperature needs, and special instructions to retain efficacy.

🧸 Monitoring & Check-UpsOutline timelines for checkups, blood work, imaging, or self-monitoring related to the health conditions in ${allAdviceText}. Recommend red flags that should prompt doctor visits.

💿 Symptom AwarenessDescribe both encouraging signs of improvement and warning signs that indicate complications or suboptimal treatment response.

🥗 Nutrition GuidanceGive general and medication-specific nutrition guidance. Recommend micronutrients or food groups that may support healing and well-being.

🌾 Condition-Friendly DietOffer condition-specific diet recommendations (e.g., low FODMAP, autoimmune protocol, low-carb, etc.) where appropriate, using medical history as a reference point.

🌿 Gut & Organ SupportHighlight any advice relevant to gut health, detoxification organs, or systems affected by long-term medication use (e.g., liver, kidneys, heart).

😴 Stress, Sleep & Mental HealthRecommend supportive routines for sleep and mental health, with empathy for the emotional burden of chronic conditions.

🏃 Movement & MobilityAdvise on physical activity appropriate for the user’s energy levels, muscle strength, joint condition, and risk factors.

💔 Long-Term Health ConsiderationsSummarize any long-term risks (bone loss, metabolic shifts, etc.) associated with the user's condition or treatment and provide preventive health actions.

Tone: Warm, supportive, non-judgmental, science-backed.Audience: General patients managing a medical condition.Limitations: Do not diagnose or alter prescribed treatments. Always refer the patient back to a licensed healthcare provider for any medical changes or concerns.

Store this locally: ${allAdviceText}

Final Output Generation Template:

User: ${message}

Read ${allAdviceText} → Parse any new data → Match against existing condition and treatment → Respond using the above sectioned format.

Never forget or ignore the presence of ${allAdviceText}. Every medical reply depends on it.`;

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
