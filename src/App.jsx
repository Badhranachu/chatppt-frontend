import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import "./theme.css";

const API_URL = "https://chatppt-backend-production.up.railway.app/api/chat/";
const LOCAL_KEY = "chatppt_chats_v1";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState("");
  const [theme, setTheme] = useState("ambi");
  const chatEndRef = useRef(null);

  // 🔊 audio refs (no looping)
  const ambiRef = useRef(new Audio("/media/ambi.mp3"));
  const annyanRef = useRef(new Audio("/media/annyan.mp3"));

  // 🔓 unlock audio only after first click (fix loop when server stops / tab close)
  useEffect(() => {
    const unlock = () => {
      ["ambi", "annyan"].forEach((t) => {
        const a = t === "ambi" ? ambiRef.current : annyanRef.current;
        a.play().catch(() => {});
        a.pause();
        a.currentTime = 0;
      });
      window.removeEventListener("click", unlock);
    };
    window.addEventListener("click", unlock);
  }, []);

  // 🟢 play Ambi once when app first opens
  useEffect(() => {
    const ambi = ambiRef.current;
    ambi.loop = false;
    ambi.currentTime = 0;
    ambi.play().catch(() => {});
  }, []);

  // 🛑 Stop music when leaving app or page reload
  useEffect(() => {
    return () => {
      ambiRef.current.pause();
      annyanRef.current.pause();
      ambiRef.current.currentTime = 0;
      annyanRef.current.currentTime = 0;
    };
  }, []);

  // Load saved messages
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  // Save messages
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
  }, [messages]);

  // Auto scroll bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingMessage]);

  const timeNow = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendMessage = async () => {
    if (!input) return;

    const newMsg = {
      role: "user",
      content: input,
      time: timeNow(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    const recent = messages.slice(-5).map((m) => `${m.role}: ${m.content}`).join("\n");

    try {
      const res = await axios.post(API_URL, {
        message: newMsg.content,
        context: recent,
      });

      typeBotMessage(res.data.answer);
    } catch {
      typeBotMessage("⚠ Something went wrong — try again.");
      setLoading(false);
    }
  };

  const typeBotMessage = (text) => {
    setTypingMessage("");
    let i = 0;
    const speed = 17;

    const interval = setInterval(() => {
      setTypingMessage((prev) => prev + text.charAt(i));
      i++;
      if (i === text.length) {
        clearInterval(interval);
        setMessages((prev) => [...prev, { role: "assistant", content: text, time: timeNow() }]);
        setTypingMessage("");
        setLoading(false);
      }
    }, speed);
  };

  // 🎧 theme switch — one-time play
  const handleTheme = () => {
    const ambi = ambiRef.current;
    const annyan = annyanRef.current;

    if (theme === "ambi") {
      ambi.pause();
      ambi.currentTime = 0;

      annyan.loop = false;
      annyan.currentTime = 0;
      annyan.play().catch(() => {});
      setTheme("annyan");
    } else {
      annyan.pause();
      annyan.currentTime = 0;

      ambi.loop = false;
      ambi.currentTime = 0;
      ambi.play().catch(() => {});
      setTheme("ambi");
    }
  };

  return (
    <div className={`app ${theme}`}>
      {/* HEADER ALWAYS ON TOP */}
      <header className="header">
<div className={`title ${theme}`}>
  {theme === "ambi" ? "ChatPPT 🌀" : "ChatPPT 🤖🩲 Serious AI"}
</div>

        <div className="theme-switch">
  <img src="/media/ambi-toggle.jpg" className="toggle-icon left" alt="" />
  
  <label className="switch">
    <input
     type="checkbox" onChange={handleTheme} checked={theme === "annyan"} />
    <span className="slider"></span>
  </label>

  <img src="/media/annyan-toggle.jpg" className="toggle-icon right" alt="" />
</div>

      </header>

      {/* CHAT */}
      <div className="chat">
        {messages.map((m, idx) => (
          <div key={idx} className={`msg-row ${m.role}`}>
            <img className="avatar"
              src={m.role === "user" ? "/media/annyan.jpeg" : "/media/ambi.jpeg"}
              alt=""
            />
            <div className="bubble">
              <div>{m.content}</div>
              <div className="time">{m.time}</div>
            </div>
          </div>
        ))}

        {typingMessage && (
          <div className="msg-row assistant">
            <img className="avatar" src="/media/ambi.jpeg" alt="" />
            <div className="bubble">
              {typingMessage}
              <span className="cursor"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef}></div>
      </div>

      {/* INPUT AREA */}
      <div className="input-area">
        <label className="upload-btn">📎</label>
        <textarea
          id="chatbox"
          placeholder="Message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
        />
        <button className="send" onClick={sendMessage} disabled={loading}>➤</button>
      </div>
    </div>
  );
}
