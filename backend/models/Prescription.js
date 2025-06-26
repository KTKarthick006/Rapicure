import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    filename: String,
    fileId: mongoose.Schema.Types.ObjectId,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    extractedText: {
      type: String,
      default: ""
    }, 
    healthAdvice: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const Prescription = mongoose.model("Prescription", prescriptionSchema);
export default Prescription;
