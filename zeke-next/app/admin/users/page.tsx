import Link from "next/link";
import { getBrandsDirectory, getCreatorsDirectory } from "@/actions/admin";
import { UsersDirectoryTable } from "@/components/admin/UsersDirectoryTable";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const tab = type === "creators" ? "creators" : "brands";

  return (
    <div>
      <h2 className="text-xl font-black text-white">Users</h2>
      <p className="mb-4 mt-1 text-sm text-muted">All registered brands and creators on Zeke</p>
      <div className="mb-4 flex gap-2">
        <Link
          href="/admin/users?type=brands"
          className={`rounded-lg px-4 py-1.5 text-xs font-bold ${tab === "brands" ? "bg-accent text-white" : "border border-border text-muted"}`}
        >
          Brands
        </Link>
        <Link
          href="/admin/users?type=creators"
          className={`rounded-lg px-4 py-1.5 text-xs font-bold ${tab === "creators" ? "bg-accent text-white" : "border border-border text-muted"}`}
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
