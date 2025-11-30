import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import "./theme.css";

const API_URL = "https://chatppt-backend-production.up.railway.app/api/chat/";
const LOCAL_KEY = "chatppt_chats_v1";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState("");
  const [showToggleMsg, setShowToggleMsg] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingMessage]);

  useEffect(() => {
    const t = document.getElementById("chatbox");
    if (t) {
      t.style.height = "auto";
      t.style.height = t.scrollHeight + "px";
    }
  }, [input]);

  const timeNow = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendMessage = async () => {
    if (!input && !imageBase64) return;

    const newMsg = {
      role: "user",
      content: input || "(Image)",
      image: imageBase64,
      time: timeNow(),
    };

    setMessages((p) => [...p, newMsg]);
    setInput("");
    setImagePreview(null);
    setImageBase64(null);
    setLoading(true);

    const recentContext = messages
      .slice(-5)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    try {
      const res = await axios.post(API_URL, {
        message: newMsg.content,
        context: recentContext,
        image_base64: newMsg.image,
      });

      typeBotMessage(res.data.answer);
    } catch (err) {
      setLoading(false);
      typeBotMessage("⚠ Something went wrong — try again.");
    }
  };

  const typeBotMessage = (text) => {
    setLoading(false);
    setTypingMessage("");
    let i = 0;
    const speed = 17;

    const interval = setInterval(() => {
      setTypingMessage((prev) => prev + text.charAt(i));
      i++;
      if (i === text.length) {
        clearInterval(interval);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: text, time: timeNow() },
        ]);
        setTypingMessage("");
      }
    }, speed);
  };

  const handleUpload = (e) => {
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

  const showToggleWarning = () => {
    setShowToggleMsg(true);
    setTimeout(() => setShowToggleMsg(false), 3000);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="title">ChatPPT 🤖 Serious AI</div>

        <div className="theme-switch">
          <label>Cool🧊</label>
          <label className="switch">
            <input type="checkbox" onClick={showToggleWarning} />
            <span className="slider"></span>
          </label>
          <label>Hans❤️‍🩹</label>
        </div>
      </header>

      {showToggleMsg && (
        <div className="toggle-cloud">
          ⚠ Under construction — don’t play with this
        </div>
      )}

      <div className="chat">
        {messages.map((m, idx) => (
          <div key={idx} className={`msg-row ${m.role}`}>
            <img
              className="avatar"
              src={
                m.role === "user"
                  ? "/media/nakul.jpeg" // ✅ User is Nakul
                  : "/media/sathyan.jpg" // ✅ Bot is Sathyan
              }
              alt=""
            />
            <div className="bubble">
              <div className="text">{m.content}</div>
              {m.image && (
                <img
                  src={`data:image/png;base64,${m.image}`}
                  className="chat-img"
                />
              )}
              <div className="time">{m.time}</div>
            </div>
          </div>
        ))}

        {/* Also update the typing indicators for the bot */}
        {loading && typingMessage === "" && (
          <div className="msg-row assistant">
            <img
              className="avatar"
              src="/media/sathyan.jpg" // ✅ Bot typing image
              alt=""
            />
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {typingMessage && (
          <div className="msg-row assistant">
            <img
              className="avatar"
              src="/media/sathyan.jpg" // ✅ Bot typing image
              alt=""
            />
            <div className="bubble">
              {typingMessage}
              <span className="cursor"></span>
            </div>
          </div>
        )}

      <div className="input-area">
        {imagePreview && <img src={imagePreview} className="preview" />}
        <label className="upload-btn">
          📎
          <input type="file" accept="image/*" onChange={handleUpload} />
        </label>
        <textarea
          id="chatbox"
          placeholder="Message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
        />
        <button className="send" onClick={sendMessage} disabled={loading}>
          ➤
        </button>
      </div>
    </div>
  );
}

//