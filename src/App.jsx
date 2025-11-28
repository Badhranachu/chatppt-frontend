import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const LOCAL_KEY = "chatppt_chats_v1";
const API_URL = "https://chatppt-backend.onrender.com/api/chat/";

function App() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false); // waiting for API
  const [typingState, setTypingState] = useState(null); // typewriter
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [theme, setTheme] = useState("dark");

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Load old chat on refresh
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  // Save chat + scroll when messages change
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  // Scroll while text is typing
  useEffect(() => {
    if (typingState) scrollToBottom();
  }, [typingState]);

  // Typewriter effect for last bot message
  useEffect(() => {
    if (!typingState) return;

    if (typingState.text.length >= typingState.full.length) {
      setTypingState(null);
      return;
    }

    const timeout = setTimeout(() => {
      setTypingState((prev) => ({
        ...prev,
        text: prev.full.slice(0, prev.text.length + 1),
      }));
    }, 12); // typing speed (ms per char)

    return () => clearTimeout(timeout);
  }, [typingState]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!userInput && !imageBase64) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newUserMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userInput || "(Image)",
      image: imageBase64 || null,
      time,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setUserInput("");
    autoResizeTextarea("");
    setIsLoading(true);

    const context = messages
      .slice(-12)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    try {
      const res = await axios.post(
        API_URL,
        {
          message: userInput,
          context,
          image_base64: imageBase64,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const fullText = res.data.answer || "";
      const botId = (Date.now() + 1).toString();

      const botMessage = {
        id: botId,
        role: "assistant",
        content: fullText,
        image: null,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMessage]);
      setTypingState({ id: botId, full: fullText, text: "" });
    } catch (err) {
      const fallbackText = "⚠ chatppt glitched. Ask again.";
      const botId = (Date.now() + 1).toString();

      const botMessage = {
        id: botId,
        role: "assistant",
        content: fallbackText,
        image: null,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMessage]);
      setTypingState({ id: botId, full: fallbackText, text: "" });
    } finally {
      setIsLoading(false); // we now have text to type
      setImageBase64(null);
      setImagePreview(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setUserInput(value);
    autoResizeTextarea(value);
  };

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const newHeight = Math.min(el.scrollHeight, 140);
    el.style.height = newHeight + "px";
  };

  const handleFileUpload = (e) => {
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

  const clearChat = () => {
    if (window.confirm("Clear full chat?")) setMessages([]);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className={`app-root ${theme}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="brand">ChatPPT</h1>
          <p className="subtitle">Psycho-funny AI assistant</p>
        </div>

        <button className="btn" onClick={clearChat}>
          🧹 Clear Chat
        </button>

        <button className="btn theme-btn" onClick={toggleTheme}>
          {theme === "dark" ? "☀ Light mode" : "🌙 Dark mode"}
        </button>
      </aside>

      <main className="chat-container">
        <header className="chat-header">
          <h2>ChatPPT</h2>
        </header>

        <section className="messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <h3>Start a conversation</h3>
              <p>Ask anything. chatppt will answer with overconfident chaos.</p>
            </div>
          )}

          {messages.map((msg) => {
            const isBot = msg.role === "assistant";
            const isTypingMsg =
              typingState && typingState.id === msg.id && isBot;
            const contentToShow = isTypingMsg
              ? typingState.text
              : msg.content;

            return (
              <div
                key={msg.id}
                className={`message-row ${
                  isBot ? "message-assistant" : "message-user"
                }`}
              >
                {isBot && (
                  <div className="avatar bot-avatar">
                    <span>c</span>
                  </div>
                )}

                <div className="message-bubble">
                  {msg.image && (
                    <img
                      src={`data:image/jpeg;base64,${msg.image}`}
                      alt="sent"
                      className="chat-image"
                    />
                  )}

                  <div
                    className="message-content"
                    dangerouslySetInnerHTML={{
                      __html: (contentToShow || "")
                        .replace(/\n/g, "<br/>")
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                    }}
                  ></div>

                  <div className="message-time">{msg.time}</div>
                </div>

                {!isBot && (
                  <div className="avatar user-avatar">
                    <span>you</span>
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="message-row message-assistant">
              <div className="avatar bot-avatar">
                <span>c</span>
              </div>
              <div className="message-bubble typing-container">
                <div className="typing-bubble">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </section>

        <footer className="chat-input-area">
          <label className="upload-icon">
            📎
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileUpload}
            />
          </label>

          <div className="input-wrapper">
            {imagePreview && (
              <div className="preview-chip">
                <img src={imagePreview} alt="preview" />
                <button
                  className="remove-img"
                  onClick={() => {
                    setImagePreview(null);
                    setImageBase64(null);
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              placeholder="Message..."
              value={userInput}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              rows={1}
            />
          </div>

          <button
            className="btn send-btn"
            onClick={handleSend}
            disabled={isLoading}
          >
            {isLoading ? "..." : "Send"}
          </button>
        </footer>
      </main>
    </div>
  );
}

export default App;
