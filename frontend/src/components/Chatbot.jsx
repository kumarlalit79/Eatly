import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { ClipLoader } from "react-spinners";
import { useSelector } from "react-redux";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hi! I'm Hungry AI 🍔. Ask me for food suggestions or about your order status!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Use serverUrl from App or define it here if not exported. 
  // Assuming relative path or proxy setup, otherwise hardcode or import from config.
  // Ideally, axios instance with baseURL is used, but for now using relative path with assumptions or full URL.
  const serverUrl = "http://localhost:3000"; 
  const { userData } = useSelector((state) => state.user);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token"); // Assuming standard token storage
      const res = await axios.post(
        `${serverUrl}/api/ai/chat`,
        { message: userMessage.text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      const aiMessage = { sender: "ai", text: res.data.reply };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error", error);
      const errorMessage = {
        sender: "ai",
        text: "Sorry, I'm having trouble connecting to the kitchen. Try again later!",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!userData) return null; // Don't show if not logged in

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-xl w-80 h-96 mb-4 flex flex-col border border-gray-200 pointer-events-auto overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-[#ff4d2d] text-white p-3 flex justify-between items-center">
            <div className="font-semibold flex items-center gap-2">
              <span>🤖</span> Hungry AI
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[80%] p-2 rounded-lg text-sm ${
                  msg.sender === "user"
                    ? "bg-[#ff4d2d] text-white self-end rounded-br-none"
                    : "bg-white border border-gray-200 text-gray-800 self-start rounded-bl-none shadow-sm"
                }`}
              >
                {msg.text.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                        {line}
                        {i < msg.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                ))}
              </div>
            ))}
            {loading && (
              <div className="self-start bg-white border border-gray-200 p-2 rounded-lg rounded-bl-none shadow-sm">
                <ClipLoader size={12} color="#ff4d2d" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-gray-100 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for food..."
              className="flex-1 text-sm border border-gray-300 rounded-full px-3 py-1.5 focus:outline-none focus:border-[#ff4d2d]"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#ff4d2d] text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto bg-[#ff4d2d] hover:bg-orange-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center text-2xl"
      >
        {isOpen ? "✕" : "🤖"}
      </button>
    </div>
  );
};

export default Chatbot;
