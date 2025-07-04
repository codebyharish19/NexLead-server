import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { scrapeContactInfo } from "./lib/scrapper.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
}));
app.use(express.json()); // parse JSON bodies

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is healthy!" });
});

// Default route
app.get("/", (req, res) => {
  res.send("Server is running!");
});


//scrapper

app.get("/scrape", async (req, res) => {
  try {
    const url = req.query.url;
    const result = await scrapeContactInfo(url);
    res.json(result);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
const PORT = process.env.PORT || 4000;


app.listen(PORT, () => {
  console.log(`🚀 Server running }`);
});
