import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { text, size, type, lang } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Missing text" });
    }

    const sizeMap = {
      "size-short": "The summary must be very short (2-3 sentences).",
      "size-medium": "Write one solid paragraph summarizing the main ideas.",
      "size-long": "Write a more detailed summary explaining the key ideas clearly."
    };

    const typeMap = {
      "type-formal": "Use a formal and professional tone.",
      "type-casual": "Use a casual and easy-to-read tone.",
      "type-bullets": "Write the summary as bullet points.",
      "type-academic": "Use an academic and structured tone."
    };

    const langMap = {
      "pt-PT": "Write the summary in European Portuguese.",
      "en-US": "Write the summary in English.",
      "id-ID": "Write the summary in Indonesian.",
      "zh-CN": "Write the summary in Simplified Chinese."
    };

    const systemPrompt = `
    You are an expert text summarization assistant.

    Follow this process internally before answering:
    1. Identify the main ideas and key facts in the text.
    2. Remove redundant or secondary information.
    3. Organize the ideas logically.

    Rules:
    - Do not invent information.
    - Only use information present in the text.
    - Avoid repeating sentences from the original text.
    - Write clearly and concisely.
    - Only output the final summary, not your reasoning.

    ${langMap[lang] || langMap["en-US"]}
    ${sizeMap[size] || sizeMap["size-medium"]}
    ${typeMap[type] || typeMap["type-formal"]}
`;

    const userPrompt = `
Summarize the following text:

${text}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    const summary = response.choices[0].message.content;

    res.status(200).json({ summary });

  } catch (error) {

    console.error("API error:", error);

    res.status(500).json({
      error: "Internal server error"
    });

  }
}