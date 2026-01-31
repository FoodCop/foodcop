import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { WarningAmber, Info, ErrorOutline } from '@mui/icons-material';

interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
  icon?: 'warning' | 'info' | 'error';
}

export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const showConfirm = (opts: ConfirmDialogOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleConfirm = () => {
    if (resolver) {
      resolver(true);
    }
    setIsOpen(false);
    setResolver(null);
  };

  const handleCancel = () => {
    if (resolver) {
      resolver(false);
    }
    setIsOpen(false);
    setResolver(null);
  };

  const ConfirmDialog = () => {
    if (!options) return null;

    const icons = {
      warning: WarningAmber,
      info: Info,
      error: ErrorOutline
    };
    
    const Icon = options.icon ? icons[options.icon] : null;

    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          handleCancel();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {Icon && <Icon className="w-5 h-5" />}
              {options.title}
            </DialogTitle>
            <DialogDescription>{options.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel}>
              {options.cancelText || 'Cancel'}
            </Button>
            <Button 
              variant={options.variant === 'destructive' || options.variant === 'warning' ? 'destructive' : 'default'}
              onClick={handleConfirm}
            >
              {options.confirmText || 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return { showConfirm, ConfirmDialog };
};
