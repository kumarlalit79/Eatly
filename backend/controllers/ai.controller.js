import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Item from "../models/item.model.js";
dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateDescription = async (req, res) => {
  try {
    const { itemName, category } = req.body;

    if (!itemName) {
      return res.status(400).json({ message: "Item name is required" });
    }

    // const prompt = `
    //   Write a very short, mouth-watering food description (max 1 sentence, under 20 words).
    //   Category: ${category}
    //   Item: ${itemName}
    //   Do NOT mention the item name in the description directly if possible, or keep it natural.
    //   Make it premium and delicious.
    //   `;

    const prompt = `
Write a short, mouth-watering food description (1 sentence, under 20 words).

Item: ${itemName}
Category: ${category}

Rules:
- Naturally include the item name once (not forced).
- Make it premium, appetizing, and restaurant-style.
- Avoid generic phrases like "delicious food".
`;

    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    console.log("Gemini Raw Response:", JSON.stringify(response, null, 2));

    let text = response.text;

    // Fallback if text is undefined (manual parsing of candidates)
    if (!text && response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (
        candidate.content &&
        candidate.content.parts &&
        candidate.content.parts.length > 0
      ) {
        text = candidate.content.parts[0].text;
      }
    }

    if (!text) {
      return res.status(500).json({
        message: "No description generated",
        debug: response,
      });
    }

    return res.json({ description: text.trim() });
  } catch (error) {
    console.error("AI description generation failed:", error);
    return res.status(500).json({
      message: "AI description generation failed",
      error: error.message,
    });
  }
};

export const expandSearchQuery = async (query) => {
  try {
    const prompt = `
      You are a smart food search assistant.
      The user is searching for: "${query}".
      Generate a list of 5-10 related keywords, synonyms, food types, or ingredients that would help find relevant food items in a database.
      For example, if the user searches "gym food", return ["chicken", "salad", "protein", "healthy", "boiled", "low carb"].
      If the user searches "sweet", return ["dessert", "cake", "ice cream", "chocolate"].
      
      Return ONLY a valid JSON array of strings. No markdown, no explanations.
    `;

    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    let text = response.text;

    // Fallback if text is undefined
    if (!text && response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (
        candidate.content &&
        candidate.content.parts &&
        candidate.content.parts.length > 0
      ) {
        text = candidate.content.parts[0].text;
      }
    }

    if (!text) return [query];

    // Clean up potential markdown code blocks
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const keywords = JSON.parse(text);
    if (Array.isArray(keywords)) {
      // Add the original query to the list if not present
      if (!keywords.includes(query)) {
        keywords.unshift(query);
      }
      return keywords;
    }
    return [query];
  } catch (error) {
    console.error("Smart search expansion failed:", error);

    return [query]; // Fallback to original query
  }
};

export const getSurpriseMeal = async (req, res) => {
  try {
    // 1. Get Random Items (Simple implementation: Get 20 random items to pick from)
    const items = await Item.find({}).limit(50); // Fetching 50 to give AI variety, in prod use aggregate $sample

    if (items.length < 3) {
      return res
        .status(400)
        .json({ message: "Not enough items for a surprise!" });
    }

    // Shuffle array simple
    const shuffled = items.sort(() => 0.5 - Math.random()).slice(0, 20);

    const itemsList = shuffled
      .map((i) => `- ${i.name} (${i.category}): ${i.description}`)
      .join("\n");
    const timeOfDay =
      new Date().getHours() < 11
        ? "Morning"
        : new Date().getHours() < 16
          ? "Lunch"
          : "Dinner";

    const prompt = `
      You are a fun food assistant playing "Surprise Me" with the user.
      Time of Day: ${timeOfDay}.
      
      Available Items:
      ${itemsList}
      
      Task:
      Pick a perfect 2-item combo (Main + Side/Dessert or Beverage) from the list above.
      
      Return valid JSON ONLY:
      {
        "comboName": "The [Fun Name] Combo",
        "reason": "Short, fun reason why this combo rocks right now.",
        "items": ["Exact Item Name 1", "Exact Item Name 2"]
      }
    `;

    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    let text = response.text;
    // Clean up potential markdown
    if (text) {
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    }

    const suggestion = JSON.parse(text);

    // Find the actual item objects to return details (price, image)
    const resultItems = items.filter((i) => suggestion.items.includes(i.name));

    return res.json({
      comboName: suggestion.comboName,
      reason: suggestion.reason,
      items: resultItems,
    });
  } catch (error) {
    console.error("Surprise Me Error:", error);
    return res
      .status(500)
      .json({ message: "The dice rolled off the table! Try again." });
  }
};
