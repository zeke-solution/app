import { searchCreators } from "@/actions/creators";
import { DiscoverClient } from "@/components/creators/DiscoverClient";

export default async function BrandDiscoverPage() {
  const creators = await searchCreators({});
  return <DiscoverClient initialCreators={creators} />;
}
