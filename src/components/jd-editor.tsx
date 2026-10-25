'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/theme-toggle';
import { JobDescription, CreateJobInput, ApplicationStatus } from '@/lib/types';
import { saveJobAction } from '@/app/actions/jobs';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Loader2,
  Building,
  Briefcase,
  MapPin,
  IndianRupee,
  FileText,
  Check,
} from 'lucide-react';

interface JdEditorProps {
  initialJob?: JobDescription | null;
  defaultCompany?: string;
}

export function JdEditor({ initialJob, defaultCompany = '' }: JdEditorProps) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(initialJob?.company_name || defaultCompany);
  const [roleTitle, setRoleTitle] = useState(initialJob?.role_title || '');
  const [location, setLocation] = useState(initialJob?.location || '');
  const jobType = initialJob?.job_type || 'Full-time';
  const [salaryRange, setSalaryRange] = useState(initialJob?.salary_range || '');
  const [status, setStatus] = useState<ApplicationStatus>(initialJob?.status || 'Applied');
  const [description, setDescription] = useState(initialJob?.description || '');
  const [notes, setNotes] = useState(initialJob?.notes || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Keep a ref to handleSave so keydown listener always calls the freshest state
  const handleSaveRef = useRef<() => void>(() => {});

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInsertTemplate = (templateType: string) => {
    let snippet = '';
    switch (templateType) {
      case 'overview':
        snippet = '\n\n## Role Overview\n[Brief summary of the role, team, and company mission]';
        break;
      case 'responsibilities':
        snippet = '\n\n## Key Responsibilities\n- Architect, scale, and maintain critical systems...\n- Collaborate closely with cross-functional engineering teams...\n- Drive high technical standards, code quality, and reliability...';
        break;
      case 'requirements':
        snippet = '\n\n## Qualifications & Requirements\n- 5+ years of relevant industry experience in...\n- Deep proficiency with modern languages and cloud architectures...\n- Strong problem-solving skills and passion for customer impact...';
        break;
      case 'benefits':
        snippet = '\n\n## Salary & Benefits\n- Competitive base salary (INR) + performance bonus\n- Comprehensive health and medical coverage\n- Flexible leave policy and professional development allowance';
        break;
    }
    setDescription((prev) => (prev ? prev + snippet : snippet.trim()));
    toast.info(`Added ${templateType} section`);
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.error('Please specify a company name.');
      return;
    }
    if (!description.trim()) {
      toast.error('Please paste or enter the job description.');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateJobInput & { id?: string } = {
        id: initialJob ? initialJob.id : undefined,
        company_name: companyName.trim(),
        role_title: roleTitle.trim(),
        location: location.trim(),
        job_type: jobType,
        salary_range: salaryRange.trim(),
        status,
        description: description.trim(),
        notes: notes.trim(),
      };

      const res = await saveJobAction(payload);
      if (res.success && res.job) {
        setSavedSuccess(true);
        toast.success(
          initialJob
            ? `Updated JD for ${res.job.company_name}`
            : `Saved JD for ${res.job.company_name}!`
        );
        // Clear fields when saving a new job so next new JD opens empty
        if (!initialJob) {
          setCompanyName('');
          setRoleTitle('');
          setLocation('');
          setSalaryRange('');
          setStatus('Applied');
          setDescription('');
          setNotes('');
        }
        // Refresh server components and navigate back to the home page
        router.refresh();
        router.push('/');
      } else {
        toast.error(res.error || 'Failed to save job description.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  // Sync ref on render so the keyboard listener always calls current state
  useEffect(() => {
    handleSaveRef.current = handleSave;
  });

  // Word count & Char count
  const words = description.trim() ? description.trim().split(/\s+/).length : 0;
  const chars = description.length;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans pb-24 overflow-x-hidden">
      {/* Top Fixed Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
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

            <span className="text-xs sm:text-sm font-bold truncate max-w-[120px] sm:max-w-none font-heading">
              {initialJob ? `Edit: ${initialJob.company_name}` : 'New JD'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium mr-1">
              {chars > 0 && <span>{words} words · {chars} chars</span>}
              {chars > 0 && <span className="text-muted-foreground/30">·</span>}
              <span className="inline-flex items-center gap-1 bg-muted/70 px-2 py-0.5 rounded text-[11px] border border-border/70">
                <kbd className="font-mono">Ctrl</kbd>+<kbd className="font-mono">S</kbd> to save
              </span>
            </div>

            <ThemeToggle className="h-8 w-8 sm:h-9 sm:w-9" />

            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              title="Save Job Description (Ctrl + S)"
              className="gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm font-semibold shadow-xs"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : savedSuccess ? (
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              ) : (
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span>{saving ? 'Saving...' : initialJob ? 'Update' : 'Save'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Document Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Title Area: Role Title */}
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Role / Title (e.g. Senior Backend Engineer)"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            className="text-2xl sm:text-4xl font-extrabold tracking-tight border-0 shadow-none px-0 h-auto py-1 focus-visible:ring-0 placeholder:text-muted-foreground/35 bg-transparent font-heading"
          />
        </div>

        {/* Structured Metadata Grid */}
        <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card/70 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Company Name */}
            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <Building className="w-3.5 h-3.5 text-muted-foreground" />
                Company <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company"
                type="text"
                placeholder="e.g. Stripe, OpenAI, Byteflow"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="h-11 text-sm font-medium rounded-xl"
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="loc" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                Location
              </Label>
              <Input
                id="loc"
                type="text"
                placeholder="e.g. Remote / Bengaluru / Pune"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 text-sm rounded-xl"
              />
            </div>

            {/* Salary in INR */}
            <div className="space-y-1.5">
              <Label htmlFor="salary" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                Salary (INR)
              </Label>
              <Input
                id="salary"
                type="text"
                placeholder="e.g. ₹15 - 25 LPA"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="h-11 text-sm rounded-xl"
              />
            </div>

            {/* Application Status (Defaults to Applied) */}
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                Status
              </Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
              >
                <option value="Applied">Applied (Default)</option>
                <option value="Saved">Saved</option>
                <option value="Interviewing">Interviewing</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Archived / Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Text Editor Area */}
        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-heading">
                Job Description
              </span>
              <span className="text-destructive text-sm">*</span>
            </div>

            {/* Quick Template Chips */}
            <div className="flex items-center gap-1.5 text-xs overflow-x-auto max-w-full pb-1 sm:pb-0">
              <span className="text-muted-foreground mr-1 hidden sm:inline font-medium shrink-0">Add section:</span>
              <button
                type="button"
                onClick={() => handleInsertTemplate('overview')}
                className="px-2.5 py-1 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors whitespace-nowrap shrink-0"
              >
                + Overview
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('responsibilities')}
                className="px-2.5 py-1 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors whitespace-nowrap shrink-0"
              >
                + Responsibilities
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('requirements')}
                className="px-2.5 py-1 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors whitespace-nowrap shrink-0"
              >
                + Requirements
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('benefits')}
                className="px-2.5 py-1 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors whitespace-nowrap shrink-0"
              >
                + Benefits
              </button>
            </div>
          </div>

          <Textarea
            placeholder="Paste or write the complete job description here. Use plain text or markdown..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[360px] sm:min-h-[460px] font-mono text-base sm:text-sm leading-relaxed p-4 sm:p-5 border border-border/80 rounded-2xl bg-card/60 focus-visible:ring-1 focus-visible:ring-ring shadow-xs resize-y w-full max-w-full"
            required
          />
        </div>

        {/* Personal Notes Section */}
        <div className="p-4 sm:p-6 rounded-2xl border border-border/80 bg-card/60 space-y-2">
          <Label htmlFor="notes" className="text-sm font-bold text-foreground/90 block font-heading">
            Personal Notes & Contacts (Optional)
          </Label>
          <Input
            id="notes"
            type="text"
            placeholder="e.g. Applied via referral. Round 1 technical interview scheduled for Thursday."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-11 text-base sm:text-sm rounded-xl"
          />
        </div>
      </main>

      {/* Floating / Sticky Bottom Bar (Always clearly visible without scrolling!) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/80 bg-background/95 backdrop-blur-md shadow-lg py-2.5 sm:py-3.5 px-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <Link
            href="/"
            className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span><span className="hidden sm:inline">Discard and </span>Return Home</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span>{words} words · {chars} chars</span>
              <span className="text-muted-foreground/30">·</span>
              <span className="inline-flex items-center gap-1 bg-muted/70 px-2 py-0.5 rounded text-[11px] border border-border/70">
                <kbd className="font-mono">Ctrl</kbd>+<kbd className="font-mono">S</kbd> to save
              </span>
            </span>

            <Button
              onClick={handleSave}
              disabled={saving}
              title="Save Job Description (Ctrl + S)"
              className="gap-1.5 sm:gap-2 h-10 sm:h-11 px-4 sm:px-7 text-xs sm:text-sm font-semibold rounded-xl shadow-md"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span>{saving ? 'Saving...' : initialJob ? 'Update JD' : 'Save JD'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
