'use client';

import { useState, useEffect } from 'react';
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
  DollarSign,
  FileText,
  Sparkles,
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
  const [jobType, setJobType] = useState(initialJob?.job_type || 'Full-time');
  const [salaryRange, setSalaryRange] = useState(initialJob?.salary_range || '');
  const [status, setStatus] = useState<ApplicationStatus>(initialJob?.status || 'Saved');
  const [description, setDescription] = useState(initialJob?.description || '');
  const [notes, setNotes] = useState(initialJob?.notes || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

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
        snippet = '\n\n## Compensation & Benefits\n- Highly competitive base salary + equity compensation\n- Comprehensive health, dental, and vision coverage\n- Flexible PTO and continuous learning budget';
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

  // Word count & Char count
  const words = description.trim() ? description.trim().split(/\s+/).length : 0;
  const chars = description.length;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans pb-24">
      {/* Top Fixed Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

            <span className="text-muted-foreground/40 font-mono text-base">/</span>

            <span className="text-sm font-bold truncate max-w-[200px] sm:max-w-none font-heading">
              {initialJob ? `Edit: ${initialJob.company_name}` : 'New Job Description'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs text-muted-foreground font-medium mr-1">
              {chars > 0 ? `${words} words · ${chars} chars` : 'Ctrl + S to save'}
            </span>

            <ThemeToggle className="h-9 w-9" />

            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="gap-2 h-10 px-5 text-sm font-semibold shadow-xs"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : savedSuccess ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Saving...' : initialJob ? 'Update Job Description' : 'Save to Store'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Document Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-8">
        {/* Title Area: Role Title */}
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Role / Title (e.g. Senior Backend Engineer)"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight border-0 shadow-none px-0 h-auto py-1 focus-visible:ring-0 placeholder:text-muted-foreground/35 bg-transparent font-heading"
          />
        </div>

        {/* Structured Metadata Grid */}
        <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card/70 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Company Name */}
            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <Building className="w-3.5 h-3.5 text-muted-foreground" />
                Company <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company"
                type="text"
                placeholder="e.g. Stripe, OpenAI"
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
                placeholder="e.g. Remote (US) / SF"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 text-sm rounded-xl"
              />
            </div>

            {/* Compensation */}
            <div className="space-y-1.5">
              <Label htmlFor="comp" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                Compensation
              </Label>
              <Input
                id="comp"
                type="text"
                placeholder="e.g. $190k - $240k"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="h-11 text-sm rounded-xl"
              />
            </div>

            {/* Application Status */}
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
                <option value="Saved">Saved</option>
                <option value="Applied">Applied</option>
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
            <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
              <span className="text-muted-foreground mr-1 hidden sm:inline font-medium">Add section:</span>
              <button
                type="button"
                onClick={() => handleInsertTemplate('overview')}
                className="px-3 py-1 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                + Overview
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('responsibilities')}
                className="px-3 py-1 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                + Responsibilities
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('requirements')}
                className="px-3 py-1 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                + Requirements
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('benefits')}
                className="px-3 py-1 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                + Benefits
              </button>
            </div>
          </div>

          <Textarea
            placeholder="Paste or write the complete job description here. Use plain text or markdown..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[460px] font-mono text-sm leading-relaxed p-5 border border-border/80 rounded-2xl bg-card/60 focus-visible:ring-1 focus-visible:ring-ring shadow-xs resize-y"
            required
          />
        </div>

        {/* Personal Notes Section */}
        <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card/60 space-y-2">
          <Label htmlFor="notes" className="text-sm font-bold text-foreground/90 block font-heading">
            Personal Notes & Contacts (Optional)
          </Label>
          <Input
            id="notes"
            type="text"
            placeholder="e.g. Applied via Sarah (referral). Round 1 technical interview scheduled for Thursday."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-11 text-sm rounded-xl"
          />
        </div>
      </main>

      {/* Floating / Sticky Bottom Bar (Always clearly visible without scrolling!) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/80 bg-background/95 backdrop-blur-md shadow-lg py-3.5 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Discard and Return Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-muted-foreground">
              {words} words · {chars} chars
            </span>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 h-11 px-7 text-sm font-semibold rounded-xl shadow-md"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Saving...' : initialJob ? 'Update Job Description' : 'Save to Store'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
