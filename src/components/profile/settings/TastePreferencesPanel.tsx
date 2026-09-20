'use client';

import { useRouter } from 'next/navigation';
import { summarize, type TasteField } from './shared';

interface TastePreferencesPanelProps {
  tasteProfile: Record<TasteField, string[]>;
  hasDnaScores: boolean;
  onEditField: (field: TasteField) => void;
}

export default function TastePreferencesPanel({ tasteProfile, hasDnaScores, onEditField }: TastePreferencesPanelProps) {
  const router = useRouter();

  return (
    <div className="list-group shadow-sm rounded-4 border-0">
      <button
        type="button"
        className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom"
        onClick={() => onEditField('flavors')}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="bg-danger bg-opacity-10 text-danger rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🌶️</div>
          <div className="text-start">
            <div className="fw-bold text-dark">Flavor Profile</div>
            <small className="text-muted">{summarize(tasteProfile.flavors, 'No flavors picked yet')}</small>
          </div>
        </div>
        <span className="text-muted fw-bold fs-5">›</span>
      </button>
      <button
        type="button"
        className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom"
        onClick={() => onEditField('cuisines')}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="bg-warning bg-opacity-10 text-warning rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🌍</div>
          <div className="text-start">
            <div className="fw-bold text-dark">Cuisine Preferences</div>
            <small className="text-muted">{summarize(tasteProfile.cuisines, 'No cuisines picked yet')}</small>
          </div>
        </div>
        <span className="text-muted fw-bold fs-5">›</span>
      </button>
      <button
        type="button"
        className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom"
        onClick={() => onEditField('dietary')}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="bg-success bg-opacity-10 text-success rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🥗</div>
          <div className="text-start">
            <div className="fw-bold text-dark">Dietary Preferences</div>
            <small className="text-muted">{summarize(tasteProfile.dietary, 'No restrictions currently set')}</small>
          </div>
        </div>
        <span className="text-muted fw-bold fs-5">›</span>
      </button>
      <button
        type="button"
        className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0"
        onClick={() => router.push('/dna-quiz')}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary bg-opacity-10 text-primary rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🧬</div>
          <div className="text-start">
            <div className="fw-bold text-dark">Food DNA Quiz</div>
            <small className="text-muted">{hasDnaScores ? 'Retake the 25-question quiz' : 'Take the 25-question quiz'}</small>
          </div>
        </div>
        <span className="text-muted fw-bold fs-5">›</span>
      </button>
    </div>
  );
}
