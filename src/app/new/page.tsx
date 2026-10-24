import { Suspense } from 'react';
import { getSession } from '@/lib/auth';
import { AuthScreen } from '@/components/auth-screen';
import { JdEditor } from '@/components/jd-editor';
import { Loader2 } from 'lucide-react';

async function NewJobContent({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    return <AuthScreen />;
  }

  const resolvedParams = await searchParams;
  const company = resolvedParams?.company || '';

  return <JdEditor defaultCompany={company} />;
}

export default function NewJobPage(props: {
  searchParams: Promise<{ company?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NewJobContent searchParams={props.searchParams} />
    </Suspense>
  );
}
