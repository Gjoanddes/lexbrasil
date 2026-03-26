// api/colab-perfil.js — GET público: dados e publicações de um colaborador
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).end();
  const id = req.query?.id || new URL(req.url,"http://x").searchParams.get("id");
  if (!id) return res.status(400).json({ error: "id obrigatório" });
  const { data: colab } = await sb.from("colaboradores").select("id,nome,cargo,instituicao,foto").eq("id", id).single();
  if (!colab) return res.status(404).json({ error: "Colaborador não encontrado" });
  const { data: pubs } = await sb.from("colabs_conteudo")
    .select("titulo,tipo,texto,fixada,criado_em")
    .eq("colab_id", id)
    .or("expira_em.is.null,expira_em.gt.now()")
    .order("fixada", { ascending: false })
    .order("criado_em", { ascending: false });
  return res.status(200).json({ colaborador: colab, publicacoes: pubs||[] });
};
