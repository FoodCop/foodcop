import { useIsDesktop } from '../../hooks/useIsDesktop';
import TrimsMobile from './TrimsMobile';
import TrimsDesktop from './TrimsDesktop';

export default function TrimsNew() {
  const isDesktop = useIsDesktop();
  
  return isDesktop ? <TrimsDesktop /> : <TrimsMobile />;
}
