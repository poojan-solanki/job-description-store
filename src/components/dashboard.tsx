'use client';

import { useState, useMemo, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { JobDescription, ApplicationStatus } from '@/lib/types';
import { logoutAction } from '@/app/actions/auth';
import { deleteJobAction, getJobsAction, updateJobStatusAction } from '@/app/actions/jobs';
import { ThemeToggle } from '@/components/theme-toggle';
import { DeleteDialog } from '@/components/delete-dialog';
import { DeleteAccountDialog } from '@/components/delete-account-dialog';
import { DataBackupDialog } from '@/components/data-backup-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Building,
  Briefcase,
  MapPin,
  IndianRupee,
  Copy,
  Check,
  Eye,
  LogOut,
  Pencil,
  Trash2,
  User as UserIcon,
  UserX,
  Sparkles,
  ChevronDown,
  ArrowUpDown,
  Upload,
} from 'lucide-react';

interface DashboardProps {
  initialJobs: JobDescription[];
  currentUser: {
    id: string;
    username: string;
  };
  isCloudDb: boolean;
}

export function Dashboard({ initialJobs, currentUser, isCloudDb }: DashboardProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<JobDescription[]>(initialJobs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete modal state
  const [jobToDelete, setJobToDelete] = useState<{ id: string; companyName: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);

  // Keyboard shortcut: Press '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keep jobs state synchronized whenever initialJobs prop changes
  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  const syncJobs = async () => {
    try {
      const res = await getJobsAction();
      if (res.success && res.jobs) {
        setJobs(res.jobs);
      }
    } catch (err) {
      console.error('Failed to sync latest jobs:', err);
    }
  };

  // Immediately refresh and synchronize fresh jobs from DB on mount and window focus
  useEffect(() => {
    router.refresh();
    syncJobs();
    window.addEventListener('focus', syncJobs);
    return () => {
      window.removeEventListener('focus', syncJobs);
    };
  }, [router]);

  // Real-time filtering by Company Name, Role, or Description
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        job.company_name.toLowerCase().includes(query) ||
        (job.role_title && job.role_title.toLowerCase().includes(query)) ||
        job.description.toLowerCase().includes(query);

      const matchesStatus =
        selectedStatus === 'All' || job.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = jobs.length;
    const applied = jobs.filter((j) => j.status === 'Applied').length;
    const interviewing = jobs.filter((j) => j.status === 'Interviewing').length;
    const offers = jobs.filter((j) => j.status === 'Offer').length;
    return { total, applied, interviewing, offers };
  }, [jobs]);

  const handleLogout = async () => {
    try {
      await logoutAction();
      toast.success('Logged out successfully');
      router.refresh();
    } catch {
      toast.error('Failed to log out');
    }
  };

  const handleCopyJd = async (e: React.MouseEvent, job: JobDescription) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(job.description);
      setCopiedId(job.id);
      toast.success(`Copied JD for ${job.company_name}!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy to clipboard.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteJobAction(jobToDelete.id);
      if (res.success) {
        setJobs((prev) => prev.filter((j) => j.id !== jobToDelete.id));
        toast.success(`Deleted JD for ${jobToDelete.companyName}`);
        setJobToDelete(null);
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

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
    jobId: string,
    newStatus: ApplicationStatus
  ) => {
    e.stopPropagation();
    const prevJobs = [...jobs];
    // Optimistic update so UI and stats reflect immediately
    setJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, status: newStatus } : job))
    );

    try {
      const res = await updateJobStatusAction(jobId, newStatus);
      if (res.success) {
        toast.success(`Status updated to "${newStatus}"`);
        router.refresh();
      } else {
        setJobs(prevJobs);
        toast.error(res.error || 'Failed to update status.');
      }
    } catch {
      setJobs(prevJobs);
      toast.error('Failed to update status.');
    }
  };

  const getStatusBadgeStyle = (status: ApplicationStatus) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/25';
      case 'Interviewing':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25';
      case 'Offer':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25';
      case 'Rejected':
        return 'bg-muted text-muted-foreground border-border hover:bg-muted/80';
      default:
        return 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      {/* Top Navbar */}
      <header className="border-b border-border/80 sticky top-0 z-20 backdrop-blur-md bg-background/90">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs shrink-0">
              <Building className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm sm:text-lg tracking-tight font-heading truncate block">
                <span className="hidden min-[420px]:inline">Job Description Store</span>
                <span className="min-[420px]:hidden">JD Store</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {/* Dark/Light Theme Toggle */}
            <ThemeToggle className="h-8 w-8 sm:h-9 sm:w-9" />

            {/* User Profile & Actions */}
            <div className="flex items-center gap-1 pl-1 sm:pl-3 border-l border-border">
              <div
                className="flex items-center gap-1 text-xs sm:text-sm font-medium bg-muted/60 px-1.5 sm:px-3 py-1.5 rounded-lg max-w-[65px] min-[360px]:max-w-[95px] sm:max-w-[140px]"
                title={currentUser.username}
              >
                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{currentUser.username}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-2.5 sm:gap-1.5 shrink-0"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteAccountOpen(true)}
                className="text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 px-2 gap-1.5 hidden md:inline-flex"
                title="Delete Account"
              >
                <UserX className="w-4 h-4" />
                <span className="hidden md:inline text-xs font-medium">Delete Account</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-7">
        {/* Search Hero & Add Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Company Find Search Input */}
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Find company JD (e.g. Google, Stripe)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 sm:pl-12 pr-10 sm:pr-24 h-12 sm:h-13 text-sm sm:text-base shadow-xs bg-card border-border/80 rounded-2xl"
            />
            <div className="absolute right-3.5 top-3.5 flex items-center gap-2 pointer-events-none">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="pointer-events-auto text-xs text-muted-foreground hover:text-foreground bg-muted px-2 py-1 rounded-md"
                >
                  Clear
                </button>
              ) : (
                <kbd className="hidden sm:inline-block text-xs text-muted-foreground border border-border bg-muted/60 px-2 py-0.5 rounded-md font-mono">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Action Buttons: Import/Export & Add Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBackupOpen(true)}
              className="gap-2 h-12 sm:h-13 px-3.5 sm:px-4 rounded-2xl border-border/80 text-xs sm:text-sm font-semibold hover:bg-muted"
              title="Import or Export your job descriptions"
            >
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <span className="hidden min-[480px]:inline">Import / Export</span>
              <span className="min-[480px]:hidden">Backup</span>
            </Button>

            <Link href="/new" className="flex-1 sm:flex-initial">
              <Button className="gap-2 sm:gap-2.5 h-12 sm:h-13 px-4 sm:px-6 rounded-2xl shadow-xs shrink-0 w-full text-xs sm:text-sm font-semibold">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Add Job Description</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Pills & Stats Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm border-y border-border/70 py-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Saved', 'Applied', 'Interviewing', 'Offer'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === st
                    ? 'bg-foreground text-background shadow-xs'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 sm:gap-4 text-muted-foreground font-medium text-xs sm:text-sm">
            <span>Total: <strong className="text-foreground">{stats.total}</strong></span>
            <span className="text-muted-foreground/40">·</span>
            <span>Applied: <strong className="text-foreground">{stats.applied}</strong></span>
            <span className="text-muted-foreground/40">·</span>
            <span>Interviewing: <strong className="text-foreground">{stats.interviewing}</strong></span>
            <span className="text-muted-foreground/40">·</span>
            <span>Offers: <strong className="text-foreground">{stats.offers}</strong></span>
          </div>
        </div>

        {/* Search Results Summary */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between bg-muted/40 border border-border/80 px-4 py-3 rounded-xl text-sm text-foreground">
            <span>
              Found <strong>{filteredJobs.length}</strong> result{filteredJobs.length === 1 ? '' : 's'} for &ldquo;<strong>{searchQuery}</strong>&rdquo;
            </span>
            <Link href={`/new?company=${encodeURIComponent(searchQuery)}`}>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 font-medium">
                <Plus className="w-3.5 h-3.5" />
                Add JD for &ldquo;{searchQuery}&rdquo;
              </Button>
            </Link>
          </div>
        )}

        {/* Jobs Grid or Empty State */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-20 px-4 border border-dashed border-border rounded-2xl bg-card/30">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Building className="w-6 h-6" />
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-base font-bold font-heading">No Job Description found for &ldquo;{searchQuery}&rdquo;</h3>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
                  Save this company&apos;s JD now so you can search and reference it anytime.
                </p>
                <Link href={`/new?company=${encodeURIComponent(searchQuery)}`}>
                  <Button size="sm" className="mt-4 gap-1.5 text-xs h-9 px-4 font-semibold">
                    <Plus className="w-4 h-4" />
                    Add JD for {searchQuery}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold font-heading">Your Store is Empty</h3>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
                  Add your first company name and job description to begin building your store.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                  <Link href="/new">
                    <Button size="sm" className="gap-1.5 text-xs h-9 px-4 font-semibold">
                      <Plus className="w-4 h-4" />
                      Add First Job Description
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBackupOpen(true)}
                    className="gap-1.5 text-xs h-9 px-3.5 font-medium"
                  >
                    <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                    Import Backup
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.map((job) => {
              const isCopied = copiedId === job.id;
              return (
                <div
                  key={job.id}
                  onClick={(e) => {
                    // Navigate only if the click was not on a button, link, or select
                    if (!(e.target as HTMLElement).closest('button, a, select')) {
                      router.push(`/job/${job.id}`);
                    }
                  }}
                  className="cursor-pointer group focus-visible:outline-none"
                >
                  <Card className="h-full flex flex-col justify-between hover:border-foreground/40 hover:shadow-md transition-all duration-150 border-border/80 bg-card/70 rounded-2xl">
                    <CardHeader className="pb-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20 mt-0.5">
                            {job.company_name.charAt(0).toUpperCase()}
                          </div>
                          <CardTitle className="text-lg font-bold break-words group-hover:text-primary transition-colors font-heading leading-snug">
                            {job.company_name}
                          </CardTitle>
                        </div>
                        <div
                          className="shrink-0 pt-0.5 relative group/status"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            className={`relative inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs ${getStatusBadgeStyle(
                              job.status
                            )}`}
                          >
                            <span>{job.status === 'Rejected' ? 'Archived' : job.status}</span>
                            <ChevronDown className="w-3 h-3 opacity-60 group-hover/status:opacity-100 transition-opacity" />
                            <select
                              value={job.status}
                              onChange={(e) => handleStatusChange(e, job.id, e.target.value as ApplicationStatus)}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                              title="Change application status"
                            >
                              <option value="Applied" className="bg-popover text-popover-foreground">Applied</option>
                              <option value="Saved" className="bg-popover text-popover-foreground">Saved</option>
                              <option value="Interviewing" className="bg-popover text-popover-foreground">Interviewing</option>
                              <option value="Offer" className="bg-popover text-popover-foreground">Offer</option>
                              <option value="Rejected" className="bg-popover text-popover-foreground">Archived / Rejected</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {job.role_title && (
                        <div className="text-sm font-semibold text-foreground/80 break-words pt-0.5 leading-snug">
                          {job.role_title}
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3 flex-1 pb-3">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {job.location && (
                          <span className="inline-flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-md font-medium text-foreground/80">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            {job.location}
                          </span>
                        )}
                        {job.salary_range && (
                          <span className="inline-flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-md font-medium text-foreground/80">
                            <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                            {job.salary_range}
                          </span>
                        )}
                      </div>

                      {/* JD Snippet */}
                      <p className="text-sm text-muted-foreground/90 line-clamp-3 leading-relaxed font-sans bg-muted/25 p-3 rounded-xl border border-border/50">
                        {job.description}
                      </p>
                    </CardContent>

                    <CardFooter className="pt-3 border-t border-border/70 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <Link
                        href={`/job/${job.id}`}
                        className="text-xs font-medium flex items-center gap-1 text-foreground/70 hover:text-foreground"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View full JD</span>
                      </Link>

                      <div className="flex items-center gap-1.5">
                        {/* 1-Click Copy on Card */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleCopyJd(e, job)}
                          className="h-8 text-xs px-2.5 gap-1.5 font-medium text-muted-foreground hover:text-foreground"
                          title="Copy JD to clipboard"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </Button>

                        {/* Edit Button */}
                        <Link href={`/edit/${job.id}`}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Link>

                        {/* Delete Button (opens reliable DeleteDialog) */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setJobToDelete({ id: job.id, companyName: job.company_name });
                          }}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete this JD"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bulletproof Delete Dialog */}
      <DeleteDialog
        open={Boolean(jobToDelete)}
        onOpenChange={(open) => {
          if (!open) setJobToDelete(null);
        }}
        companyName={jobToDelete?.companyName || ''}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={deleteAccountOpen}
        onOpenChange={setDeleteAccountOpen}
        username={currentUser.username}
      />

      {/* Import & Export Backup Dialog */}
      <DataBackupDialog
        open={backupOpen}
        onOpenChange={setBackupOpen}
        jobs={jobs}
        onImportSuccess={syncJobs}
      />
    </div>
  );
}
