// api/perfil.js
// Salva as respostas do questionário de perfil do usuário

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "POST") {
      const { estudante_direito, formado_direito, outra_area } = req.body;

      await supabase.from("perfis").insert({
        estudante_direito,   // 'sim' | 'nao' | 'na'
        formado_direito,     // 'sim' | 'nao' | 'na'
        outra_area: outra_area || null,
        respondido_em: new Date().toISOString(),
      });

      res.status(200).json({ ok: true });
    } else if (req.method === "GET") {
      // Retorna estatísticas agregadas (para o admin)
      const { data } = await supabase
        .from("perfis")
        .select("estudante_direito, formado_direito, outra_area");

      const stats = {
        total: data?.length || 0,
        estudantes_sim: data?.filter(r => r.estudante_direito === "sim").length || 0,
        estudantes_nao: data?.filter(r => r.estudante_direito === "nao").length || 0,
        formados_sim: data?.filter(r => r.formado_direito === "sim").length || 0,
        formados_nao: data?.filter(r => r.formado_direito === "nao").length || 0,
        outras_areas: data?.filter(r => r.outra_area).map(r => r.outra_area) || [],
      };

      res.status(200).json(stats);
    } else {
      res.status(405).json({ error: "Método não permitido" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
