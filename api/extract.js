import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url, size = "size-medium", lang = "en-US" } = req.body || {};

    if (!url || !url.trim()) {
      return res.status(400).json({ error: "URL is required" });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const pageResponse = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml"
      }
    });

    if (!pageResponse.ok) {
      return res.status(400).json({
        error: `Page not available (${pageResponse.status})`
      });
    }

    const html = await pageResponse.text();

    const dom = new JSDOM(html, {
      url: parsedUrl.toString()
    });

    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return res.status(400).json({
        error: "Could not extract useful text from this page"
      });
    }

    const extractedText = article.textContent
      .trim()
      .replace(/\s+/g, " ");

    if (extractedText.length < 100) {
      return res.status(400).json({
        error: "The extracted content is too short to summarize"
      });
    }

    const cleanedText = extractedText.slice(0, 12000);

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;

    const summarizeResponse = await fetch(`${protocol}://${host}/api/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: cleanedText,
        size,
        lang
      })
    });

    const summarizeContentType = summarizeResponse.headers.get("content-type") || "";
    const summarizeRaw = await summarizeResponse.text();

    let summarizeData;
    try {
      summarizeData = summarizeContentType.includes("application/json")
        ? JSON.parse(summarizeRaw)
        : null;
    } catch {
      summarizeData = null;
    }

    if (!summarizeResponse.ok) {
      return res.status(500).json({
        error:
          summarizeData?.error ||
          `Summarize endpoint failed: ${summarizeRaw || "Unknown error"}`
      });
    }

    if (!summarizeData || !summarizeData.summary) {
      return res.status(500).json({
        error: "Summarize endpoint did not return a valid summary"
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
      error: error.message || "Internal error extracting URL content"
    });
  }
}