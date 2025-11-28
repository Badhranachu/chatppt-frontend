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
  const [typingMessage, setTypingMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);     // typing dots ON/OFF
  const [showToggleMsg, setShowToggleMsg] = useState(false);
  const chatEndRef = useRef(null);

  // Load saved chat on first load
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  // Save chat whenever messages change
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingMessage, isThinking]);

  // Auto resize textarea
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
    if (!input && !imageBase64) return;

    const newMsg = {
      role: "user",
      content: input || "(Image)",
      image: imageBase64,
      time: timeNow(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setImagePreview(null);
    setImageBase64(null);

    // show typing dots immediately
    setTypingMessage("");
    setIsThinking(true);

    try {
      const res = await axios.post(API_URL, {
        message: newMsg.content,
        context: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
        image_base64: newMsg.image,
      });

      typeBotMessage(res.data.answer || "⚠ Empty brain. Try again.");
    } catch {
      typeBotMessage("⚠ Server slow — retrying…");
    }
  };

  // Typewriter effect + stop dots + show blinking cursor
  const typeBotMessage = (text) => {
    setIsThinking(false);        // hide dots
    setTypingMessage("");        // clear previous
    let i = 0;

    const interval = setInterval(() => {
      setTypingMessage((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        // push final message to chat
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: text, time: timeNow() },
        ]);
        setTypingMessage("");
      }
    }, 20); // typing speed (ms per character)
  };

  // Image upload
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

  // Fake theme toggle → only warning message
  const showToggleWarning = () => {
    setShowToggleMsg(true);
    setTimeout(() => setShowToggleMsg(false), 3000);
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="title">ChatPPT 🔥 psycho-funny AI</div>
        <div className="theme-switch">
          <label className="switch">
            <input type="checkbox" onClick={showToggleWarning} />
            <span className="slider"></span>
          </label>
        </div>
      </header>

      {showToggleMsg && (
        <div className="toggle-cloud">
          ⚠ Under construction… don’t play with this 😑
        </div>
      )}

      {/* CHAT AREA */}
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
              alt=""
            />

            <div className="bubble">
              <div className="text">{m.content}</div>
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

        {/* TYPING DOTS WHILE WAITING */}
        {isThinking && !typingMessage && (
          <div className="msg-row assistant">
            <img
              className="avatar"
              src="https://cdn-icons-png.flaticon.com/512/4712/4712107.png"
              alt=""
            />
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {/* TYPEWRITER + CURSOR */}
        {typingMessage && (
          <div className="msg-row assistant">
            <img
              className="avatar"
              src="https://cdn-icons-png.flaticon.com/512/4712/4712107.png"
              alt=""
            />
            <div className="bubble typing">
              {typingMessage}
              <span className="cursor" />
            </div>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* INPUT BAR */}
      <div className="input-area">
        {imagePreview && <img src={imagePreview} className="preview" alt="" />}

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

        <button className="send" onClick={sendMessage}>
          ➤
        </button>
      </div>
    </div>
  );
}
