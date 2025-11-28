import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import "./theme.css";

const API_URL = "https://chatppt-backend.onrender.com/api/chat/";
const LOCAL_KEY = "chatppt_chats_v1";
let retrying = false;

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
    const textarea = document.getElementById("chatbox");
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }, [input]);

  const timeNow = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendMessage = async () => {
    if (loading && retrying) return;
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
    retrying = false;

    try {
      const res = await axios.post(API_URL, {
        message: newMsg.content,
        context: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
        image_base64: newMsg.image,
      });
      typeBotMessage(res.data.answer);
    } catch {
      retrying = true;
      typeBotMessage("⚠ Server slow — retrying…");
      setTimeout(() => {
        retrying = false;
        sendMessage();
      }, 2000);
    }
  };

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

  const showToggleWarning = () => {
    setShowToggleMsg(true);
    setTimeout(() => setShowToggleMsg(false), 3000);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="title">ChatPPT 😈 Psycho-Sarcastic AI</div>
        <label className="switch">
          <input type="checkbox" onClick={showToggleWarning} />
          <span className="slider"></span>
        </label>
      </header>

      {showToggleMsg && (
        <div className="toggle-cloud">
          ⚠ Under construction — don’t play with this 😑
        </div>
      )}

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
              alt=""
            />
            <div className="bubble">
              {m.content}
              {m.image && (
                <img
                  src={`data:image/png;base64,${m.image}`}
                  className="chat-img"
                  alt=""
                />
              )}
              <div className="time">{m.time}</div>
            </div>
          </div>
        ))}

        {typingMessage && (
          <div className="msg-row assistant">
            <img
              className="avatar"
              src="https://cdn-icons-png.flaticon.com/512/4712/4712107.png"
              alt=""
            />
            <div className="bubble typing">{typingMessage}▌</div>
          </div>
        )}

        {loading && !typingMessage && (
          <div className="msg-row assistant">
            <img
              className="avatar"
              src="https://cdn-icons-png.flaticon.com/512/4712/4712107.png"
              alt=""
            />
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

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
