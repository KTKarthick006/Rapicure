import mongoose from "mongoose";
import Prescription from "../models/Prescription.js";

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
  const prescription = new Prescription({
    filename: req.file.originalname,
    // fileId is accessible from stream id
    fileId: uploadStream.id,
    createdBy: req.user._id
  });
  await prescription.save();

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
          }, 4000); // 4 seconds
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
// you have to change line window.location.href = '/home'; to the chat page
//   res.send("PDF uploaded");
});


  } catch (err) {
    console.error("Upload fail:", err.message);
    res.status(500).send("Internal Server Error");
  }
}
