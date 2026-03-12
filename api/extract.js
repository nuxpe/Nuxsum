import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { url } = req.body || {};

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }

    console.log("Fetching page:", parsedUrl.toString());

    const pageResponse = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml"
      }
    });

    console.log("Page status:", pageResponse.status);

    if (!pageResponse.ok) {
      return res.status(400).json({
        error: `Page not available (${pageResponse.status})`
      });
    }

    const html = await pageResponse.text();
    console.log("HTML length:", html.length);

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

    const extractedText = article.textContent.trim().replace(/\s+/g, " ");
    console.log("Extracted text length:", extractedText.length);

    return res.status(200).json({
      ok: true,
      title: article.title || "",
      extractedText: extractedText.slice(0, 500)
    });
  } catch (error) {
    console.error("Extract fatal error:", error);

    return res.status(500).json({
      error: error.message || "Internal extract error"
    });
  }
}