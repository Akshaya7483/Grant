import React, { useState, useEffect } from "react";
import axios from "axios";
import "./GrantAI.css";

function GrantAI() {
  const [sessionId, setSessionId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [sessionTitles, setSessionTitles] = useState({});
  const [isRenaming, setIsRenaming] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [isEllipsisOpen, setIsEllipsisOpen] = useState(null);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    const fetchChatSessions = async () => {
      try {
        const response = await axios.get("http://localhost:8081/api/chat/sessions");
        const data = response.data;

        const sessionData = {};
        data.forEach((session) => {
          sessionData[session.id] = session.name;
        });

        setChatSessions(data.map((session) => session.id));
        setSessionTitles(sessionData);
      } catch (error) {
        console.error("Error fetching chat sessions:", error);
      }
    };

    fetchChatSessions();
  }, []);

  const createNewChat = async (title = "Untitled Chat") => {
    const response = await axios.post("http://localhost:8081/api/chat/new", { name: title });
    const data = response.data;

    setSessionId(data.sessionId);
    setSessionTitles({ ...sessionTitles, [data.sessionId]: title });
    setChatSessions([data.sessionId, ...chatSessions]);
    setMessages([]);
    return data.sessionId;
  };

  const renameChat = async (id, newName) => {
    if (!newName.trim()) return;
    setSessionTitles({ ...sessionTitles, [id]: newName });

    await axios.patch(`http://localhost:8081/api/chat/${id}/rename`, { name: newName });
    setIsRenaming(null);
    setNewTitle("");
  };

  const deleteChat = async (id) => {
    await axios.delete(`http://localhost:8081/api/chat/${id}`);
    setChatSessions(chatSessions.filter((session) => session !== id));
    setSessionTitles((prevTitles) => {
      const updatedTitles = { ...prevTitles };
      delete updatedTitles[id];
      return updatedTitles;
    });

    if (id === sessionId) {
      setSessionId(null);
      setMessages([]);
    }
  };

  const fetchChatHistory = async (id) => {
    const response = await axios.get(`http://localhost:8081/api/chat/${id}/history`);
    const data = response.data;
    setSessionId(id);
    setMessages(data);
  };

  const sendMessage = async () => {
    let currentSessionId = sessionId;

    if (!sessionId) {
      currentSessionId = await createNewChat();
    }

    // Check if the chat is "Untitled Chat" and rename it based on the first message
    if (sessionTitles[currentSessionId] === "Untitled Chat" && prompt.trim()) {
      const newTitle = prompt.split(" ").slice(0, 3).join(" "); // Use first 3 words as title
      renameChat(currentSessionId, newTitle);
    }

    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setPrompt("");

    const responseStream = await fetch(`http://localhost:8081/api/chat/${currentSessionId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const reader = responseStream.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let assistantMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      assistantMessage.content += decoder.decode(value);
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1 ? assistantMessage : msg
        )
      );
    }
  };

  const handleEllipsisClick = (id) => {
    setIsEllipsisOpen(isEllipsisOpen === id ? null : id);
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="heading">Chat with GrantAI 🤖</h1>
        <button className="theme-toggle" onClick={toggleTheme}>
          Toggle Theme
        </button>
      </div>
      <div style={{ display: "flex", marginTop: "20px" }}>
        <div style={{ width: "30%", marginRight: "20px" }}>
          <div className="chat-list-container">
            <h2 className="chat-title">Chats</h2>
            <button onClick={() => createNewChat()} className="new-chat-button">
              +
            </button>
          </div>
          {chatSessions.map((id) => (
            <div
              key={id}
              className="chat-item"
              onDoubleClick={() => {
                setIsRenaming(id);
                setNewTitle(sessionTitles[id]);
              }}
            >
              {isRenaming === id ? (
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onBlur={() => renameChat(id, newTitle)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") renameChat(id, newTitle);
                  }}
                  autoFocus
                />
              ) : (
                <div onClick={() => fetchChatHistory(id)} style={{ flexGrow: 1 }}>
                  {sessionTitles[id] || `Chat ${id}`}
                </div>
              )}
              <div onClick={() => handleEllipsisClick(id)} className="ellipsis-menu">
                ⋮
              </div>
              {isEllipsisOpen === id && (
                <div className="dropdown-menu">
                  <button onClick={() => deleteChat(id)}>Delete</button>
                  <button onClick={() => setIsRenaming(id)}>Rename</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ width: "70%" }}>
          <div className="chat-history" style={{ marginBottom: "20px" }}>
            {messages.map((msg, index) => (
              <div key={index} className={`message-box ${msg.role}`}>
                <strong>{msg.role === "user" ? "You" : "Assistant"}:</strong> {msg.content}
              </div>
            ))}
          </div>
          <textarea
            className="textarea"
            placeholder="Enter your message"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows="3"
          />
          <br />
          <button onClick={sendMessage} className="send-button" disabled={!prompt}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default GrantAI;
