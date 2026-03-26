// api/admin-colab.js — gerenciar colaboradores e publicações
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const senha = req.headers["x-admin-senha"];
  if (senha !== process.env.ADMIN_SENHA) return res.status(401).json({ error: "Senha incorreta" });

  if (req.method === "GET") {
    const { data: colabs } = await sb.from("colaboradores").select("id,nome,cargo,instituicao,usuario,ativo,email,criado_em").order("ativo").order("criado_em");
    const { data: pubs } = await sb.from("colabs_conteudo").select("id,autor,titulo,tipo,texto,fixada,criado_em,expira_em").order("fixada",{ascending:false}).order("criado_em",{ascending:false});
    return res.status(200).json({ colabs: colabs||[], publicacoes: pubs||[] });
  }

  if (req.method === "POST") {
    const { acao, nome, cargo, instituicao, usuario, senha: senhac, id, tipo, fixada } = req.body;

    if (acao === "cadastrar") {
      const { error } = await sb.from("colaboradores").insert([{ nome, cargo, instituicao, usuario, senha: senhac, ativo: true }]);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
    if (acao === "aprovar") {
      await sb.from("colaboradores").update({ ativo: true }).eq("id", id);
      // Notificar por email se configurado
      try {
        const { data: c } = await sb.from("colaboradores").select("nome,email").eq("id",id).single();
        if (c?.email && process.env.RESEND_API_KEY) {
          await fetch("https://api.resend.com/emails", { method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.RESEND_API_KEY}`},
            body: JSON.stringify({ from:"LEXBRASIL <noreply@resend.dev>", to:[c.email], subject:"Seu acesso ao LEXBRASIL foi aprovado!", html:`<h2>Bem-vindo ao LEXBRASIL!</h2><p>Olá ${c.nome}, seu cadastro como colaborador foi aprovado. Acesse <a href="https://lexbrasil.vercel.app/colaborador">lexbrasil.vercel.app/colaborador</a> para começar a publicar.</p>`})
          });
        }
      } catch(e){}
      return res.status(200).json({ ok: true });
    }
    if (acao === "rejeitar") {
      await sb.from("colaboradores").delete().eq("id", id);
      return res.status(200).json({ ok: true });
    }
    if (acao === "remover") {
      const tabela = tipo === "pub" ? "colabs_conteudo" : "colaboradores";
      await sb.from(tabela).delete().eq("id", id);
      return res.status(200).json({ ok: true });
    }
    if (acao === "fixar") {
      await sb.from("colabs_conteudo").update({ fixada: fixada !== false, expira_em: fixada !== false ? null : new Date(Date.now()+3*86400000).toISOString() }).eq("id", id);
      return res.status(200).json({ ok: true });
    }
  }
  return res.status(405).end();
};
