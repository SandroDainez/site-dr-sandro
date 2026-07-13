"use client";

import { useEffect, useState } from "react";
import type { AreaFiltro } from "@/lib/zonas";

// Guarda a ÁREA escolhida no navegador (localStorage) para ela ACOMPANHAR o usuário entre
// as zonas — "escolha sua especialidade uma vez, ela atravessa tudo". Inicia em "todos"
// (igual ao servidor, sem erro de hidratação) e, já no cliente, adota a última escolha.
const CHAVE = "medcampus_area";
const VALIDAS: AreaFiltro[] = ["todos", "emergencias", "ti", "anestesiologia"];

export function useAreaFiltro(): [AreaFiltro, (a: AreaFiltro) => void] {
  const [area, setAreaState] = useState<AreaFiltro>("todos");

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE) as AreaFiltro | null;
      // Leitura pós-hidratação (localStorage não existe no servidor) — uso legítimo de setState no effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (salvo && VALIDAS.includes(salvo)) setAreaState(salvo);
    } catch { /* localStorage indisponível — segue com "todos" */ }
  }, []);

  const setArea = (a: AreaFiltro) => {
    setAreaState(a);
    try { localStorage.setItem(CHAVE, a); } catch { /* ignora */ }
  };

  return [area, setArea];
}
