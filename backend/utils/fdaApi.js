import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCYVDksNi7T5I5yUlJj2HNCmSMcEPpMuKo");

export default async function getHealthAdvice(ocrText) {
const prompt = `
You are a health assistant. Given the OCR extracted medical text below, analyze the medication, dosage, and condition. Then output a structured, friendly, highly specific health suggestion guide like the one below.

Only return the structured suggestion—no commentary or extra explanations.
And return it as a html paragraph element, don't use \\n

Example OCR insight: "The user has thyroid and takes 150mg of Euthyrox everyday"

Your response should be:
🌅 Morning Routine
Take your 150 µg thyroxine first thing, 30-60 minutes before breakfast (or at bedtime, 3-4 hours after your last meal).
Pick a time you can stick to every day—consistency is everything!

🚫 Avoid Interfering Substances
Keep coffee, multivitamins, calcium, iron, soy, high-fiber foods, and antacids at least 3-4 hours away from your dose.

🌡️ Store It Right
Room temperature (15-30 °C) is perfect—no fridge needed.

🩸 Regular Check-Ins
Get TSH and free T₄ labs 6-8 weeks after any dose change, then every 6-12 months once you’re stable.

⚖️ Symptom Watch
Feeling jittery, losing weight, or having palpitations? Might be too much.
Feeling tired, cold, or gaining weight? Might need more.

🥗 Nutrient Boost
Support T₄→T₃ conversion with selenium (Brazil nuts), zinc (pumpkin seeds), iron (lean meats), iodine (seaweed), vitamin D, B-complex, and magnesium.

🥦 Thyroid-Friendly Diet
Enjoy tyrosine-rich foods (fish, yogurt) and thiamine sources (spinach, legumes).
If iodine is low, limit raw cruciferous veggies like kale or broccoli.

🌱 Gut & Liver Health
A happy gut helps convert hormones. Address any digestive issues promptly.

🧘 Stress & Sleep
Prioritize 7-9 hours of good sleep and daily stress relief (meditation, gentle walks).

🏃 Stay Active—Wisely
Aim for regular moderate exercise. If you love intense workouts, monitor your energy and discuss with your doc.

💓 Long-Term Wellness
High doses over time can affect bones and heart health. Plan periodic bone density and cardiovascular check-ups, especially if you’re older.

Now generate advice for the following extracted text:
"${ocrText}"
`;

try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    const text = result.response.text();
    return text.trim();
} catch (err) {
    console.error("Gemini API error:", err.message);
    return "⚠️ Sorry, we couldn't generate suggestions right now.";
}
}