import { useEffect } from 'react';

interface AdBannerProps {
  /**
   * AdSense data-ad-slot ID
   */
  dataAdSlot: string;
  /**
   * AdSense data-ad-format (default: 'auto')
   */
  dataAdFormat?: string;
  /**
   * Whether to enable full width responsive (default: true)
   */
  dataFullWidthResponsive?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Ad style override
   */
  style?: React.CSSProperties;
}

/**
 * Google AdSense Banner Component
 * Displays a responsive banner ad at the bottom of pages
 */
const AdBanner = ({
  dataAdSlot,
  dataAdFormat = 'auto',
  dataFullWidthResponsive = true,
  className = '',
  style = {}
}: AdBannerProps) => {
  const isAdSenseEnabled = import.meta.env.VITE_ENABLE_ADSENSE === 'true';
  const adClientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
  const isAdSenseConfigured = typeof adClientId === 'string' && adClientId.startsWith('ca-pub-');

  useEffect(() => {
    if (!isAdSenseEnabled || !isAdSenseConfigured) return;

    try {
      // Push ad to adsbygoogle array
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        (window as any).adsbygoogle.push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [isAdSenseEnabled, isAdSenseConfigured]);

  if (!isAdSenseEnabled || !isAdSenseConfigured) {
    return null;
  }

  return (
    <div className={`ad-banner-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...style
        }}
        data-ad-client={adClientId}
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive.toString()}
      />
    </div>
  );
};

export default AdBanner;
