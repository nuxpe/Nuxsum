export default async function handler(req, res) {
  try {
    const jsdomModule = await import("jsdom");
    const readabilityModule = await import("@mozilla/readability");

    return res.status(200).json({
      ok: true,
      message: "Imports work",
      jsdomLoaded: !!jsdomModule.JSDOM,
      readabilityLoaded: !!readabilityModule.Readability
    });
  } catch (error) {
    console.error("Import error:", error);

    return res.status(500).json({
      error: error.message || "Import failed",
      stack: error.stack || null
    });
  }
}