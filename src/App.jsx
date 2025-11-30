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
  const [loaded, setLoaded] = useState(false);   // ⬅ NEW (loader screen)
  const chatEndRef = useRef(null);

  // Audio refs
  const ambiRef = useRef(new Audio("/media/ambi.mp3"));
  const annyanRef = useRef(new Audio("/media/annyan.mp3"));

  /* ================= PRELOAD EVERYTHING FIRST ================= */
  useEffect(() => {
    const bgImgs = [
      "/media/ambi.jpeg",
      "/media/annyan.jpeg",
      "/media/ambi-lap.png",
      "/media/annyan-lap.png",
      "/media/ambi-toggle.jpg",
      "/media/annyan-toggle.jpg",
      "/media/ambi.jpeg",
      "/media/annyan.jpeg",
    ];

    const loadImage = src =>
      new Promise(resolve => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
      });

    const loadAudio = src =>
      new Promise(resolve => {
        const audio = new Audio(src);
        audio.oncanplaythrough = resolve;
      });

    Promise.all([
      ...bgImgs.map(loadImage),
      loadAudio("/media/ambi.mp3"),
      loadAudio("/media/annyan.mp3"),
    ]).then(() => setLoaded(true));
  }, []);

  /* ================= UNLOCK SOUND AFTER FIRST CLICK ================= */
  useEffect(() => {
    const unlock = () => {
      [ambiRef.current, annyanRef.current].forEach(a => {
        a.play().catch(() => {});
        a.pause();
        a.currentTime = 0;
      });
      window.removeEventListener("click", unlock);
    };
    window.addEventListener("click", unlock);
  }, []);

  /* ================= PLAY AMBI ON FIRST LOAD ================= */
  useEffect(() => {
    if (!loaded) return;
    ambiRef.current.loop = false;
    ambiRef.current.currentTime = 0;
    ambiRef.current.play().catch(() => {});
  }, [loaded]);

  // Stop music when closing tab
  useEffect(() => {
    return () => {
      ambiRef.current.pause();
      annyanRef.current.pause();
    };
  }, []);

  // Load / Save Chat
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) setMessages(JSON.parse(saved));
  }, []);

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
    if (!input.trim()) return;

    const newMsg = { role: "user", content: input, time: timeNow() };
    setMessages(p => [...p, newMsg]);
    setInput("");
    setLoading(true);

    const ctx = messages.slice(-5).map(m => `${m.role}: ${m.content}`).join("\n");

    try {
      const res = await axios.post(API_URL, { message: newMsg.content, context: ctx });
      typeBotMessage(res.data.answer);
    } catch {
      typeBotMessage("⚠ Something went wrong — try again.");
      setLoading(false);
    }
  };

  const typeBotMessage = (text) => {
    setTypingMessage("");
    let i = 0;
    const interval = setInterval(() => {
      setTypingMessage(p => p + text.charAt(i));
      i++;
      if (i === text.length) {
        clearInterval(interval);
        setTypingMessage("");
        setMessages(p => [...p, { role: "assistant", content: text, time: timeNow() }]);
        setLoading(false);
      }
    }, 17);
  };

  // Toggle theme
  const handleTheme = () => {
    const ambi = ambiRef.current;
    const annyan = annyanRef.current;

    if (theme === "ambi") {
      ambi.pause();
      ambi.currentTime = 0;
      annyan.currentTime = 0;
      annyan.play().catch(() => {});
      setTheme("annyan");
    } else {
      annyan.pause();
      annyan.currentTime = 0;
      ambi.currentTime = 0;
      ambi.play().catch(() => {});
      setTheme("ambi");
    }
  };

  /* =============== SHOW LOADER WHILE PRELOADING =============== */
  if (!loaded) {
    return (
      <div className="loader-screen">
        <div className="spinner"></div>
        <p>Loading ChatPPT…</p>
      </div>
    );
  }

  return (
    <div className={`app ${theme}`}>
      {/* HEADER */}
      <header className="header">
        <div className={`title ${theme}`}>
          {theme === "ambi" ? "CHATPPT 🌀" : "ChatPPT 🤖🩲 Serious AI"}
        </div>

        <div className="theme-switch">
          <img src="/media/ambi-toggle.jpg" className="toggle-icon left" alt="" />
          <label className="switch">
            <input type="checkbox" onChange={handleTheme} checked={theme === "annyan"} />
            <span className="slider"></span>
          </label>
          <img src="/media/annyan-toggle.jpg" className="toggle-icon right" alt="" />
        </div>
      </header>

      {/* CHAT */}
      <div className="chat">
        {messages.map((m, idx) => (
          <div key={idx} className={`msg-row ${m.role}`}>
            <img className="avatar" src={m.role === "user" ? "/media/annyan.jpeg" : "/media/ambi.jpeg"} alt="" />
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
            </div>
          </div>
        )}
        <div ref={chatEndRef}></div>
      </div>

      {/* INPUT BAR */}
      <div className="input-area">
        <label className="upload-btn">📎</label>
        <textarea
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
