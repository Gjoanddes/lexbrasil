// api/colab-publicar.js — login, publicar, listar próprias, remover
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function verificarColab(usuario, senha) {
  const { data } = await sb.from("colaboradores").select("id,nome,cargo,instituicao,foto,ativo").eq("usuario", usuario).eq("senha", senha).single();
  return data;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  // GET: minhas publicações
  if (req.method === "GET") {
    const params = new URL(req.url, "http://x").searchParams;
    const acao = params.get("acao"), usuario = params.get("usuario"), senha = params.get("senha");
    if (acao !== "minhas") return res.status(400).end();
    const colab = await verificarColab(usuario, senha);
    if (!colab || !colab.ativo) return res.status(401).json({ error: "Não autorizado" });
    const { data } = await sb.from("colabs_conteudo").select("id,titulo,tipo,texto,fixada,criado_em,expira_em").eq("colab_id", colab.id).order("criado_em", { ascending: false });
    return res.status(200).json({ publicacoes: data || [] });
  }

  if (req.method !== "POST") return res.status(405).end();
  const { acao, usuario, senha, titulo, tipo, texto, dias, id } = req.body;

  // Login
  if (acao === "login") {
    const colab = await verificarColab(usuario, senha);
    if (!colab) return res.status(401).json({ error: "Usuário ou senha inválidos." });
    if (!colab.ativo) return res.status(403).json({ error: "Cadastro ainda não aprovado pelo administrador. Aguarde." });
    return res.status(200).json({ colab });
  }

  // Publicar
  if (acao === "publicar") {
    const colab = await verificarColab(usuario, senha);
    if (!colab || !colab.ativo) return res.status(401).json({ error: "Não autorizado" });
    const expira = dias ? new Date(Date.now() + dias * 86400000).toISOString() : new Date(Date.now() + 3 * 86400000).toISOString();
    const { error } = await sb.from("colabs_conteudo").insert([{ colab_id: colab.id, autor: colab.nome, cargo: colab.cargo, titulo, tipo: tipo || "Artigo", texto, expira_em: expira }]);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // Remover própria publicação
  if (acao === "remover") {
    const colab = await verificarColab(usuario, senha);
    if (!colab || !colab.ativo) return res.status(401).json({ error: "Não autorizado" });
    const { error } = await sb.from("colabs_conteudo").delete().eq("id", id).eq("colab_id", colab.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: "Ação inválida" });
};
