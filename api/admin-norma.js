// api/admin-norma.js — POST: adiciona norma manualmente
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const senha = req.headers["x-admin-senha"];
  if (senha !== process.env.ADMIN_SENHA) return res.status(401).json({ error: "Senha incorreta" });

  const { tipo, nome, sigla, numero, url, texto, analise, temas, tribunal, tese } = req.body;
  if (!nome) return res.status(400).json({ error: "Nome obrigatório" });

  const { error } = await sb.from("normas_extras").insert([{
    tipo, nome, sigla, numero, url, texto, analise, temas, tribunal, tese
  }]);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
};
