// api/admin-atualizar.js
// Endpoint PRIVADO — só o admin acessa (senha via header)

const { createClient } = require("@supabase/supabase-js");
const https = require("https");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service key para escrita
);

// Função helper para chamar a API Anthropic
function chamarClaude(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system:
        "Você é um jurista brasileiro especializado em acompanhamento legislativo e jurisprudencial. Faça buscas reais na web para encontrar as novidades mais recentes. Retorne sempre JSON válido conforme solicitado, sem markdown, sem texto extra.",
      messages: [{ role: "user", content: prompt }],
    });

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Resposta inválida da API: " + data.slice(0, 200)));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-senha, x-api-key");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  // Verifica senha do admin
  const senhaRecebida = req.headers["x-admin-senha"];
  if (senhaRecebida !== process.env.ADMIN_SENHA) {
    return res.status(401).json({ error: "Senha de admin incorreta." });
  }

  // Pega API key do header (o admin envia a própria chave)
  const apiKey = req.headers["x-api-key"] || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: "API key Anthropic não fornecida." });
  }

  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const prompt = `Hoje é ${hoje}. Pesquise na web as NOVIDADES JURÍDICAS MAIS RECENTES E RELEVANTES do Brasil nas seguintes fontes:
- STF: novas súmulas, súmulas vinculantes, temas de repercussão geral julgados, decisões em plenário
- STJ: novas súmulas, recursos repetitivos, jurisprudência em teses
- Planalto: novas leis sancionadas, medidas provisórias, alterações em Códigos
- TST: novas súmulas, orientações jurisprudenciais

Retorne um JSON array com 8 a 15 novidades no formato:
[
  {
    "tipo": "Súmula STF" | "Súmula Vinculante" | "Tema Repercussão Geral" | "Nova Lei" | "Súmula STJ" | "Súmula TST" | "Alteração Legislativa",
    "fonte": "STF" | "STJ" | "TST" | "Planalto",
    "titulo": "título curto e descritivo",
    "descricao": "descrição técnica em 2-3 linhas",
    "impacto": "qual norma ou área do direito é afetada e qual o impacto prático",
    "data_aproximada": "mês/ano ou recente"
  }
]
Responda APENAS com o JSON array, sem texto antes ou depois, sem markdown.`;

  try {
    const data = await chamarClaude(apiKey, prompt);

    if (data.error) throw new Error(data.error.message);

    // Extrai texto da resposta
    let texto = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text || "")
      .join("");

    texto = texto.replace(/```json|```/g, "").trim();
    const match = texto.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("IA não retornou JSON válido.");

    const novidades = JSON.parse(match[0]);
    if (!Array.isArray(novidades) || novidades.length === 0) {
      throw new Error("Nenhuma novidade retornada.");
    }

    // Limpa novidades antigas e insere novas
    await supabase.from("novidades").delete().neq("id", 0);

    const rows = novidades.map((n) => ({
      tipo: n.tipo || "",
      fonte: n.fonte || "",
      titulo: n.titulo || "",
      descricao: n.descricao || "",
      impacto: n.impacto || "",
      data_aproximada: n.data_aproximada || "",
      criado_em: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase.from("novidades").insert(rows);
    if (insertError) throw insertError;

    // Atualiza metadado de última atualização
    const agora = new Date().toLocaleString("pt-BR");
    await supabase
      .from("meta")
      .upsert({ chave: "ultima_atualizacao", valor: agora });

    res.status(200).json({
      sucesso: true,
      total: novidades.length,
      atualizado_em: agora,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
