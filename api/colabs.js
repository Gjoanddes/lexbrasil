// api/colabs.js — GET público: retorna publicações ativas dos colaboradores
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).end();
  const { data, error } = await sb
    .from("colabs_conteudo")
    .select("autor,cargo,titulo,tipo,texto,criado_em")
    .or("expira_em.is.null,expira_em.gt.now()")
    .order("criado_em", { ascending: false })
    .limit(10);
  if (error) return res.status(500).json({ colabs: [] });
  return res.status(200).json({ colabs: data || [] });
};
