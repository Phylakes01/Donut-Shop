import { useState, useRef, useEffect } from "react";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `You are a friendly, enthusiastic, and polite AI assistant for BABI's Mini Donut, a small local donut shop in the City of San Jose Del Monte, Bulacan.
Your ONLY purpose is to talk about donuts, our shop's menu, pricing, location, and business details.
If a user asks about ANYTHING else (like writing code, general knowledge, math, politics, etc.), you MUST politely decline and steer the conversation back to our delicious mini donuts.
Use emojis occasionally. Keep responses relatively short and sweet.`;

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("chatHistory");
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [
      {
        role: "model",
        parts: [{ text: "Hi! I'm the BABI's Mini Donut assistant! 🍩 How can I help you today?" }]
      }
    ];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (localStorage.getItem("cookieConsent") === "accepted") {
      localStorage.setItem("chatHistory", JSON.stringify(messages));
    }
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  const requestClear = () => {
    setShowConfirm(true);
  };

  const confirmClear = () => {
    localStorage.removeItem("chatHistory");
    setMessages([
      {
        role: "model",
        parts: [{ text: "Hi! I'm the BABI's Mini Donut assistant! 🍩 How can I help you today?" }]
      }
    ]);
    setShowConfirm(false);
  };

  const cancelClear = () => {
    setShowConfirm(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", parts: [{ text: input.trim() }] };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare history for Gemini
      const history = messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: msg.parts
      })).slice(1); // skip initial greeting if we want, or keep it. We'll keep it so it remembers context.

      const requestBody = {
        system_instruction: { parts: { text: SYSTEM_INSTRUCTION } },
        contents: [...history, userMessage],
        generationConfig: {
          temperature: 0.7,
        }
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error("API responded with an error");
      }

      const data = await response.json();
      const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Oops, my sprinkles fell off! I couldn't process that.";

      setMessages((prev) => [...prev, { role: "model", parts: [{ text: botReply }] }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "model", parts: [{ text: "Sorry, I'm having trouble connecting to the bakery right now. Please try again later! 🍩" }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <strong>BABI's Assistant 🍩</strong>
            <button className="close-button" onClick={toggleChat}>&times;</button>
          </div>
          
          <div className="chatbot-messages">
            {showConfirm && (
              <div className="chat-confirm-overlay">
                <div className="chat-confirm-box">
                  <p>Delete chat history?</p>
                  <div className="chat-confirm-actions">
                    <button type="button" onClick={cancelClear} className="button secondary">Cancel</button>
                    <button type="button" onClick={confirmClear} className="button primary" style={{background: '#dc2626'}}>Delete</button>
                  </div>
                </div>
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.role === "user" ? "user" : "model"}`}>
                <p>{msg.parts[0].text}</p>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message model loading">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input" onSubmit={handleSend}>
            <button 
              type="button" 
              className="clear-button" 
              onClick={requestClear} 
              title="Clear chat history"
              aria-label="Clear chat history"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"></path>
              </svg>
            </button>
            <input
              type="text"
              placeholder="Ask about our donuts..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || showConfirm}
            />
            <button type="submit" disabled={isLoading || !input.trim() || showConfirm}>
              Send
            </button>
          </form>
        </div>
      )}

      <button className={`chatbot-trigger ${isOpen ? "hidden" : ""}`} onClick={toggleChat} aria-label="Open Chat">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.03 2 11c0 2.868 1.545 5.419 3.951 7.075-.41 1.636-1.398 3.013-1.465 3.107a.5.5 0 00.567.767c2.193-.574 4.02-1.63 5.305-2.58A10.87 10.87 0 0012 20c5.523 0 10-4.03 10-9s-4.477-9-10-9zM8 10a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm4 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm4 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
        </svg>
      </button>
    </div>
  );
}
