import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { convert } from "pdf-poppler";
import Tesseract from "tesseract.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function extractMeds(pdfBuffer) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ocr-"));
  const pdfPath = path.join(tempDir, "input.pdf");
  fs.writeFileSync(pdfPath, pdfBuffer);

  const outputDir = path.join(tempDir, "images");
  fs.mkdirSync(outputDir);

  try {
    await convert(pdfPath, {
      format: "jpeg",
      out_dir: outputDir,
      out_prefix: "page",
      page: null,
    });
  } catch (err) {
    console.error("PDF conversion failed:", err);
    cleanup(tempDir);
    throw err;
  }

  const imageFiles = fs.readdirSync(outputDir).filter((f) => f.endsWith(".jpg"));

  let extractedText = "";

  for (let i = 0; i < imageFiles.length; i++) {
    const imagePath = path.join(outputDir, imageFiles[i]);
    try {
      const result = await Tesseract.recognize(imagePath, "eng", {
        logger: (m) => console.log(m.status, m.progress),
      });
      extractedText += `Page ${i + 1}\n${result.data.text}\n\n`;
    } catch (err) {
      console.error(`OCR error on page ${i + 1}:`, err.message);
    }
  }

  cleanup(tempDir);
  return extractedText.trim();
}

function cleanup(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
