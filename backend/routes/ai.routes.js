import express from "express";
import { generateDescription } from "../controllers/ai.controller.js";
import isAuth from "../middlewares/isAuth.js";

const aiRouter = express.Router();

// Only authenticated users (owners) should generate descriptions to prevent abuse
aiRouter.post("/generate-description", isAuth, generateDescription);

export default aiRouter;
