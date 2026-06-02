"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import type { ContatoData } from "@/lib/content";
import { saveContato } from "@/app/admin/actions";

type Props = {
  initialContato: ContatoData;
};

export default function ContatoEditor({ initialContato }: Props) {
  const [contato, setContato] = useState<ContatoData>(initialContato);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function update(field: keyof ContatoData, value: string) {
    setContato((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await saveContato(contato);
      setSaved(true);
    });
  }

  const fields: Array<{ key: keyof ContatoData; label: string; placeholder: string; type?: string }> = [
    { key: "email", label: "E-mail", placeholder: "contato@drsandro.com.br", type: "email" },
    { key: "whatsapp", label: "WhatsApp (exibido)", placeholder: "+55 (11) 99999-9999" },
    { key: "whatsappLink", label: "WhatsApp (link)", placeholder: "https://wa.me/5511999999999" },
    { key: "telefone", label: "Telefone (exibido)", placeholder: "+55 (11) 4000-0000" },
    { key: "telefoneLink", label: "Telefone (link)", placeholder: "tel:+551140000000" },
    { key: "instagram", label: "Instagram / Outros (exibido)", placeholder: "Instagram e Telegram" },
    { key: "instagramLink", label: "Instagram / Outros (link)", placeholder: "https://instagram.com/" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        {fields.map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
              {label}
            </label>
            <input
              type={type ?? "text"}
              placeholder={placeholder}
              value={contato[key]}
              onChange={(e) => update(key, e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-violet/50"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar contato"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
      </div>
    </div>
  );
}
