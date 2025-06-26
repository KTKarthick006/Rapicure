import express from "express";
import { aiHealthChat, getUserChats } from "../controllers/chatController.js";
import { restrictToLoggedinUserOnly } from "../middleware/isAuthenticated.js";

const router = express.Router();
router.post('/chat', restrictToLoggedinUserOnly, aiHealthChat);
router.get('/chat/history', restrictToLoggedinUserOnly, getUserChats);
export default router;