# Eatly - Food Delivery App with AI 🍔 🤖

Eatly is a modern food delivery application enhanced with powerful AI features to improve user experience.

## 🧠 AI Features (Powered by Gemini)

We have integrated Google's Gemini AI to make the app smarter and more helpful.

### 1. AI-Powered Menu Description Generator

- **What it does**: Automatically generates mouth-watering descriptions for menu items.
- **How it works**: When a restaurant owner adds an item (e.g., "Cheese Burger" with ingredients), the AI writes a catchy description like _"Juicy grilled beef patty topped with melted cheddar and fresh lettuce..."_ to increase sales.

### 2. Smart Search (Semantic Search)

- **What it does**: Allows users to search by "intent" rather than just keywords.
- **How it works**:
  - Users can type complex queries like _"something spicy for dinner under ₹200"_ or _"healthy breakfast options"_.
  - The AI analyzes the query to extract key preferences (category, price range, flavor profile) and returns the most relevant results.

### 3. "Hungry AI" Chatbot 💬

- **What it does**: A 24/7 personal food assistant.
- **Capabilities**:
  - **Food Suggestions**: Asks users what they are craving and recommends specific dishes from available restaurants.
  - **Order Status**: Users can ask _"Where is my order?"_ to get real-time status updates without navigating menus.
  - **Friendly Chit-Chat**: Engels users with a fun, food-loving personality.

## 🛠️ Tech Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **AI**: Google Gemini API (`gemini-3-flash-preview` / `gemini-1.5-flash`)

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- MongoDB URI
- Google Gemini API Key

### Installation

1. Clone the repo.
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd frontend && npm install
   ```
3. Setup `.env` in `backend/`:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
4. Run the app:
   ```bash
   # Backend
   cd backend && npm run dev
   # Frontend
   cd frontend && npm run dev
   ```
