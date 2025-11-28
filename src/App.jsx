import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const LOCAL_KEY = "chatppt_chats_v1";
const API_URL = "https://chatppt-backend.onrender.com/api/chat/";
const MIN_TYPING_MS = 700; // minimum time to show typing animation

function App() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const chatEndRef = useRef(null);

  // Load chat on refresh
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  // Auto-save + scroll
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!userInput && !imageBase64) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newUserMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userInput || "(Image)",
      image: imageBase64 || null,
      time: timestamp,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setUserInput("");
    setIsLoading(true);

    const context = messages
      .slice(-12)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const startedAt = Date.now();

    const finishLoading = (callback) => {
      const elapsed = Date.now() - startedAt;
      const delay = Math.max(0, MIN_TYPING_MS - elapsed);
      setTimeout(() => {
        callback?.();
        setIsLoading(false);
        setImageBase64(null);
        setImagePreview(null);
      }, delay);
    };

    try {
      const res = await axios.post(
        API_URL,
        {
          message: userInput,
          context,
          image_base64: imageBase64,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.data.answer,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      finishLoading(() => {
        setMessages((prev) => [...prev, botMessage]);
      });
    } catch (err) {
      finishLoading(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: "err",
            role: "assistant",
            content: "⚠ Something went wrong. Try again.",
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      setImageBase64(base64);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const clearChat = () => {
    if (window.confirm("Clear full chat?")) setMessages([]);
  };

  return (
    <div className="app-root">
      <aside className="sidebar">
        <h1 className="brand">ChatPPT</h1>
        <p className="subtitle">Smart AI Chat Assistant</p>
        <button className="btn" onClick={clearChat}>
          🧹 Clear Chat
        </button>
      </aside>

      <main className="chat-container">
        <header className="chat-header">
          <h2>ChatPPT</h2>
        </header>

        <section className="messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <h3>Start a conversation</h3>
              <p>Ask anything. You’ll get a brutally honest answer.</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-row ${
                msg.role === "user" ? "message-user" : "message-assistant"
              }`}
            >
              <div className="message-bubble">
                {msg.image && (
                  <img
                    src={`data:image/jpeg;base64,${msg.image}`}
                    className="chat-image"
                    alt="sent"
                  />
                )}

                {msg.content.split("\n\n").map((para, idx) => (
                  <p key={idx} className="message-para">
                    {para}
                  </p>
                ))}

                <div className="message-time">{msg.time}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message-row message-assistant">
              <div className="typing-bubble">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </section>

        <footer className="chat-input-area">
          <label className="upload-icon">
            📎
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileUpload}
            />
          </label>

          <textarea
            placeholder="Message..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            className="btn send-btn"
            onClick={handleSend}
            disabled={isLoading}
          >
            {isLoading ? "..." : "Send"}
          </button>
        </footer>
      </main>
    </div>
  );
}

export default App;
