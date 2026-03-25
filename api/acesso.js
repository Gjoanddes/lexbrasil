// api/acesso.js
// GET  → retorna total de acessos
// POST → registra +1 acesso

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "POST") {
    // Incrementa contador
    const { data: atual } = await supabase
      .from("meta")
      .select("valor")
      .eq("chave", "total_acessos")
      .single()
      .catch(() => ({ data: null }));

    const novoTotal = (parseInt(atual?.valor || "0") + 1).toString();

    await supabase
      .from("meta")
      .upsert({ chave: "total_acessos", valor: novoTotal });

    return res.status(200).json({ total: parseInt(novoTotal) });
  }

  if (req.method === "GET") {
    const { data } = await supabase
      .from("meta")
      .select("valor")
      .eq("chave", "total_acessos")
      .single()
      .catch(() => ({ data: null }));

    return res.status(200).json({ total: parseInt(data?.valor || "0") });
  }

  res.status(405).json({ error: "Método não permitido" });
};
