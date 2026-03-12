import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export default async function handler(req, res) {
  try {
    return res.status(200).json({
      ok: true,
      step: "imports work"
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "unknown error"
    });
  }
}