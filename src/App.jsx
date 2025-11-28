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
  const [typingMessage, setTypingMessage] = useState("");
  const chatEndRef = useRef(null);

  // Load saved chats
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingMessage]);

  // Force dark mode always
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  // Auto resize textarea
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

    const userMsg = {
      role: "user",
      content: input || "(Image)",
      image: imageBase64,
      time: timeNow(),
    };

    setMessages((p) => [...p, userMsg]);
    setInput("");
    setImagePreview(null);
    setImageBase64(null);
    setLoading(true);

    try {
      const res = await axios.post(API_URL, {
        message: userMsg.content,
        context: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
        image_base64: userMsg.image,
      });

      typeWriter(res.data.answer);
    } catch {
      typeWriter("⚠ System error. Backend went out for chai.");
    }
  };

  // Typing effect (letter by letter)
  const typeWriter = (text) => {
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
    }, 20);
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

  // Toggle (disabled)
  const toggleClicked = () => {
    alert("⚠ It is under construction… don’t play with this 😑");
    document.documentElement.setAttribute("data-theme", "dark");
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="title">ChatPPT 🔥 psycho-funny AI</div>
        <div className="theme-switch">
          <label className="switch">
            <input type="checkbox" onChange={toggleClicked} />
            <span className="slider"></span>
          </label>
        </div>
      </header>
      <p className="feature-note">⚠ Under construction… don’t play with this 😑</p>

      {/* CHAT VIEW */}
      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`msg-row ${m.role}`}>
            <img
              className="avatar"
              src={
                m.role === "user"
                  ? "https://cdn-icons-png.flaticon.com/512/1946/1946429.png"
                  : "https://cdn-icons-png.flaticon.com/512/4712/4712107.png"
              }
            />
            <div>
              <div className="bubble">{m.content}</div>
              {m.image && <img src={imagePreview} className="chat-img" />}
              <div className="time">{m.time}</div>
            </div>
          </div>
        ))}

        {typingMessage && (
          <div className="msg-row assistant">
            <img
              className="avatar"
              src="https://cdn-icons-png.flaticon.com/512/4712/4712107.png"
            />
            <div className="bubble typing">{typingMessage}</div>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* INPUT */}
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
