// Helpers de YouTube compartilhados (link → id → embed/thumb). Aceita youtube.com/watch,
// youtu.be e youtube.com/embed. Retorna null se não for YouTube.
export function ytId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  return m ? m[1] : null;
}

export function ytEmbed(id: string): string {
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
}

export function ytThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
