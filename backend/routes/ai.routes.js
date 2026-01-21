import express from "express";
import {
  generateDescription,
  getSurpriseMeal,
} from "../controllers/ai.controller.js";

import { handleChat } from "../controllers/chatbot.controller.js";
import isAuth from "../middlewares/isAuth.js";

const aiRouter = express.Router();

// Only authenticated users (owners) should generate descriptions to prevent abuse
aiRouter.post("/generate-description", isAuth, generateDescription);

// Hungry AI Chatbot (Authenticated users)
aiRouter.post("/chat", isAuth, handleChat);
aiRouter.post("/surprise", isAuth, getSurpriseMeal);

export default aiRouter;
