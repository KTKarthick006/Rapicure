import express from "express";
import { aiHealthChat } from "../controllers/chatController.js";

const router = express.Router();

router.post("/chat", aiHealthChat);

export default router;
