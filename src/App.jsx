import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./theme.css";
import "./App.css";

const API_URL = "https://chatppt-backend.onrender.com/api/chat/";
const LOCAL_KEY = "chatppt_chats_v1";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [typing, setTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const chatEndRef = useRef(null);

  /* Load stored chat */
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) setMessages(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
  }, [messages]);

  /* Scroll bottom */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingText]);

  /* Time format */
  const timeNow = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  /* Send message */
  const send = async () => {
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

    try {
      const res = await axios.post(API_URL, {
        message: newMsg.content,
        context: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
        image_base64: newMsg.image,
      });

      typeBot(res.data.answer);
    } catch {
      typeBot("⚠ Unexpected system crash. Backend went for chai.");
    }
  };

  /* Letter-by-letter typing */
  const typeBot = (text) => {
    setTyping(true);
    setTypingText("");
    let i = 0;
    const interval = setInterval(() => {
      setTypingText((prev) => prev + text.charAt(i));
      i++;
      if (i === text.length) {
        clearInterval(interval);
        setTyping(false);
        setTypingText("");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: text, time: timeNow() },
        ]);
      }
    }, 20);
  };

  /* Upload image */
  const upload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      setImageBase64(r.result.split(",")[1]);
      setImagePreview(r.result);
    };
    r.readAsDataURL(f);
  };

  /* Toggle clicked */
  const toggleClicked = () => {
    alert("⚠ It is under construction… don’t play with this 😑");
  };

  return (
    <div className="app">
      <header className="header">
        <div className="title">ChatPPT ✨ n hhhhhb</div>
        <div onClick={toggleClicked} className="theme-switch">
          <label className="switch">
            <input type="checkbox" />
            <span className="slider"></span>
          </label>
        </div>
      </header>

      <p className="feature-note">⚠ Under construction… don’t play with this 😑</p>

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
            <div className="bubble">
              {m.content}
              {m.image && <img src={`data:image/png;base64,${m.image}`} className="chat-img" />}
              <div className="time">{m.time}</div>
            </div>
          </div>
        ))}

        {/* live typing bubble */}
        {typing && (
          <div className="msg-row assistant">
            <img
              className="avatar"
              src="https://cdn-icons-png.flaticon.com/512/4712/4712107.png"
            />
            <div className="bubble">{typingText}</div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="input-area">
        {imagePreview && <img src={imagePreview} className="preview" />}
        <label className="upload-btn">
          📎
          <input type="file" accept="image/*" onChange={upload} />
        </label>

        <textarea
          id="chatbox"
          placeholder="Message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
        />

        <button className="send" onClick={send}>➤</button>
      </div>
    </div>
  );
}
