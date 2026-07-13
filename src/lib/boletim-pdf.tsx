import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";

// Desliga a hifenização: palavras quebram só em espaços.
Font.registerHyphenationCallback((word) => [word]);

// Gerador de PDF de um boletim clínico semanal (medical_updates) — capa + resumo,
// tópicos com fonte, e lista de referências. Mesmo capricho do PDF dos protocolos.

const TEAL = "#0A5E6E";
const TEAL_DK = "#0b4552";
const GOLD = "#B7791F";
const INK = "#20232a";
const MUTE = "#6b7280";
const ESP_LABEL: Record<string, string> = { emergencias: "Emergências", terapia_intensiva: "Terapia Intensiva", ti: "Terapia Intensiva", anestesiologia: "Anestesiologia", geral: "Geral" };

type Topico = { titulo?: string; descricao?: string; relevancia_clinica?: string; fonte_tipo?: string; fonte_nome?: string; fonte_url?: string; pmid?: string };
type Fonte = { titulo?: string; journal?: string; url?: string; pmid?: string | null; ano?: number | null; origem?: string; tipo?: string | null };
export type BoletimPdf = {
  titulo?: string;
  especialidade?: string;
  semana_referencia?: string;
  data_publicacao?: string;
  resumo?: string;
  topicos?: Topico[];
  fontes?: Fonte[];
};

const s = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 42, paddingHorizontal: 40, fontSize: 10, fontFamily: "Helvetica", color: INK },
  cover: { flexDirection: "column", paddingTop: 64, paddingHorizontal: 48 },
  coverBrand: { fontSize: 13, fontFamily: "Helvetica-Bold", color: TEAL, letterSpacing: 2 },
  coverTag: { fontSize: 8.5, color: MUTE, marginTop: 2, letterSpacing: 1 },
  coverRule: { height: 2, backgroundColor: GOLD, width: 64, marginVertical: 22 },
  coverEyebrow: { fontSize: 9, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 },
  coverTitle: { fontSize: 26, fontFamily: "Helvetica-Bold", color: TEAL_DK, lineHeight: 1.15 },
  coverChip: { alignSelf: "flex-start", marginTop: 18, backgroundColor: "#e8f4f2", color: TEAL, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14, fontSize: 9, fontFamily: "Helvetica-Bold" },
  coverMeta: { marginTop: 30, fontSize: 9, color: MUTE, lineHeight: 1.5 },
  coverAviso: { marginTop: 20, fontSize: 8, color: "#92400e", lineHeight: 1.5 },
  runHead: { flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: MUTE, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", paddingBottom: 4, marginBottom: 12 },
  resumoBox: { backgroundColor: "#f0f7f6", borderLeftWidth: 3, borderLeftColor: TEAL, borderRadius: 5, padding: 11, marginBottom: 8 },
  resumoTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: TEAL, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  resumoText: { fontSize: 10, lineHeight: 1.5, color: "#2b2f36" },
  h2wrap: { flexDirection: "row", alignItems: "center", marginTop: 15, marginBottom: 7 },
  h2num: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#ffffff", backgroundColor: TEAL, borderRadius: 3, paddingVertical: 1.5, paddingHorizontal: 5, marginRight: 7 },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", color: TEAL_DK },
  topico: { marginBottom: 11 },
  topTitulo: { fontSize: 11, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 2.5 },
  topDesc: { fontSize: 10, lineHeight: 1.5, color: "#2b2f36", marginBottom: 2.5 },
  topRel: { fontSize: 9, lineHeight: 1.45, color: "#3f6d64", marginBottom: 2.5 },
  topFonte: { fontSize: 8, color: MUTE },
  novoTag: { fontSize: 8, fontFamily: "Helvetica-Bold", color: GOLD, marginBottom: 2 },
  refItem: { fontSize: 8.5, lineHeight: 1.45, color: "#3b3f46", marginBottom: 3, paddingLeft: 10 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 7, color: "#9aa0a6", textAlign: "center", borderTopWidth: 0.5, borderTopColor: "#e5e7eb", paddingTop: 5 },
});

function BoletimDoc({ b }: { b: BoletimPdf }) {
  const esp = ESP_LABEL[b.especialidade ?? ""] ?? b.especialidade ?? "";
  const titulo = b.titulo ?? "Boletim clínico";
  const topicos = (b.topicos ?? []).filter((t) => t.titulo || t.descricao);
  const fontes = (b.fontes ?? []).filter((f) => f.titulo || f.journal);
  const dataPub = b.data_publicacao ? b.data_publicacao.slice(0, 10) : "";
  return (
    <Document title={titulo} author="MedCampus">
      {/* CAPA */}
      <Page size="A4" style={s.page}>
        <View style={s.cover}>
          <Text style={s.coverBrand}>MEDCAMPUS</Text>
          <Text style={s.coverTag}>Boletim Clínico Semanal · Síntese de Evidência</Text>
          <View style={s.coverRule} />
          <Text style={s.coverEyebrow}>Atualização semanal · {esp}</Text>
          <Text style={s.coverTitle}>{titulo}</Text>
          <Text style={s.coverChip}>{esp}</Text>
          <Text style={s.coverMeta}>
            {b.semana_referencia ? `Semana de referência: ${b.semana_referencia}` : ""}
            {dataPub ? `${b.semana_referencia ? "\n" : ""}Publicado em ${dataPub}` : ""}
          </Text>
          <Text style={s.coverAviso}>Material educacional, gerado com apoio de IA a partir de fontes verificáveis (listadas ao final). Não substitui o julgamento clínico individualizado — a palavra final é sempre do profissional responsável.</Text>
        </View>
      </Page>

      {/* CONTEÚDO */}
      <Page size="A4" style={s.page}>
        <View style={s.runHead} fixed>
          <Text>MedCampus · {esp}</Text>
          <Text>{b.semana_referencia || dataPub}</Text>
        </View>

        {b.resumo ? (
          <View style={s.resumoBox}>
            <Text style={s.resumoTitle}>Resumo da semana</Text>
            <Text style={s.resumoText}>{b.resumo}</Text>
          </View>
        ) : null}

        <View style={s.h2wrap} wrap={false}>
          <Text style={s.h2num}>1</Text>
          <Text style={s.h2}>Destaques</Text>
        </View>

        {topicos.map((t, i) => {
          const novo = t.fonte_tipo ? `★ Novo ${t.fonte_tipo}${t.fonte_nome ? ` — ${t.fonte_nome}` : ""}` : "";
          const fonteLinha = [t.fonte_nome, t.pmid ? `PMID ${t.pmid}` : "", t.fonte_url].filter(Boolean).join("  ·  ");
          return (
            <View key={i} style={s.topico} wrap={false}>
              {novo ? <Text style={s.novoTag}>{novo}</Text> : null}
              {t.titulo ? <Text style={s.topTitulo}>{t.titulo}</Text> : null}
              {t.descricao ? <Text style={s.topDesc}>{t.descricao}</Text> : null}
              {t.relevancia_clinica ? <Text style={s.topRel}>Relevância clínica: {t.relevancia_clinica}</Text> : null}
              {fonteLinha ? <Text style={s.topFonte}>Fonte: {fonteLinha}</Text> : null}
            </View>
          );
        })}

        {fontes.length > 0 && (
          <>
            <View style={s.h2wrap} wrap={false}>
              <Text style={s.h2num}>2</Text>
              <Text style={s.h2}>Referências</Text>
            </View>
            {fontes.map((f, i) => {
              const partes = [f.titulo, f.journal, f.ano ? String(f.ano) : "", f.pmid ? `PMID ${f.pmid}` : "", f.url].filter(Boolean).join(". ");
              return <Text key={i} style={s.refItem}>{i + 1}. {partes}</Text>;
            })}
          </>
        )}

        <Text style={s.footer} fixed render={({ pageNumber, totalPages }) => `MedCampus — ${esp} · ${b.semana_referencia || dataPub}   ·   pág. ${pageNumber}/${totalPages}`} />
      </Page>
    </Document>
  );
}

export async function renderBoletimPdf(b: BoletimPdf): Promise<Buffer> {
  return renderToBuffer(<BoletimDoc b={b} />);
}
