import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { ProtocoloPublico, ProtocoloConteudo } from "./protocolos-editora";

// Gerador de PDF do protocolo da Editora — capa + documento estilizado (paleta do template
// de referência). Não é 1:1 com o HTML visual rico, mas é caprichado e profissional.

const TEAL = "#0A5E6E";
const TEAL_DK = "#0b4552";
const GOLD = "#B7791F";
const RED = "#C0392B";
const INK = "#20232a";
const MUTE = "#6b7280";
const ESP_LABEL: Record<string, string> = { emergencias: "Emergências", ti: "Terapia Intensiva", anestesiologia: "Anestesiologia", geral: "Geral" };

// Seções que viram CAIXA de destaque, por tom.
const CALLOUT_CRIT = new Set(["Segurança do paciente", "Erros frequentes"]);
const CALLOUT_GOLD = new Set(["Armadilhas e pérolas clínicas", "Resumo executivo"]);

const s = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 42, paddingHorizontal: 40, fontSize: 10, fontFamily: "Helvetica", color: INK },
  // Capa
  cover: { flexDirection: "column", justifyContent: "center", height: "100%", paddingHorizontal: 54 },
  coverBrand: { fontSize: 13, fontFamily: "Helvetica-Bold", color: TEAL, letterSpacing: 2 },
  coverTag: { fontSize: 8.5, color: MUTE, marginTop: 2, letterSpacing: 1 },
  coverRule: { height: 2, backgroundColor: GOLD, width: 64, marginVertical: 22 },
  coverEyebrow: { fontSize: 9, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 },
  coverTitle: { fontSize: 30, fontFamily: "Helvetica-Bold", color: TEAL_DK, lineHeight: 1.1 },
  coverChip: { alignSelf: "flex-start", marginTop: 18, backgroundColor: "#e8f4f2", color: TEAL, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14, fontSize: 9, fontFamily: "Helvetica-Bold" },
  coverMeta: { marginTop: 34, fontSize: 9, color: MUTE, lineHeight: 1.5 },
  coverAviso: { marginTop: 22, fontSize: 8, color: "#92400e", lineHeight: 1.5 },
  // Conteúdo
  runHead: { flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: MUTE, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", paddingBottom: 4, marginBottom: 12 },
  h2wrap: { flexDirection: "row", alignItems: "center", marginTop: 13, marginBottom: 5 },
  h2num: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#ffffff", backgroundColor: TEAL, borderRadius: 3, paddingVertical: 1.5, paddingHorizontal: 5, marginRight: 7 },
  h2: { fontSize: 12.5, fontFamily: "Helvetica-Bold", color: TEAL_DK },
  p: { fontSize: 10, lineHeight: 1.5, marginBottom: 3.5, color: "#2b2f36" },
  li: { fontSize: 10, lineHeight: 1.5, marginBottom: 3.5, color: "#2b2f36", paddingLeft: 10 },
  callout: { borderRadius: 5, padding: 11, marginTop: 13, marginBottom: 3, borderLeftWidth: 3 },
  calloutTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 5 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 7, color: "#9aa0a6", textAlign: "center", borderTopWidth: 0.5, borderTopColor: "#e5e7eb", paddingTop: 5 },
});

function textoSecao(secao: string, c: ProtocoloConteudo): string {
  if (c.textoEditado?.[secao]) return c.textoEditado[secao];
  const sec = c.secoes?.find((x) => x.secao === secao);
  return sec ? sec.afirmacoes.map((a) => a.texto).join("\n") : "";
}

function ProtocoloDoc({ p }: { p: ProtocoloPublico }) {
  const esp = ESP_LABEL[p.specialty] ?? p.specialty;
  const nomes = (p.conteudo.secoes ?? []).map((x) => x.secao).filter((n) => n !== "Título" && n !== "Controle do documento");
  // Numeração das seções normais (callouts não entram na contagem) — precomputada.
  const numeros: Record<string, number> = {};
  nomes.reduce((acc, nome) => {
    const temTexto = textoSecao(nome, p.conteudo).trim().length > 0;
    const ehCallout = CALLOUT_CRIT.has(nome) || CALLOUT_GOLD.has(nome);
    if (temTexto && !ehCallout) { numeros[nome] = acc + 1; return acc + 1; }
    return acc;
  }, 0);
  return (
    <Document title={p.title} author="MedCampus">
      {/* CAPA */}
      <Page size="A4" style={s.page}>
        <View style={s.cover}>
          <Text style={s.coverBrand}>MEDCAMPUS</Text>
          <Text style={s.coverTag}>Protocolos Médicos · Apoio à Prática Clínica</Text>
          <View style={s.coverRule} />
          <Text style={s.coverEyebrow}>Protocolo institucional · {esp}</Text>
          <Text style={s.coverTitle}>{p.title}</Text>
          <Text style={s.coverChip}>{esp}</Text>
          <Text style={s.coverMeta}>
            Documento de apoio à decisão clínica{p.publicado_em ? `\nPublicado em ${p.publicado_em.slice(0, 10)}` : ""}
          </Text>
          <Text style={s.coverAviso}>Material educacional. Não substitui o julgamento clínico individualizado — a palavra final é sempre do profissional responsável.</Text>
        </View>
      </Page>

      {/* CONTEÚDO */}
      <Page size="A4" style={s.page}>
        <View style={s.runHead} fixed>
          <Text>MedCampus · {esp}</Text>
          <Text>{p.title}</Text>
        </View>

        {nomes.map((nome, i) => {
          const txt = textoSecao(nome, p.conteudo).trim();
          if (!txt) return null;
          const paras = txt.split("\n").map((t) => t.trim()).filter(Boolean);
          if (CALLOUT_CRIT.has(nome) || CALLOUT_GOLD.has(nome)) {
            const crit = CALLOUT_CRIT.has(nome);
            const cor = crit ? RED : GOLD;
            const bg = crit ? "#fdf2f2" : "#fdf8ee";
            return (
              <View key={i} style={[s.callout, { borderLeftColor: cor, backgroundColor: bg }]} wrap={false}>
                <Text style={[s.calloutTitle, { color: cor }]}>{nome}</Text>
                {paras.map((t, j) => <Text key={j} style={[s.li, { color: "#3b2f2f" }]}>• {t}</Text>)}
              </View>
            );
          }
          return (
            <View key={i} wrap={false}>
              <View style={s.h2wrap}>
                <Text style={s.h2num}>{numeros[nome]}</Text>
                <Text style={s.h2}>{nome}</Text>
              </View>
              {paras.map((t, j) => <Text key={j} style={s.p}>{t}</Text>)}
            </View>
          );
        })}

        <Text style={s.footer} fixed render={({ pageNumber, totalPages }) => `MedCampus — ${p.title}   ·   pág. ${pageNumber}/${totalPages}`} />
      </Page>
    </Document>
  );
}

export async function renderProtocoloPdf(p: ProtocoloPublico): Promise<Buffer> {
  return renderToBuffer(<ProtocoloDoc p={p} />);
}
