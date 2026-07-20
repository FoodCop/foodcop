'use client';

import { useState } from 'react';
import { MultiChips } from '@/components/ui/MultiChips';

// Shared editor for Settings' Flavor Profile / Cuisine Preferences / Dietary
// Preferences rows - all three are the same shape (a chip multi-select over
// a fixed option list, persisted as a taste_profiles TEXT[] column), so one
// modal serves all three instead of three near-identical ones.
interface TastePreferenceEditModalProps {
  title: string;
  emoji: string;
  options: readonly string[];
  initialSelected: string[];
  onSave: (values: string[]) => Promise<void>;
  onClose: () => void;
}

export default function TastePreferenceEditModal({
  title,
  emoji,
  options,
  initialSelected,
  onSave,
  onClose,
}: TastePreferenceEditModalProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [saving, setSaving] = useState(false);

  const toggle = (value: string) => {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selected);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-body p-4">
            <div className="fs-3 mb-2">{emoji}</div>
            <h5 className="fw-bold mb-3">{title}</h5>
            <MultiChips options={options} selected={selected} onToggle={toggle} />
          </div>
          <div className="modal-footer bg-light border-top-0 p-3 d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary flex-fill" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary flex-fill fw-bold" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
