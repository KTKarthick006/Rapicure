import Prescription from "../models/Prescription.js";

export async function getHealthAdviceByFilename(req, res) {
  try {
    const { filename } = req.params;
    const prescription = await Prescription.findOne({ filename, createdBy: req.user._id });
    if (!prescription) return res.status(404).json({ error: "Prescription not found" });
    if (!prescription.healthAdvice) return res.status(404).json({ error: "No health advice" });

    let advice = {};
    try { advice = JSON.parse(prescription.healthAdvice); }
    catch { advice = { advice: prescription.healthAdvice }; }

    res.json(advice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}