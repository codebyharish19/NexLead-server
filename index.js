import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import * as cheerio from 'cheerio';
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
  console.log("Server is running !");
  res.send("Server is running !");
});

// Main scraper endpoint
app.get("/scraper", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing url query parameter" });

  try {
    console.log(`Fetching: ${url}`);
    const response = await axios.get(url, { timeout: 20000 });
    const $ = cheerio.load(response.data);

    const text = $("body").text();

    const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || [];
    const phones = text.match(/(\+?\d[\d\s().-]{7,})/g) || [];

    const uniqueEmails = [...new Set(emails.map(e => e.trim()))];
    const uniquePhones = [...new Set(phones.map(p => p.trim()))];

    res.json({
      emails: uniqueEmails,
      phoneNumbers: uniquePhones,
    });
  } catch (error) {
    console.error("Scraping error:", error.message);
    res.status(500).json({ error: "Failed to scrape. Check URL or server logs." });
  }
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
