import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Item from "../models/item.model.js";
import Order from "../models/oder.model.js"; // Note: Filename typo from existing project
import { expandSearchQuery } from "./ai.controller.js";

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.userId; // Assuming middleware populates this

    if (!message) {
      return res.status(400).json({ reply: "Please say something!" });
    }

    // 1. Intent Detection
    const intentPrompt = `
      Classify the user intent into one of these categories:
      - FOOD_SUGGESTION (user wants to know what to eat, is looking for food, asking for recommendations, stating a budget)
      - ORDER_STATUS (user is asking about their delivery, where is my order, is it late)
      - GENERAL (greetings, unrelated queries)
      
      User Message: "${message}"
      
      Return ONLY the category name. Use 'GENERAL' if unsure.
    `;

    const intentResponse = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: intentPrompt,
    });

    // Extract text safely
    let intent = "GENERAL";
    if (intentResponse.text) {
      intent = intentResponse.text.trim();
    } else if (
      intentResponse.candidates &&
      intentResponse.candidates[0].content.parts[0].text
    ) {
      intent = intentResponse.candidates[0].content.parts[0].text.trim();
    }

    console.log(`User Intent: ${intent}`);

    // 2. Handle Intents
    if (intent.includes("ORDER_STATUS")) {
      return await handleOrderStatus(userId, res);
    } else if (intent.includes("FOOD_SUGGESTION")) {
      return await handleFoodSuggestion(message, res);
    } else {
      // General Chat
      const chatPrompt = `You are "Hungry AI", a helpful food delivery assistant for "Eatly". Answer this politely: "${message}"`;
      const chatResponse = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: chatPrompt,
      });
      const reply = chatResponse.text || "I'm here to help with food!";
      return res.json({ reply });
    }
  } catch (error) {
    console.error("Chatbot error:", error);
    // Check for Rate Limit (429) or Quota Exceeded
    if (
      error.status === 429 ||
      (error.error && error.error.code === 429) ||
      error.message?.includes("429") ||
      error.message?.includes("Quota") ||
      error.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      return res
        .status(200) // Return 200 so frontend displays the message in chat bubble
        .json({
          reply:
            "I'm a bit overwhelmed right now (Rate Limit Reached). Please give me a minute to cool down! 🧊",
        });
    }
    return res.status(500).json({
      reply: "Oops! My brain froze. Try again.",
      error: error.message,
      details: error,
    });
  }
};

// --- Helper Functions ---

const handleOrderStatus = async (userId, res) => {
  try {
    // Fetch active orders (not delivered)
    const orders = await Order.find({
      user: userId,
      "shopOrders.status": { $ne: "delivered" },
    })
      .populate({
        path: "shopOrders.shop",
        select: "name",
      })
      .sort({ createdAt: -1 })
      .limit(3);

    if (!orders || orders.length === 0) {
      return res.json({
        reply:
          "You don't have any active orders right now. Hungry? Order something tasty!",
      });
    }

    // Summarize orders for Gemini
    const orderSummary = orders
      .map((o) => {
        return o.shopOrders
          .map(
            (so) =>
              `Order from ${so.shop?.name || "Unknown Shop"}: Status is '${so.status}'. Total: ₹${so.subtotal}.`,
          )
          .join(" ");
      })
      .join("\n");

    const prompt = `
            The user asked about their order status.
            Here is the realtime data:
            ${orderSummary}
            
            Answer the user politely and summarize the status. Keep it short.
        `;

    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const reply = response.text || "Your order is on the way!";
    return res.json({ reply });
  } catch (err) {
    console.error("Order status error:", err);
    return res.json({ reply: "I couldn't check your order status right now." });
  }
};

const handleFoodSuggestion = async (userMessage, res) => {
  try {
    // 1. Expand Query
    const searchTerms = await expandSearchQuery(userMessage);

    // 2. Construct Query (Basic RAG)
    const regexQueries = searchTerms.map((term) => ({
      $or: [
        { name: { $regex: term, $options: "i" } },
        { category: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
      ],
    }));

    // Extract budget if present (very simple regex for now)
    let priceFilter = {};
    const budgetMatch = userMessage.match(/(\d+)/); // Finds first number
    if (
      budgetMatch &&
      (userMessage.includes("under") ||
        userMessage.includes("budget") ||
        userMessage.includes("rupees") ||
        userMessage.includes("rs"))
    ) {
      const budget = parseInt(budgetMatch[0]);
      priceFilter = { price: { $lte: budget } };
      console.log("Detected Budget:", budget);
    }

    // Search Items
    const items = await Item.find({
      $and: [{ $or: regexQueries }, priceFilter],
    })
      .limit(10)
      .populate("shop", "name");

    if (items.length === 0) {
      return res.json({
        reply:
          "I couldn't find anything matching that specific craving. Maybe try 'pizza' or 'biryani'?",
      });
    }

    // 3. Generate Recommendation
    const itemsList = items
      .map(
        (i) =>
          `- ${i.name} (₹${i.price}) from ${i.shop?.name || "a shop"}: ${i.description || ""}`,
      )
      .join("\n");

    const prompt = `
            User Request: "${userMessage}"
            
            Found Items:
            ${itemsList}
            
            Recommend the best 2-3 options from this list to the user.
            Explain why they are good matches.
            Mention the price and shop name.
            Keep it friendly and appetizing.
        `;

    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const reply = response.text || "Here are some yummy options!";
    return res.json({ reply });
  } catch (err) {
    console.error("Food suggestion error:", err);
    return res.json({
      reply: "I'm having trouble browsing the menu. Try searching normally!",
    });
  }
};
