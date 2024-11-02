const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const db = require("./database");

const app = express();
const PORT = 5000;

app.use(cors()); // Enable CORS to allow requests from the frontend
app.use(express.json()); // Parse JSON bodies

// Endpoint to create a new chat session with a custom title
app.post("/api/chat/new", (req, res) => {
  const { name } = req.body;

  const sessionName = name || "Untitled Chat"; // Default to "Untitled Chat" if no title is provided
  try {
    const result = db.prepare("INSERT INTO chat_sessions (name) VALUES (?)").run(sessionName);
    res.json({ sessionId: result.lastInsertRowid, sessionName });
  } catch (error) {
    console.error("Error creating new chat session:", error);
    res.status(500).json({ error: "Failed to create new chat session" });
  }
});

// Endpoint to get chat history for a specific session
app.get("/api/chat/:sessionId/history", (req, res) => {
  const { sessionId } = req.params;
  console.log("hello : ",req.params)
  try {
    const messages = db.prepare("SELECT role, content FROM messages WHERE session_id = ?").all(sessionId);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// Endpoint to delete a chat session and its messages
app.delete("/api/chat/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  console.log("hello : ",req.params)

  try {
    db.prepare("DELETE FROM messages WHERE session_id = ?").run(sessionId);
    db.prepare("DELETE FROM chat_sessions WHERE id = ?").run(sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    res.status(500).json({ error: "Failed to delete chat session" });
  }
});

// Endpoint to handle message streaming with session ID validation
app.post("/api/chat/:sessionId/message", (req, res) => {
  const { sessionId } = req.params;
  console.log("helloo app.post : ",req.params)
  const { prompt } = req.body;

  const session = db.prepare("SELECT id FROM chat_sessions WHERE id = ?").get(sessionId);
  if (!session) {
    return res.status(400).json({ error: "Invalid session ID" });
  }

  try {
    db.prepare("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)").run(sessionId, "user", prompt);
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    const ollamaProcess = spawn("ollama", ["run", "supermario"]);
    ollamaProcess.stdin.write(prompt);
    ollamaProcess.stdin.end();

    let responseText = "";

    ollamaProcess.stdout.on("data", (data) => {
      const chunk = data.toString();
      responseText += chunk;
      res.write(chunk);
    });

    ollamaProcess.stderr.on("data", (data) => {
      console.error("Ollama error:", data.toString());
    });

    ollamaProcess.on("close", () => {
      db.prepare("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)").run(sessionId, "assistant", responseText);
      res.end();
    });
  } catch (error) {
    console.error("Error processing message:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
