// api/colab-cadastro.js — POST: solicitação de cadastro de colaborador
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();
  const { nome, email, cargo, instituicao, foto, usuario, senha } = req.body;
  if (!nome || !email || !usuario || !senha) return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  // Salva como pendente (ativo = false)
  const { error } = await sb.from("colaboradores").insert([{
    nome, email, cargo, instituicao, foto, usuario, senha, ativo: false
  }]);
  if (error) return res.status(500).json({ error: error.message });
  // Tenta enviar email via Resend
  try {
    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "LEXBRASIL <noreply@resend.dev>",
          to: [process.env.EMAIL_DESTINO],
          subject: `Novo colaborador aguardando aprovação: ${nome}`,
          html: `<h2>Novo cadastro no LEXBRASIL</h2><p><b>Nome:</b> ${nome}</p><p><b>Email:</b> ${email}</p><p><b>Cargo:</b> ${cargo}</p><p><b>Instituição:</b> ${instituicao}</p><p><b>Usuário:</b> ${usuario}</p><p>Acesse o painel admin para aprovar ou rejeitar.</p>`
        })
      });
    }
  } catch(e) { /* email falhou, mas cadastro foi salvo */ }
  return res.status(200).json({ ok: true });
};
