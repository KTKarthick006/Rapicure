// backend/controllers/ocrControllers.js

import mongoose from "mongoose";
import Prescription from "../models/Prescription.js";
import extractMeds from "../utils/extractMeds.js";
import getHealthAdvice from "../utils/fdaApi.js";
import Chat from "../models/chat.js";

export async function handlePdfUpload(req, res) {
  try {
    if (!req.file || !req.user) {
      return res.status(400).send("Missing file or user");
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "prescriptions"
    });

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      metadata: { createdBy: req.user._id }
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on("error", err => {
      console.error("Upload error:", err.message);
      res.status(500).send("GridFS upload failed");
    });

    uploadStream.on("finish", async () => {
      const prescription = await Prescription.create({
        filename: req.file.originalname,
        fileId: uploadStream.id,
        createdBy: req.user._id,
      });

      setTimeout(() => {
        const chunks = [];
        bucket.openDownloadStream(uploadStream.id)
          .on("data", chunk => chunks.push(chunk))
          .on("error", (err) => {
            console.error("GridFS download error:", err.message);
            return res.status(500).send("File read failed");
          })
          .on("end", async () => {
            const buffer = Buffer.concat(chunks);
            const extractedText = await extractMeds(buffer);
            let healthAdvice = "";

            try {
              healthAdvice = await getHealthAdvice(extractedText);
            } catch (e) {
              console.warn("AI suggestion error");
            }

            await Prescription.findByIdAndUpdate(prescription._id, {
              extractedText,
              healthAdvice
            });

            // Create only one Chat message with just the new healthAdvice
            await Chat.create({
              createdBy: req.user._id,
              messages: [
                {
                  role: "bot",
                  text: `Here are suggestions based on your uploaded prescription (${prescription.filename}):\n\n${healthAdvice}`,
                },
              ],
            });

            res.send(`
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <title>File uploaded Successfully</title>
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
                    window.location.href = '/home';
                  }, 4000);
                </script>
              </head>
              <body>
                <div class="message-box">
                  <h2> File Uploaded Successfully</h2>
                  <p>You will be redirected to the suggestions page shortly...</p>
                </div>
              </body>
              </html>
            `);
          });
      }, 300);
    });
  } catch (err) {
    console.error("Upload fail:", err.message);
    res.status(500).send("Internal Server Error");
  }
}
