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

    const sizeInstructionMap = {
      "size-short": "Keep it very short, around 2 to 3 sentences.",
      "size-medium": "Write one solid paragraph with the key ideas.",
      "size-long": "Write a more detailed summary with the main points clearly explained."
    };

    const typeInstructionMap = {
      "type-formal": "Use a formal, clear and professional tone.",
      "type-casual": "Use a casual, natural and easy-to-read tone.",
      "type-bullets": "Write the summary as bullet points.",
      "type-academic": "Use a more academic, structured and precise tone."
    };

    const languageInstructionMap = {
      "pt-PT": "Write the summary in European Portuguese.",
      "en-US": "Write the summary in English.",
      "id-ID": "Write the summary in Indonesian.",
      "zh-CN": "Write the summary in Simplified Chinese."
    };

    const prompt = `
${languageInstructionMap[lang] || languageInstructionMap["en-US"]}
${sizeInstructionMap[size] || sizeInstructionMap["size-medium"]}
${typeInstructionMap[type] || typeInstructionMap["type-formal"]}

Text:
${text}
    `.trim();

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt
    });

    return res.status(200).json({
      summary: response.output_text || ""
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}