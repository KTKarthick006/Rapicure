import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    filename: String,
    fileId: mongoose.Schema.Types.ObjectId,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    extractedText: String, 
  },
  { timestamps: true }
);

const Prescription = mongoose.model("Prescription", prescriptionSchema);
export default Prescription;
