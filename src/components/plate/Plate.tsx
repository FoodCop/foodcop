import { useIsDesktop } from '../../hooks/useIsDesktop';
import PlateMobile from './PlateMobile';
import PlateDesktop from './PlateDesktop';
import type { User } from '@supabase/supabase-js';

interface PlateNewProps {
  userId?: string;
  currentUser?: User;
}

export default function PlateNew({ userId, currentUser }: PlateNewProps = {}) {
  const isDesktop = useIsDesktop();
  
  return isDesktop ? (
    <PlateDesktop userId={userId} currentUser={currentUser} />
  ) : (
    <PlateMobile userId={userId} currentUser={currentUser} />
  );
}
