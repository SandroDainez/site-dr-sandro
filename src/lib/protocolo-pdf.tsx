import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { ProtocoloPublico, ProtocoloConteudo } from "./protocolos-editora";

// Gerador de PDF do protocolo da Editora (seções → documento limpo e profissional).
// Não é o visual rico do template de referência ainda — é um PDF sólido e legível.

const TEAL = "#0A5E6E";
const ESP_LABEL: Record<string, string> = { emergencias: "Emergências", ti: "Terapia Intensiva", anestesiologia: "Anestesiologia", geral: "Geral" };

// Seções que viram CAIXA de destaque (segurança/erros/armadilhas).
const CALLOUT = new Set(["Segurança do paciente", "Erros frequentes", "Armadilhas e pérolas clínicas"]);

const s = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 40, paddingHorizontal: 36, fontSize: 10, fontFamily: "Helvetica", color: "#20232a" },
  headerBand: { backgroundColor: TEAL, borderRadius: 6, padding: 14, marginBottom: 12 },
  eyebrow: { color: "#bfeee9", fontSize: 8, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  title: { color: "#ffffff", fontSize: 18, fontFamily: "Helvetica-Bold" },
  meta: { color: "#dff5f2", fontSize: 8, marginTop: 4 },
  aviso: { backgroundColor: "#fff7ed", borderLeftWidth: 3, borderLeftColor: "#d97706", padding: 8, borderRadius: 4, marginBottom: 14, fontSize: 8, color: "#92400e" },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", color: TEAL, marginTop: 12, marginBottom: 4, paddingBottom: 3, borderBottomWidth: 0.7, borderBottomColor: "#d5e6e4" },
  p: { fontSize: 10, lineHeight: 1.45, marginBottom: 3, color: "#2b2f36" },
  callout: { backgroundColor: "#fef2f2", borderLeftWidth: 3, borderLeftColor: "#dc2626", borderRadius: 4, padding: 9, marginTop: 12, marginBottom: 2 },
  calloutTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#b91c1c", marginBottom: 4 },
  calloutP: { fontSize: 9.5, lineHeight: 1.45, marginBottom: 3, color: "#3b1f1f" },
  footer: { position: "absolute", bottom: 18, left: 36, right: 36, fontSize: 7, color: "#9aa0a6", textAlign: "center", borderTopWidth: 0.5, borderTopColor: "#e5e7eb", paddingTop: 4 },
});

function textoSecao(secao: string, c: ProtocoloConteudo): string {
  if (c.textoEditado?.[secao]) return c.textoEditado[secao];
  const sec = c.secoes?.find((x) => x.secao === secao);
  return sec ? sec.afirmacoes.map((a) => a.texto).join("\n") : "";
}

function ProtocoloDoc({ p }: { p: ProtocoloPublico }) {
  const secoes = (p.conteudo.secoes ?? []).map((x) => x.secao).filter((nome) => nome !== "Título");
  return (
    <Document title={p.title} author="MedCampus">
      <Page size="A4" style={s.page}>
        <View style={s.headerBand}>
          <Text style={s.eyebrow}>Protocolo institucional · {ESP_LABEL[p.specialty] ?? p.specialty}</Text>
          <Text style={s.title}>{p.title}</Text>
          {p.publicado_em ? <Text style={s.meta}>Publicado em {p.publicado_em.slice(0, 10)}</Text> : null}
        </View>
        <Text style={s.aviso}>Material educacional. Não substitui o julgamento clínico individualizado. A palavra final é sempre do profissional responsável.</Text>

        {secoes.map((nome, i) => {
          const txt = textoSecao(nome, p.conteudo).trim();
          if (!txt) return null;
          const paras = txt.split("\n").map((t) => t.trim()).filter(Boolean);
          if (CALLOUT.has(nome)) {
            return (
              <View key={i} style={s.callout} wrap={false}>
                <Text style={s.calloutTitle}>{nome}</Text>
                {paras.map((t, j) => <Text key={j} style={s.calloutP}>• {t}</Text>)}
              </View>
            );
          }
          return (
            <View key={i} wrap={false}>
              <Text style={s.h2}>{nome}</Text>
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
