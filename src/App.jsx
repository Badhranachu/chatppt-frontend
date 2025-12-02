import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import "./theme.css";

const API_URL = "https://chatppt-backend-production.up.railway.app/api/chat/";
const LOCAL_KEY = "chatppt_chats_v2";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState("");
  const [theme, setTheme] = useState("ambi");
  const [loaded, setLoaded] = useState(false);
  const chatEndRef = useRef(null);

  const ambiRef = useRef(new Audio("/media/ambi.mp3"));
  const annyanRef = useRef(new Audio("/media/annyan.mp3"));

  /* ================= PRELOAD ================= */
  useEffect(() => {
    const imgs = [
      "/media/ambi.jpeg",
      "/media/annyan.jpeg",
      "/media/ambi-lap.png",
      "/media/annyan-lap.png",
      "/media/ambi-toggle.jpg",
      "/media/annyan-toggle.jpg",
    ];
    const loadImg = (src) => new Promise((r) => { const i = new Image(); i.src = src; i.onload = r; });
    const loadAudio = (src) => new Promise((r) => { const a = new Audio(src); a.oncanplaythrough = r; });

    Promise.all([
      ...imgs.map(loadImg),
      loadAudio("/media/ambi.mp3"),
      loadAudio("/media/annyan.mp3"),
    ]).then(() => setLoaded(true));
  }, []);

  /* ================= UNLOCK AUDIO ================= */
  useEffect(() => {
    const unlock = () => {
      [ambiRef.current, annyanRef.current].forEach((a) => {
        a.play().catch(() => {});
        a.pause();
        a.currentTime = 0;
      });
      window.removeEventListener("click", unlock);
    };
    window.addEventListener("click", unlock);
  }, []);

  /* ================= DEFAULT AMBI PLAY ================= */
  useEffect(() => {
    if (!loaded) return;
    ambiRef.current.currentTime = 0;
    ambiRef.current.play().catch(() => {});
  }, [loaded]);

  /* ================= LOAD HISTORY ================= */
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
  }, [messages]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingMessage]);

  const timeNow = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMsg = { role: "user", content: input, time: timeNow(), theme };
    setMessages((p) => [...p, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(API_URL, {
        message: newMsg.content,
        theme,
        history: messages
      });
      typeBotMessage(res.data.answer, res.data.theme);
    } catch {
      typeBotMessage("⚠ Something went wrong — try again.", theme);
      setLoading(false);
    }
  };

  /* ================= TYPING ANIMATION (Fixed) ================= */
  const typeBotMessage = (text, msgTheme) => {
    const clean = text.replace(/^\n+/, ""); // remove hidden newlines
    setTypingMessage("");
    let i = 0;

    const interval = setInterval(() => {
      setTypingMessage((prev) => prev + clean.charAt(i));
      i++;
      if (i >= clean.length) {
        clearInterval(interval);
        setTypingMessage("");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: clean, time: timeNow(), theme: msgTheme },
        ]);
        setLoading(false);
      }
    }, 18);
  };

  /* ================= THEME SWITCH ================= */
  const handleTheme = () => {
    const ambi = ambiRef.current;
    const ann = annyanRef.current;

    if (theme === "ambi") {
      ambi.pause();
      ambi.currentTime = 0;
      ann.currentTime = 0;
      ann.play().catch(() => {});
      setTheme("annyan");
    } else {
      ann.pause();
      ann.currentTime = 0;
      ambi.currentTime = 0;
      ambi.play().catch(() => {});
      setTheme("ambi");
    }
  };

  /* ================= LOADING SCREEN ================= */
  if (!loaded) {
    return (
      <div className="loader-screen">
        <div className="spinner"></div>
        <p>Loading ChatPPT…</p>
      </div>
    );
  }

  /* ================= UI ================= */
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
            <input type="checkbox" checked={theme === "annyan"} onChange={handleTheme} />
            <span className="slider"></span>
          </label>
          <img src="/media/annyan-toggle.jpg" className="toggle-icon right" alt="" />
        </div>
      </header>

      {/* CHAT */}
      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`msg-row ${m.role}`}>
            <img
              className="avatar"
              src={m.theme === "ambi" ? "/media/ambi.jpeg" : "/media/annyan.jpeg"}
              alt=""
            />
            <div className="bubble">
              <div>{m.content}</div>
              <div className="time">{m.time}</div>
            </div>
          </div>
        ))}

        {/* TYPING BUBBLE */}
        {typingMessage && (
          <div className="msg-row assistant">
            <img
              className="avatar"
              src={theme === "ambi" ? "/media/ambi.jpeg" : "/media/annyan.jpeg"}
              alt=""
            />
            <div className="bubble typing-cursor">{typingMessage}</div>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* INPUT */}
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
