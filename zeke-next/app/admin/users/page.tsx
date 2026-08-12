import Link from "next/link";
import { getBrandsDirectory, getCreatorsDirectory } from "@/actions/admin";
import { UsersDirectoryTable } from "@/components/admin/UsersDirectoryTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const tab = type === "creators" ? "creators" : "brands";

  return (
    <div>
      <PageHeader
        eyebrow="Directory"
        title="Users"
        description="Browse registered brands and creators and open their operational records."
        actions={<Link href="/admin/system" className="rounded-lg bg-card px-3 py-2 text-sm font-semibold text-accent">Auth accounts and access</Link>}
      />
      <div className="mb-5 flex gap-1 rounded-lg border border-border bg-card p-1">
        <Link
          href="/admin/users?type=brands"
          className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === "brands" ? "bg-accent text-white" : "text-muted hover:bg-dark"}`}
        >
          Brands
        </Link>
        <Link
          href="/admin/users?type=creators"
          className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === "creators" ? "bg-accent text-white" : "text-muted hover:bg-dark"}`}
        >
          Creators
        </Link>
      </div>
      {tab === "brands" ? <BrandsList /> : <CreatorsList />}
    </div>
  );
}

async function BrandsList() {
  const brands = await getBrandsDirectory();
  return <UsersDirectoryTable kind="brands" brands={brands} />;
}

async function CreatorsList() {
  const creators = await getCreatorsDirectory();
  return <UsersDirectoryTable kind="creators" creators={creators} />;
}
