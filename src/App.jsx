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
  const [typingText, setTypingText] = useState("");
  const [themeWarning, setThemeWarning] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingText]);

  const timeNow = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendMessage = async () => {
    if (!input && !imageBase64) return;

    const newMsg = {
      role: "user",
      content: input || "(Image)",
      time: timeNow(),
      image: imageBase64,
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

      typeWriter(res.data.answer);
    } catch {
      typeWriter("⚠ Backend went out for chai.");
    }
  };

  const typeWriter = (text) => {
    setLoading(false);
    setTypingText("");
    let i = 0;
    const interval = setInterval(() => {
      setTypingText((t) => t + text.charAt(i));
      i++;
      if (i === text.length) {
        clearInterval(interval);
        setMessages((p) => [...p, { role: "assistant", content: text, time: timeNow() }]);
        setTypingText("");
      }
    }, 19);
  };

  const toggleTheme = () => {
    setThemeWarning(true);
    setTimeout(() => setThemeWarning(false), 2000);
  };

  const uploadFile = (e) => {
    const f = e.target.files[0];
    const r = new FileReader();
    r.onload = () => {
      setImagePreview(r.result);
      setImageBase64(r.result.split(",")[1]);
    };
    r.readAsDataURL(f);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>ChatPPT 🔥 psycho-funny AI</h1>

        <div className="toggle-box" onClick={toggleTheme}>
          <div className="toggle-circle"></div>
        </div>
      </header>

      {themeWarning && (
        <div className="theme-popup">⚠ Under construction… don’t play with this 😑</div>
      )}

      <div className="chat-area">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="bubble">
              {m.content}
              {m.image && <img src={`data:image/png;base64,${m.image}`} className="chat-img" />}
              <div className="time">{m.time}</div>
            </div>
          </div>
        ))}

        {typingText && (
          <div className="msg assistant">
            <div className="bubble typing">{typingText}</div>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      <footer className="input-bar">
        <label className="upload-btn">📎
          <input type="file" accept="image/*" onChange={uploadFile} />
        </label>

        {imagePreview && <img src={imagePreview} className="preview" />}

        <textarea
          value={input}
          placeholder="Message…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
        />
        <button onClick={sendMessage}>➤</button>
      </footer>
    </div>
  );
}
