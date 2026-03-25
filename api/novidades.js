// api/novidades.js
// Endpoint PÚBLICO — qualquer visitante pode ler as novidades salvas

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Método não permitido" });

  try {
    const { data, error } = await supabase
      .from("novidades")
      .select("*")
      .order("criado_em", { ascending: false })
      .limit(50);

    if (error) throw error;

    // Retorna também a data da última atualização
    const { data: meta } = await supabase
      .from("meta")
      .select("*")
      .eq("chave", "ultima_atualizacao")
      .single();

    res.status(200).json({
      novidades: data || [],
      ultima_atualizacao: meta?.valor || null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
