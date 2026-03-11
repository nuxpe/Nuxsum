import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url, length = "short" } = req.body || {};

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: "invalid URL" });
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      return res.status(400).json({
        error: `Page not available (${response.status})`
      });
    }

    const html = await response.text();

    const dom = new JSDOM(html, {
      url: parsedUrl.toString()
    });

    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return res.status(400).json({
        error: "It wasnt possible to extract valueble text from this page"
      });
    }

    const extractedText = article.textContent.trim().replace(/\s+/g, " ");

    if (!extractedText || extractedText.length < 100) {
      return res.status(400).json({
        error: "The content extracted is to short to summarize"
      });
    }

    const maxChars = 12000;
    const cleanedText = extractedText.slice(0, maxChars);

    const summarizeResponse = await fetch(
      `${req.headers.origin || ""}/api/summarize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: cleanedText,
          length
        })
      }
    );

    const summarizeData = await summarizeResponse.json();

    if (!summarizeResponse.ok) {
      return res.status(500).json({
        error: summarizeData.error || "Error generating the resume"
      });
    }

    return res.status(200).json({
      title: article.title || "",
      extractedText: cleanedText,
      summary: summarizeData.summary
    });
  } catch (error) {
    console.error("Extract error:", error);
    return res.status(500).json({
      error: "Internal error extracting the URL content"
    });
  }
}