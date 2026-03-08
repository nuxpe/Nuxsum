const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, size } = req.body || {};

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Write or paste some text first." });
  }

  if (text.length > 12000) {
    return res.status(400).json({ error: "The text is too long. Try something shorter." });
  }

  let sizeInstruction = "";

  if (size === "size-short") {
    sizeInstruction =
      "Write a very concise summary in 2-3 sentences. Capture only the main idea and the most important points. Use your own words.";
  } else if (size === "size-long") {
    sizeInstruction =
      "Write a detailed but clear summary explaining the main ideas and important details. Keep the language natural, human-like and easy to read.";
  } else {
    sizeInstruction =
      "Write a clear summary in one well-structured paragraph highlighting the key ideas.";
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You summarize texts clearly and naturally. Write like a human explaining ideas, not like an AI. Avoid robotic phrasing.",
        },
        {
          role: "user",
          content: "Summarize the following text:\n\n" + text + "\n\n" + sizeInstruction,
        },
      ],
    });

    const summary = completion.choices[0].message.content;

    return res.status(200).json({ summary });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error generating summary." });
  }
};