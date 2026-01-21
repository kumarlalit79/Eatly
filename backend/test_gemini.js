import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
function log(message) {
  console.log(message);
  try {
    fs.appendFileSync("test_output.txt", message + "\n");
  } catch (e) {
    console.error("Failed to write to file:", e);
  }
}

// Clear previous log
fs.writeFileSync("test_output.txt", "");

log("Using API Key: " + (apiKey ? "Loaded" : "Not Found"));

const genAI = new GoogleGenAI({ apiKey: apiKey });

async function checkModel() {
  log("Testing gemini-3-flash-preview...");
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello",
    });
    log(`Success! Response: ${response.text}`);
  } catch (error) {
    log(`Error: ${error.message}`);
    if (error.body) log(`Body: ${error.body}`);
  }
}

checkModel();
