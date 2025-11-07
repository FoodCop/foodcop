import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';

interface YesNoDialogOptions {
  title: string;
  description: string;
  yesText?: string;
  noText?: string;
}

/**
 * Simple yes/no confirmation dialog hook
 * Ideal for quick binary questions where "Yes" and "No" are appropriate
 */
export const useYesNoDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<YesNoDialogOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const showYesNo = (opts: YesNoDialogOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleYes = () => {
    if (resolver) {
      resolver(true);
    }
    setIsOpen(false);
    setResolver(null);
  };

  const handleNo = () => {
    if (resolver) {
      resolver(false);
    }
    setIsOpen(false);
    setResolver(null);
  };

  const YesNoDialog = () => {
    if (!options) return null;

    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          handleNo();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{options.title}</DialogTitle>
            <DialogDescription>{options.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleNo}>
              {options.noText || 'No'}
            </Button>
            <Button onClick={handleYes}>
              {options.yesText || 'Yes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return { showYesNo, YesNoDialog };
};
