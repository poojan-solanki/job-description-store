import { Suspense } from 'react';
import { getSession } from '@/lib/auth';
import { getJobDescriptionById } from '@/lib/db';
import { AuthScreen } from '@/components/auth-screen';
import { JdEditor } from '@/components/jd-editor';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';

async function EditJobContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    return <AuthScreen />;
  }

  const { id } = await params;
  const job = await getJobDescriptionById(id, session.userId);

  if (!job) {
    notFound();
  }

  return <JdEditor key={job.id} initialJob={job} />;
}

export default function EditJobPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <EditJobContent params={props.params} />
    </Suspense>
  );
}
