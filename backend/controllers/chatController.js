import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCYVDksNi7T5I5yUlJj2HNCmSMcEPpMuKo");

export async function aiHealthChat(req, res) {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "A valid message is required." });
  }

  try {
    const prompt = `
You are Healo, an empathetic AI health assistant.
You can answer medical questions (non-emergency), offer comfort, and casually chat.
Respond warmly, clearly, and helpfully.
User: ${message}
    `;

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
    res.json({ reply });
  } catch (err) {
    console.error("Gemini API chat error:", err.message);
    res.status(500).json({ error: "AI response generation failed." });
  }
}