import { redirect } from "next/navigation";

// A antiga página "Todo o conteúdo" foi removida (o próprio início já reúne tudo).
// Mantemos este redirecionamento para que links/abas/favoritos antigos de
// /conteudo abram o início normalmente, em vez de cair num 404.
export default function ConteudoRedirect() {
  redirect("/");
}
