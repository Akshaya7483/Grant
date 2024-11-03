const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const db = require("./database"); // Assuming you have a database module for handling DB operations
const authController = require('./controllers/authController'); // Authentication controller for login, register, etc.

const app = express();
const PORT = 8081;

app.use(cors()); // Enable CORS to allow requests from the frontend
app.use(express.json()); // Parse JSON bodies

// Authentication Routes
app.post("/get-otp", authController.getOtp);
app.post("/register", authController.register);
app.post("/login", authController.login);
app.post("/reset-password", authController.resetPassword);
app.post("/check-email", authController.checkEmail);

// Chat Session Management
let sessions = {}; // Store in-memory sessions

// Endpoint to create a new chat session with a custom title
app.post("/api/chat/new", (req, res) => {
  const { name } = req.body;
  const sessionName = name || "Untitled Chat"; // Default to "Untitled Chat" if no title is provided

  try {
    const result = db.prepare("INSERT INTO chat_sessions (name) VALUES (?)").run(sessionName);
    const sessionId = result.lastInsertRowid;
    sessions[sessionId] = []; // Initialize in-memory session storage
    res.json({ sessionId, sessionName });
  } catch (error) {
    console.error("Error creating new chat session:", error);
    res.status(500).json({ error: "Failed to create new chat session" });
  }
});

// Endpoint to get chat history for a specific session
app.get("/api/chat/:sessionId/history", (req, res) => {
  const { sessionId } = req.params;

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

  try {
    db.prepare("DELETE FROM messages WHERE session_id = ?").run(sessionId);
    db.prepare("DELETE FROM chat_sessions WHERE id = ?").run(sessionId);
    delete sessions[sessionId]; // Remove from in-memory sessions
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    res.status(500).json({ error: "Failed to delete chat session" });
  }
});

// Endpoint to handle message streaming with session ID validation
app.post("/api/chat/:sessionId/message", (req, res) => {
  const { sessionId } = req.params;
  const { prompt } = req.body;

  const session = db.prepare("SELECT id FROM chat_sessions WHERE id = ?").get(sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  try {
    // Insert user's message into the database and in-memory session
    db.prepare("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)").run(sessionId, "user", prompt);
    sessions[sessionId].push({ role: "user", content: prompt });

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    // AI processing using the Ollama model
    const ollamaProcess = spawn("ollama", ["run", "supermario"]);
    ollamaProcess.stdin.write(prompt);
    ollamaProcess.stdin.end();

    let responseText = "";

    ollamaProcess.stdout.on("data", (data) => {
      const chunk = data.toString();
      responseText += chunk;
      res.write(chunk); // Send the data chunk to client
    });

    ollamaProcess.stderr.on("data", (data) => {
      console.error("Ollama error:", data.toString());
    });

    ollamaProcess.on("close", () => {
      // Store AI's response in the database and in-memory session
      db.prepare("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)").run(sessionId, "assistant", responseText);
      sessions[sessionId].push({ role: "assistant", content: responseText });
      res.end();
    });
  } catch (error) {
    console.error("Error processing message:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
