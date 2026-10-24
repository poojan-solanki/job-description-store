'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { DeleteDialog } from '@/components/delete-dialog';
import { JobDescription } from '@/lib/types';
import { deleteJobAction } from '@/app/actions/jobs';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Copy,
  Check,
  Pencil,
  Trash2,
  Building,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
} from 'lucide-react';

interface JdReaderProps {
  job: JobDescription;
}

export function JdReader({ job }: JdReaderProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(job.description);
      setCopied(true);
      toast.success(`Copied JD for ${job.company_name} to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard.');
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteJobAction(job.id);
      if (res.success) {
        toast.success(`Deleted JD for ${job.company_name}`);
        setDeleteOpen(false);
        router.replace('/');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete job description');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Applied':
        return <Badge className="text-sm px-3 py-1 bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30">Applied</Badge>;
      case 'Interviewing':
        return <Badge className="text-sm px-3 py-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">Interviewing</Badge>;
      case 'Offer':
        return <Badge className="text-sm px-3 py-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Offer</Badge>;
      case 'Rejected':
        return <Badge variant="secondary" className="text-sm px-3 py-1">Archived</Badge>;
      default:
        return <Badge variant="outline" className="text-sm px-3 py-1 font-medium">Saved</Badge>;
    }
  };

  const formattedDate = new Date(job.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      {/* Sticky Action Bar */}
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2 sm:px-3 rounded-lg hover:bg-muted shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="inline sm:hidden">Home</span>
            </Link>

            <span className="text-muted-foreground/40 font-mono text-xs sm:text-base shrink-0">/</span>

            <span className="text-xs sm:text-sm font-bold truncate max-w-[100px] xs:max-w-[160px] sm:max-w-xs md:max-w-md font-heading" title={job.company_name}>
              {job.company_name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <ThemeToggle className="h-8 w-8 sm:h-9 sm:w-9" />

            {/* 1-Click Copy Button */}
            <Button
              onClick={handleCopy}
              size="sm"
              className="gap-1.5 sm:gap-2 h-9 sm:h-10 px-2.5 sm:px-5 text-xs sm:text-sm font-semibold shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>

            {/* Edit Button */}
            <Link href={`/edit/${job.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5 h-9 sm:h-10 text-xs sm:text-sm font-medium px-2.5 sm:px-4">
                <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </Link>

            {/* Delete Button (opens DeleteDialog) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              disabled={deleting}
              className="h-9 w-9 sm:h-10 sm:w-10 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Delete this JD"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Document Reader */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        {/* Document Header */}
        <div className="space-y-5 border-b border-border/80 pb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <div className="flex items-start sm:items-center gap-3.5 flex-wrap">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20 shrink-0 mt-0.5 sm:mt-0">
                  {job.company_name.charAt(0).toUpperCase()}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading break-words">
                  {job.company_name}
                </h1>
                <div className="shrink-0">{getStatusBadge(job.status)}</div>
              </div>

              {job.role_title && (
                <div className="text-xl sm:text-2xl font-semibold text-foreground/85 flex items-center gap-2.5 pt-1">
                  <Briefcase className="w-5 h-5 text-muted-foreground" />
                  <span>{job.role_title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Chips */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground pt-1">
            {job.location && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 text-foreground/90 font-medium">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {job.location}
              </span>
            )}
            {job.salary_range && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 text-foreground/90 font-medium">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                {job.salary_range}
              </span>
            )}
            {job.job_type && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 text-foreground/90 font-medium">
                {job.job_type}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 ml-auto text-xs sm:text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Saved on {formattedDate}
            </span>
          </div>
        </div>

        {/* Full Job Description Body */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-heading">
              Job Description
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-xs sm:text-sm gap-2 h-8 text-muted-foreground hover:text-foreground font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Quick Copy'}</span>
            </Button>
          </div>

          <article className="p-8 sm:p-10 rounded-2xl border border-border/80 bg-card/70 shadow-xs leading-relaxed text-base sm:text-lg whitespace-pre-wrap font-sans text-foreground/95 selection:bg-primary/20">
            {job.description}
          </article>
        </div>

        {/* Personal Notes (if present) */}
        {job.notes && (
          <div className="p-5 sm:p-6 rounded-2xl border border-amber-500/25 bg-amber-500/10 text-sm text-amber-950 dark:text-amber-200 space-y-1.5">
            <div className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-300 font-heading">
              Personal Notes & Contacts
            </div>
            <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{job.notes}</p>
          </div>
        )}
      </main>

      {/* Bulletproof Delete Dialog */}
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        companyName={job.company_name}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </div>
  );
}
