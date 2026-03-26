// api/acessos.js
// Registra um acesso e retorna o total

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "POST") {
      // Registra novo acesso
      await supabase.from("acessos").insert({
        acessado_em: new Date().toISOString(),
        referrer: req.headers["referer"] || null,
      });
    }

    // Retorna contagem total
    const { count } = await supabase
      .from("acessos")
      .select("*", { count: "exact", head: true });

    res.status(200).json({ total: count || 0 });
  } catch (e) {
    res.status(500).json({ error: e.message, total: 0 });
  }
};
