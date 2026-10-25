'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

export function DeleteDialog({
  open,
  onOpenChange,
  companyName,
  onConfirm,
  loading = false,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6 font-sans">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center">
            <Trash2 className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold font-heading">
            Delete Job Description?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to permanently delete the job description for{' '}
            <strong className="text-foreground font-semibold">{companyName}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-xl h-10 text-sm font-medium"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl h-10 text-sm font-semibold gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>{loading ? 'Deleting...' : 'Delete Job Description'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
