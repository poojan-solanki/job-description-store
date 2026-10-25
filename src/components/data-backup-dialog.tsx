'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { JobDescription, CreateJobInput } from '@/lib/types';
import { importJobsAction } from '@/app/actions/jobs';
import { toast } from 'sonner';
import {
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  Check,
} from 'lucide-react';

interface DataBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: JobDescription[];
  onImportSuccess: () => Promise<void> | void;
}

export function DataBackupDialog({
  open,
  onOpenChange,
  jobs,
  onImportSuccess,
}: DataBackupDialogProps) {
  const [activeTab, setActiveTab] = useState('export');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedJobs, setParsedJobs] = useState<CreateJobInput[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  // Export handlers
  const handleExportJson = () => {
    if (jobs.length === 0) {
      toast.info('No job descriptions to export yet.');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `jd_store_${dateStr}.json`;

    // Download via API route with explicit Content-Disposition header
    const link = document.createElement('a');
    link.href = '/api/export?format=json';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 1500);

    toast.success(`Exported as ${filename}`);
  };

  const handleExportCsv = () => {
    if (jobs.length === 0) {
      toast.info('No job descriptions to export yet.');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `jd_store_${dateStr}.csv`;

    // Download via API route with explicit Content-Disposition header
    const link = document.createElement('a');
    link.href = '/api/export?format=csv';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 1500);

    toast.success(`Exported as ${filename}`);
  };

  // Import file handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setParseError(null);
    setParsedJobs(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Normalize data: could be an array, or an object with { jobs: [...] } or { data: [...] }
        let rawList: unknown[] = [];
        if (Array.isArray(parsed)) {
          rawList = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.jobs)) {
            rawList = parsed.jobs;
          } else if (Array.isArray(parsed.data)) {
            rawList = parsed.data;
          }
        }

        if (rawList.length === 0) {
          setParseError('No job records found. Make sure the file is a valid JSON array or backup.');
          return;
        }

        // Validate items
        const validList: CreateJobInput[] = [];
        for (const item of rawList) {
          if (
            item &&
            typeof item === 'object' &&
            'company_name' in item &&
            typeof (item as { company_name: unknown }).company_name === 'string' &&
            'description' in item &&
            typeof (item as { description: unknown }).description === 'string'
          ) {
            const raw = item as Record<string, unknown>;
            validList.push({
              company_name: String(raw.company_name).trim(),
              role_title: raw.role_title ? String(raw.role_title).trim() : '',
              location: raw.location ? String(raw.location).trim() : '',
              job_type: raw.job_type ? String(raw.job_type).trim() : 'Full-time',
              salary_range: raw.salary_range ? String(raw.salary_range).trim() : '',
              status: (raw.status as CreateJobInput['status']) || 'Saved',
              description: String(raw.description).trim(),
              notes: raw.notes ? String(raw.notes).trim() : '',
            });
          }
        }

        if (validList.length === 0) {
          setParseError('The file contains items, but none had valid "company_name" and "description" fields.');
          return;
        }

        setParsedJobs(validList);
      } catch {
        setParseError('Failed to parse file. Please upload a valid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleStartImport = async () => {
    if (!parsedJobs || parsedJobs.length === 0) return;

    setImporting(true);
    try {
      const res = await importJobsAction(parsedJobs, skipDuplicates);
      if (res.success && res.result) {
        toast.success(
          `Successfully imported ${res.result.importedCount} job description${
            res.result.importedCount === 1 ? '' : 's'
          }${res.result.skippedCount > 0 ? ` (${res.result.skippedCount} skipped as duplicate)` : ''}!`
        );
        await onImportSuccess();
        onOpenChange(false);
        // Reset state
        setSelectedFile(null);
        setParsedJobs(null);
      } else {
        toast.error(res.error || 'Failed to import job descriptions.');
      }
    } catch {
      toast.error('An unexpected error occurred during import.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-6 font-sans">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-heading">
                Import & Export Data
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                Backup, restore, or transfer your saved job descriptions anytime.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
          <TabsList className="grid grid-cols-2 w-full h-11 p-1 bg-muted/60 rounded-xl">
            <TabsTrigger value="export" className="gap-2 rounded-lg text-xs sm:text-sm font-semibold">
              <Download className="w-4 h-4" />
              <span>Export ({jobs.length})</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2 rounded-lg text-xs sm:text-sm font-semibold">
              <Upload className="w-4 h-4" />
              <span>Import Data</span>
            </TabsTrigger>
          </TabsList>

          {/* Export View */}
          <TabsContent value="export" className="space-y-4 pt-3">
            <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-1">
              <div className="text-sm font-semibold text-foreground">
                Your Job Store Backup
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You currently have <strong className="text-foreground">{jobs.length}</strong> job
                description{jobs.length === 1 ? '' : 's'} stored in your account. You can download
                them in full fidelity.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleExportJson}
                disabled={jobs.length === 0}
                className="w-full text-left p-3.5 rounded-xl border border-border/80 hover:border-primary/50 hover:bg-muted/40 transition-all flex items-center justify-between gap-3 group disabled:opacity-50 disabled:pointer-events-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold group-hover:text-primary transition-colors">
                      Export as JSON (Recommended)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Downloads <code className="text-foreground/90 font-mono">jd_store_&lt;date&gt;.json</code> with all markdown, notes, and statuses. Ready to re-import.
                    </div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={jobs.length === 0}
                className="w-full text-left p-3.5 rounded-xl border border-border/80 hover:border-primary/50 hover:bg-muted/40 transition-all flex items-center justify-between gap-3 group disabled:opacity-50 disabled:pointer-events-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold group-hover:text-primary transition-colors">
                      Export as CSV (Spreadsheet)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Downloads <code className="text-foreground/90 font-mono">jd_store_&lt;date&gt;.csv</code> for Microsoft Excel or Google Sheets.
                    </div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
              </button>
            </div>
          </TabsContent>

          {/* Import View */}
          <TabsContent value="import" className="space-y-4 pt-3">
            <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-1">
              <div className="text-sm font-semibold text-foreground">
                Import from JSON Backup
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload a JSON file exported from this app or an array of job description records.
              </p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* File drop / picker zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/90 hover:border-primary/50 hover:bg-muted/20 transition-all rounded-xl p-6 text-center cursor-pointer space-y-2"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm font-semibold">
                {selectedFile ? (
                  <span className="text-foreground font-bold">{selectedFile.name}</span>
                ) : (
                  <span>Click to select a JSON backup file</span>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Accepts .json backups up to 10MB
              </div>
            </div>

            {/* Parse result preview or error */}
            {parseError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {parsedJobs && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Found {parsedJobs.length} valid job description{parsedJobs.length === 1 ? '' : 's'}</span>
                </div>
                <div className="text-[11px] text-muted-foreground/80 pl-6">
                  Ready to import into your account.
                </div>
              </div>
            )}

            {/* Options */}
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <span>Skip duplicate jobs (matching Company and Role)</span>
            </label>

            {/* Import Submit Button */}
            <Button
              type="button"
              onClick={handleStartImport}
              disabled={!parsedJobs || parsedJobs.length === 0 || importing}
              className="w-full h-11 rounded-xl text-sm font-semibold gap-2 shadow-xs"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing {parsedJobs?.length} Jobs...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    Import {parsedJobs ? `${parsedJobs.length} ` : ''}Job Descriptions
                  </span>
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
