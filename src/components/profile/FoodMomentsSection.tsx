'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import FoodMomentsService, { type FoodMoment, MOMENT_TYPE_LABEL } from '@/lib/services/foodMomentsService';
import FoodMomentModal from './FoodMomentModal';

const COLLAPSED_COUNT = 5;

export default function FoodMomentsSection({ userId, isOwnProfile }: { userId?: string; isOwnProfile: boolean }) {
  const [moments, setMoments] = useState<FoodMoment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [viewing, setViewing] = useState<FoodMoment | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await FoodMomentsService.listForUser(userId);
    setMoments(result.success && result.data ? result.data : []);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (isLoading || (!isOwnProfile && moments.length === 0)) return null;

  const visible = showAll ? moments : moments.slice(0, COLLAPSED_COUNT);

  return (
    <div className="fz-moments-section">
      <div className="fz-moments-section__head">
        <h6 className="fz-moments-section__title">My Food Moments</h6>
        {moments.length > COLLAPSED_COUNT && (
          <button type="button" className="fz-moments-section__viewall" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show less' : 'View all →'}
          </button>
        )}
      </div>

      <div className="fz-moments-grid">
        {visible.map((m) => (
          <button key={m.id} type="button" className="fz-moment-card" onClick={() => setViewing(m)}>
            <img src={m.image_url} alt={m.title} />
            <div className="fz-moment-card__overlay">
              <div className="fz-moment-card__title">{m.title}</div>
              <div className="fz-moment-card__subtitle">{MOMENT_TYPE_LABEL[m.moment_type]}</div>
            </div>
          </button>
        ))}

        {isOwnProfile && (
          <button type="button" className="fz-moment-card fz-moment-card--add" onClick={() => setIsCreating(true)}>
            <Plus size={22} />
            <span>Add New</span>
            <small>Food, Place, or Memory</small>
          </button>
        )}
      </div>

      {isCreating && userId && (
        <FoodMomentModal userId={userId} onClose={() => setIsCreating(false)} onSaved={refetch} />
      )}

      {viewing && userId && (
        <FoodMomentModal userId={userId} viewing={viewing} onClose={() => setViewing(null)} onSaved={refetch} onDeleted={refetch} />
      )}
    </div>
  );
}
