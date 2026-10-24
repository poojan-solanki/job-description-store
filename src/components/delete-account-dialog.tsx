'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteAccountAction } from '@/app/actions/auth';
import { toast } from 'sonner';
import { UserX, Loader2, AlertTriangle } from 'lucide-react';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  username,
}: DeleteAccountDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteAccountAction();
      if (res.success) {
        toast.success('Your account and all saved job descriptions have been deleted.');
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to delete account');
      }
    } catch {
      toast.error('An error occurred while deleting your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6 font-sans">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold font-heading">
            Delete Account Permanently?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            This will permanently erase your account (<strong className="text-foreground font-semibold">{username}</strong>) and all associated job descriptions from the database. This action <strong className="text-destructive font-semibold">cannot be undone</strong>.
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
            Keep Account
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-xl h-10 text-sm font-semibold gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
            <span>{loading ? 'Deleting Account...' : 'Permanently Delete Account'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
