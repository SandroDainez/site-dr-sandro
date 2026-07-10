import { getProtocoloPublicado } from "@/lib/protocolos-editora";
import { renderProtocoloPdf } from "@/lib/protocolo-pdf";

// PDF gerado na hora a partir do protocolo publicado (sempre igual ao conteúdo no ar).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProtocoloPublicado(slug);
  if (!p) return new Response("Protocolo não encontrado", { status: 404 });
  // ?dl=1 força o navegador a SALVAR o arquivo em vez de exibir/navegar para ele — usado pelo
  // botão "Baixar PDF" (target="_blank" + inline teria virado uma aba nova sem "voltar").
  const forcarDownload = new URL(req.url).searchParams.get("dl") === "1";
  try {
    const buf = await renderProtocoloPdf(p);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${forcarDownload ? "attachment" : "inline"}; filename="${slug}.pdf"`,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (e) {
    return new Response("Falha ao gerar o PDF: " + (e instanceof Error ? e.message : String(e)), { status: 500 });
  }
}
