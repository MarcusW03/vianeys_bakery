import { getConfig } from '@/lib/config/reader';
import { auth } from '@/auth';
import PageSections from '@/components/PageSections';

export default async function HomePage() {
  const config = await getConfig();
  const session = await auth();
  const adminName = session?.user?.name ?? undefined;
  return <PageSections initialConfig={config} adminName={adminName} />;
}
