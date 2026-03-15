import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLAN_FEATURES = {
  free: {
    maxChars: 5000,
    allowUrl: false,
    allowFiles: false,
    allowAcademic: false
  },
  pro: {
    maxChars: 20000,
    allowUrl: true,
    allowFiles: true,
    allowAcademic: true
  }
};

function getPlanFeatures(plan) {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.free;
}

function canUseTone(plan, type) {
  if (type !== "type-academic") return true;
  return getPlanFeatures(plan).allowAcademic === true;
}

function getSizeInstruction(size) {
  const sizeMap = {
    "size-short": "The summary must be very short, around 2 to 3 sentences.",
    "size-medium": "Write one solid paragraph summarizing the main ideas.",
    "size-long": "Write a more detailed summary explaining the key ideas clearly."
  };

  return sizeMap[size] || sizeMap["size-medium"];
}

function getTypeInstruction(type) {
  const typeMap = {
    "type-formal": "Use a formal and professional tone.",
    "type-casual": "Use a casual and easy-to-read tone.",
    "type-bullets": "Write the summary as bullet points. Each bullet should contain one clear key idea.",
    "type-academic": "Use an academic, structured and precise tone."
  };

  return typeMap[type] || typeMap["type-formal"];
}

function getLanguageInstruction(lang) {
  const langMap = {
    "pt-PT": "Write the summary in European Portuguese.",
    "en-US": "Write the summary in English.",
    "id-ID": "Write the summary in Indonesian.",
    "zh-CN": "Write the summary in Simplified Chinese."
  };

  return langMap[lang] || langMap["en-US"];
}

function getErrorMessage(key, lang) {
  const messages = {
    missingText: {
      "pt-PT": "Falta o texto para resumir.",
      "en-US": "Missing text to summarize.",
      "id-ID": "Teks untuk diringkas tidak ditemukan.",
      "zh-CN": "缺少要摘要的文本。"
    },
    missingUser: {
      "pt-PT": "Utilizador em falta.",
      "en-US": "Missing user.",
      "id-ID": "Pengguna tidak ditemukan.",
      "zh-CN": "缺少用户。"
    },
    userNotFound: {
      "pt-PT": "Utilizador não encontrado.",
      "en-US": "User not found.",
      "id-ID": "Pengguna tidak ditemukan.",
      "zh-CN": "未找到用户。"
    },
    textTooLong: {
      "pt-PT": "Esse tamanho de texto só está disponível no plano Pro.",
      "en-US": "That text length is only available on the Pro plan.",
      "id-ID": "Panjang teks ini hanya tersedia di paket Pro.",
      "zh-CN": "该文本长度仅适用于 Pro 方案。"
    },
    academicProOnly: {
      "pt-PT": "O tom académico só está disponível no plano Pro.",
      "en-US": "The academic tone is only available on the Pro plan.",
      "id-ID": "Nada akademik hanya tersedia di paket Pro.",
      "zh-CN": "学术语气仅适用于 Pro 方案。"
    },
    invalidMethod: {
      "pt-PT": "Método não permitido.",
      "en-US": "Method not allowed.",
      "id-ID": "Metode tidak diizinkan.",
      "zh-CN": "不允许使用该方法。"
    },
    internalError: {
      "pt-PT": "Erro interno do servidor.",
      "en-US": "Internal server error.",
      "id-ID": "Kesalahan server internal.",
      "zh-CN": "服务器内部错误。"
    }
  };

  return messages[key]?.[lang] || messages[key]?.["en-US"] || "Unknown error.";
}

async function getUserPlan(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("plan")
    .eq("id", userId)
    .single();

  if (error) {
    return { plan: null, error };
  }

  return { plan: data?.plan || "free", error: null };
}

export default async function handler(req, res) {
  const { lang = "en-US" } = req.body || {};

  if (req.method !== "POST") {
    return res.status(405).json({
      error: getErrorMessage("invalidMethod", lang)
    });
  }

  try {
    const {
      userId,
      text,
      size = "size-medium",
      type = "type-formal"
    } = req.body || {};

    if (!userId) {
      return res.status(400).json({
        error: getErrorMessage("missingUser", lang)
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: getErrorMessage("missingText", lang)
      });
    }

    const { plan, error: userError } = await getUserPlan(userId);

    if (userError || !plan) {
      console.error("User lookup error:", userError);

      return res.status(404).json({
        error: getErrorMessage("userNotFound", lang)
      });
    }

    const planFeatures = getPlanFeatures(plan);
    const cleanText = text.trim();

    if (cleanText.length > planFeatures.maxChars) {
      return res.status(403).json({
        error: getErrorMessage("textTooLong", lang)
      });
    }

    if (!canUseTone(plan, type)) {
      return res.status(403).json({
        error: getErrorMessage("academicProOnly", lang)
      });
    }

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
- Do not add introductions, notes or explanations outside the summary.
- Only output the final summary, not your reasoning.

${getLanguageInstruction(lang)}
${getSizeInstruction(size)}
${getTypeInstruction(type)}
    `.trim();

    const userPrompt = `
Summarize the following text:

${cleanText}
    `.trim();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
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

    const summary = response.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({
      summary: summary || ""
    });
  } catch (error) {
    console.error("Summarize API error:", error);

    return res.status(500).json({
      error: getErrorMessage("internalError", lang)
    });
  }
}