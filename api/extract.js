export default async function handler(req, res) {
  try {
    return res.status(200).json({
      ok: true,
      step: "route works"
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "unknown error"
    });
  }
}