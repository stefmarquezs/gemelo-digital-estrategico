module.exports = async function handler(req, res) {
  const allowedOrigin = "https://stefmarquezs.github.io";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.headers.origin !== allowedOrigin) {
    return res.status(403).json({ error: "Origen no autorizado." });
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Falta configurar GEMINI_API_KEY en Vercel."
    });
  }

  const prompt = req.body && req.body.prompt;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({
      error: "Debes enviar una consulta."
    });
  }

  if (prompt.length > 20000) {
    return res.status(413).json({
      error: "La consulta es demasiado larga."
    });
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(502).json({
        error: "Gemini no pudo procesar la consulta."
      });
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("");

    return res.status(200).json({
      text: text || "Gemini no devolvió texto."
    });
  } catch (error) {
    console.error("Error al conectar con Gemini:", error);
    return res.status(500).json({
      error: "No se pudo conectar con Gemini."
    });
  }
};
