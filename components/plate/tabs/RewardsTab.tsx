'use client';

import { Award, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RewardsTab() {
  return (
    <div className="text-center py-12">
      <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Your Rewards</h3>
      <p className="text-gray-600 mb-4">
        Earn badges and achievements for your food journey.
      </p>
      <Button variant="outline">
        <Trophy className="w-4 h-4 mr-2" />
        View All Badges
      </Button>
    </div>
  );
}