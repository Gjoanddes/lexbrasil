// api/colab-lista.js — GET público: lista colaboradores aprovados com contagem de publicações
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).end();
  const { data: colabs } = await sb.from("colaboradores").select("id,nome,cargo,instituicao,foto,ativo").eq("ativo", true).order("nome");
  const { data: pubs } = await sb.from("colabs_conteudo").select("colab_id").or("expira_em.is.null,expira_em.gt.now()");
  const contagem = {};
  (pubs||[]).forEach(p => { contagem[p.colab_id] = (contagem[p.colab_id]||0) + 1; });
  const resultado = (colabs||[]).map(c => ({ ...c, total_pubs: contagem[c.id]||0 }));
  return res.status(200).json({ colaboradores: resultado });
};
