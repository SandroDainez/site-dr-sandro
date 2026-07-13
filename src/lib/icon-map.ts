import {
  Layers, CalendarClock, FileText, Zap, HeartPulse, BookOpen, AudioLines,
  BrainCircuit, ShieldCheck, Sparkles, GraduationCap, Microscope,
  Wallet, PiggyBank, ListChecks, type LucideIcon,
} from "lucide-react";

// Mapa de ícones dos apps (a string `icon` do app → componente lucide). Compartilhado
// entre a home e as zonas para que o logo/ícone dos apps seja idêntico em todo lugar.
export const iconMap: Record<string, LucideIcon> = {
  Layers, CalendarClock, FileText, Zap, HeartPulse, BookOpen, AudioLines,
  BrainCircuit, ShieldCheck, Sparkles, GraduationCap, Microscope,
  Wallet, PiggyBank, ListChecks,
};
