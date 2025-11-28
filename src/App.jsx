import React, { useState, useEffect } from "react";
import axios from "axios";

const LOCAL_KEY = "chatppt_chats_v1";
const API_URL = "http://127.0.0.1:8000/api/chat/";

/* ──────────────────────────────────────────────
    1) CREATOR INSTAGRAM LIVE PREVIEW CARD
────────────────────────────────────────────── */
function CreatorCard() {
  const creator = {
    name: "Badhran K S",
    username: "i.badhran",
    image: "https://i.postimg.cc/hGb7P8tM/badhan-insta.jpg", // 🔥 USE THIS
  };

  return (
    <div
      className="creator-preview"
      onClick={() => window.open("https://www.instagram.com/i.badhran/", "_blank")}
      style={{ cursor: "pointer" }}
    >
      <img src={creator.image} className="creator-img" alt="Creator" />
      <div className="creator-meta">
        <div className="creator-name">{creator.name}</div>
        <div className="creator-id">@{creator.username}</div>
        <div className="creator-title">Developer of chatppt</div>
      </div>
    </div>
  );
}


/* ──────────────────────────────────────────────
    2) MAIN APPLICATION
────────────────────────────────────────────── */
function App() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Load stored chat on refresh
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  // Auto-store chat
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
  }, [messages]);

  const handleSend = async () => {
    if (!userInput && !imageBase64) return;

    const newUserMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userInput || "(Image)",
      image: imageBase64 || null,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setUserInput("");
    setIsLoading(true);

    const context = messages
      .slice(-12)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    try {
      const res = await axios.post(API_URL, {
        message: userInput,
        context,
        image_base64: imageBase64,
      });

      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.data.answer,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "err",
          role: "assistant",
          content: "chatppt crashed while trying to roast reality.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setImageBase64(null);
      setImagePreview(null);
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
        <h1>ChatPPT </h1>
        <p className="subtitle">100% Right.</p>

        <button className="btn" onClick={clearChat}>🧹 Clear Chat</button>

        <h3>Upload Image</h3>
        <input type="file" accept="image/*" onChange={handleFileUpload} />
        {imagePreview && <img src={imagePreview} alt="preview" className="preview-img" />}

      </aside>

      <main className="chat-container">
        <header className="chat-header">
          <h2>ChatPPT</h2>
          <span className="muted">Telling reality since 2025.</span>
        </header>

        <section className="messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <h3>Start a conversation</h3>
              <p>Ask anything. chatppt will confidently give Real answer .</p>
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
                <div className="message-role">{msg.role === "user" ? "You" : "chatppt"}</div>

                {msg.image && (
                  <img
                    src={`data:image/jpeg;base64,${msg.image}`}
                    alt="sent"
                    className="chat-image"
                  />
                )}

                {msg.content.split("\n").map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}

                {/* Auto Instagram preview card */}
                {msg.content.includes("instagram.com/i.badhran") && <CreatorCard />}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message-row message-assistant">
              <div className="message-bubble">
                <div className="message-role">chatppt</div>
                <p>Thinking of a dramatic insult…</p>
              </div>
            </div>
          )}
        </section>

        <footer className="chat-input-area">
          <textarea
            placeholder="Send a message..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
          />
          <button className="btn send-btn" onClick={handleSend} disabled={isLoading}>
            {isLoading ? "..." : "Send"}
          </button>
        </footer>
      </main>
    </div>
  );
}

export default App;
