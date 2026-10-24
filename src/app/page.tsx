import { Suspense } from 'react';
import { getSession } from '@/lib/auth';
import { getJobDescriptions, isUsingCloudDatabase } from '@/lib/db';
import { AuthScreen } from '@/components/auth-screen';
import { Dashboard } from '@/components/dashboard';
import { Loader2 } from 'lucide-react';

async function AppContent() {
  const session = await getSession();

  if (!session) {
    return <AuthScreen />;
  }

  const [jobs, isCloud] = await Promise.all([
    getJobDescriptions(session.userId),
    isUsingCloudDatabase(),
  ]);

  return (
    <Dashboard
      initialJobs={jobs}
      currentUser={{ id: session.userId, username: session.username }}
      isCloudDb={isCloud}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Opening Job Description Store...</p>
        </div>
      }
    >
      <AppContent />
    </Suspense>
  );
}
