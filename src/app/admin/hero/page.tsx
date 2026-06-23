import { getHero, getTypography } from "@/lib/content";
import AreaTypography from "@/components/admin/AreaTypography";
import HeroEditor from "./HeroEditor";
import Link from "next/link";

export default async function AdminHeroPage() {
  const hero = await getHero();
  const typo = await getTypography();

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Hero da Home</h1>
        <p className="mt-1 text-sm text-muted">
          Edite o badge, título e subtítulo da seção principal da home.
        </p>
      </div>

      <HeroEditor initialHero={hero} />

      <AreaTypography sectionKey="hero" label="Hero" initial={typo["hero"]} />
    </div>
  );
}
