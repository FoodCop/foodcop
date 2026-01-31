import { useState } from 'react';
import { Button } from './button';
import { Close } from '@mui/icons-material';

interface GamifiedConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDiscard: () => void;
  message: string;
  itemName?: string;
}

export function GamifiedConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  onDiscard,
  message,
  itemName,
}: GamifiedConfirmDialogProps) {
  if (!isOpen) return null;

  const fullMessage = itemName ? `${message} ${itemName}?` : `${message}?`;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
      onClick={onClose}
      style={{ fontSize: '12pt' }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl p-7 max-w-md w-full mx-4 border-2"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderColor: '#FFC909',
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <p
            className="font-medium leading-tight flex-1"
            style={{
              color: '#808080',
              fontSize: '12pt',
              lineHeight: '1.2',
            }}
          >
            {fullMessage}
          </p>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2"
            aria-label="Close"
          >
              <Close className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-3 justify-end">
          <Button
            onClick={() => {
              onDiscard();
              onClose();
            }}
            variant="outline"
            className="px-5 py-2.5 rounded-md font-medium"
            style={{
              fontSize: '12pt',
              borderColor: '#808080',
              color: '#808080',
            }}
          >
            Discard
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-md font-medium text-white"
            style={{
              backgroundColor: '#FFC909',
              fontSize: '12pt',
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

