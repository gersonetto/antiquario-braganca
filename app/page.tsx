import { fetchCatalog } from '@/lib/catalog/fetchCatalog';
import { CatalogExplorer } from '@/components/CatalogExplorer';

export const revalidate = 300; // 5 minutos, ver spec §4

export default async function HomePage() {
  const items = await fetchCatalog();
  return <CatalogExplorer items={items} />;
}
