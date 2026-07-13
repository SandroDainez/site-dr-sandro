import { fetchMedicalUpdateById } from "@/lib/supabase/server";
import { renderBoletimPdf, type BoletimPdf } from "@/lib/boletim-pdf";

// PDF gerado na hora a partir do boletim semanal publicado (medical_updates).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function slug(s: string): string {
  return (s || "boletim").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await fetchMedicalUpdateById(id);
  if (!b) return new Response("Boletim não encontrado", { status: 404 });
  // ?dl=1 força SALVAR o arquivo (botão "Baixar PDF"); sem isso, abre no navegador (imprimir).
  const forcarDownload = new URL(req.url).searchParams.get("dl") === "1";
  const nome = slug([String(b.especialidade ?? ""), String(b.semana_referencia ?? "")].filter(Boolean).join("-")) || "boletim";
  try {
    const buf = await renderBoletimPdf(b as BoletimPdf);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${forcarDownload ? "attachment" : "inline"}; filename="${nome}.pdf"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    return new Response("Falha ao gerar o PDF: " + (e instanceof Error ? e.message : String(e)), { status: 500 });
  }
}
