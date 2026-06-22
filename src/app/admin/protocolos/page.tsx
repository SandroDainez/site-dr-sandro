import { getProtocolos } from "@/lib/content";
import ProtocolosEditor from "./ProtocolosEditor";

export default async function AdminProtocolosPage() {
  const protocolos = await getProtocolos();

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Protocolos clínicos</h1>
        <p className="mt-1 text-sm text-white/50">
          Gerencie os protocolos exibidos em{" "}
          <span className="font-mono text-white/70">/protocolos</span> e na home.
        </p>
      </div>

      <ProtocolosEditor initialProtocolos={protocolos} />
    </div>
  );
}
