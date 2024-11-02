import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [sessionTitles, setSessionTitles] = useState({});
  const [isRenaming, setIsRenaming] = useState(null); // Track which chat is being renamed
  const [newTitle, setNewTitle] = useState("");
  const [isEllipsisOpen, setIsEllipsisOpen] = useState(null); // Track which menu is open

  useEffect(() => {
        const fetchChatSessions = async () => {
          try {
            const response = await fetch("http://localhost:5000/api/chat/sessions");
            const data = await response.json();
      
            // Assuming the response is an array of sessions with id and name
            const sessionData = {};
            data.forEach(session => {
              sessionData[session.id] = session.name;
            });
      
            setChatSessions(data.map(session => session.id));
            setSessionTitles(sessionData);
          } catch (error) {
            console.error("Error fetching chat sessions:", error);
          }
        };
      
        fetchChatSessions();
      }, []);
      

  const createNewChat = async (title) => {
    const response = await fetch("http://localhost:5000/api/chat/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: title }),
    });
    const data = await response.json();

    setSessionId(data.sessionId);
    setSessionTitles({ ...sessionTitles, [data.sessionId]: data.sessionName });
    setChatSessions([data.sessionId, ...chatSessions]);
    setMessages([]);
    return data.sessionId

  };

  const renameChat = async (id) => {
    if (!newTitle.trim()) return; // Ignore empty title
    setSessionTitles({ ...sessionTitles, [id]: newTitle });

    // Call backend to update the title
    await fetch(`http://localhost:5000/api/chat/${id}/rename`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTitle }),
    });

    setIsRenaming(null);
    setNewTitle("");
  };

  const deleteChat = async (id) => {
    await fetch(`http://localhost:5000/api/chat/${id}`, {
      method: "DELETE",
    });
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
    const response = await fetch(`http://localhost:5000/api/chat/${id}/history`);
    const data = await response.json();
    setSessionId(id);
    setMessages(data);
  };

  const sendMessage = async () => {
    let newid=sessionId
    if (!sessionId) {
      newid=await createNewChat(prompt.slice(0, 20))
    }
    else {
       newid=sessionId
    }

    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setPrompt("");

    const responseStream = await fetch(`http://localhost:5000/api/chat/${newid}/message`, {
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
      <h1 className="heading">Chat with Aliyah🤖</h1>
      <div style={{ display: "flex", marginTop: "20px" }}>
        <div style={{ width: "30%", marginRight: "20px" }}>
          <div className="chat-list-container">
            <h2 className="chat-title">Chats</h2>
            <button 
              onClick={() => createNewChat("Untitled Chat")}
              className="new-chat-button"
            >
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
                  onBlur={() => renameChat(id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") renameChat(id);
                  }}
                  autoFocus
                />
              ) : (
                <div
                  onClick={() => fetchChatHistory(id)}
                  style={{ flexGrow: 1 }}
                >
                  {sessionTitles[id] || `Chat ${id}`}
                </div>
              )}
              <div onClick={() => handleEllipsisClick(id)} className="ellipsis-menu">
                ⋮
              </div>
              {/* Dropdown Menu */}
              {isEllipsisOpen === id && (
                <div className="dropdown-menu">
                  <button onClick={() => deleteChat(id)}>Delete</button>
                  <button onClick={() => setIsRenaming(id)}>Rename</button>
                  <button>Edit</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ width: "70%" }}>
          <div className="chat-history" style={{ marginBottom: "20px" }}>
            {messages.map((msg, index) => (
              <div key={index} className="message-box">
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

export default App;
