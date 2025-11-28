import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import "./theme.css";

const API_URL = "https://chatppt-backend.onrender.com/api/chat/";
const LOCAL_KEY = "chatppt_chats_v1";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [typingMessage, setTypingMessage] = useState("");
  const chatEndRef = useRef(null);


  useEffect(() => {
  document.documentElement.setAttribute("data-theme", theme);
}, [theme]);

  /* Load saved chat */
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
  }, [messages]);

  /* Scroll to bottom */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingMessage]);

  /* Auto resize textbox */
  useEffect(() => {
    const textarea = document.getElementById("chatbox");
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }, [input]);

  const timeNow = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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

    try {
      const res = await axios.post(API_URL, {
        message: newMsg.content,
        context: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
        image_base64: newMsg.image,
      });

      typeBotMessage(res.data.answer);
    } catch {
      typeBotMessage("⚠ System error. Backend went out for chai.");
    }
  };

  /* Typewriter effect */
  const typeBotMessage = (text) => {
    setLoading(false);
    setTypingMessage("");
    let i = 0;

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
    }, 18); // typing speed
  };

  /* Upload image */
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

  /* Toggle theme */
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="title">ChatPPT 💥n hhbhhb</div>
        <div className="theme-switch">
          <label className="switch">
            <input type="checkbox" onChange={toggleTheme} />
            <span className="slider"></span>
          </label>
        </div>
      </header>
      <p className="feature-note">⚠ Under construction… don’t play with this 😑</p>

      {/* CHAT BOX */}
      <div className="chat">
        {messages.map((m, idx) => (
          <div key={idx} className={`msg-row ${m.role}`}>
            <img
              className="avatar"
              src={
                m.role === "user"
                  ? "https://cdn-icons-png.flaticon.com/512/1946/1946429.png"
                  : "https://cdn-icons-png.flaticon.com/512/4712/4712107.png"
              }
            />

            <div className="bubble">
              <div className="text">{m.content}</div>
              {m.image && <img src={`data:image/png;base64,${m.image}`} className="chat-img" />}
              <div className="time">{m.time}</div>
            </div>
          </div>
        ))}

        {/* typing animation */}
        {typingMessage && (
          <div className="msg-row assistant">
            <img
              className="avatar"
              src="https://cdn-icons-png.flaticon.com/512/4712/4712107.png"
            />
            <div className="bubble typing">{typingMessage}</div>
          </div>
        )}

        {loading && !typingMessage && (
          <div className="msg-row assistant">
            <img
              className="avatar"
              src="https://cdn-icons-png.flaticon.com/512/4712/4712107.png"
            />
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* INPUT AREA */}
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
//dd