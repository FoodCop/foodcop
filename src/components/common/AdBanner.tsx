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

  useEffect(() => {
    if (!isAdSenseEnabled) return;

    try {
      // Push ad to adsbygoogle array
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        (window as any).adsbygoogle.push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [isAdSenseEnabled]);

  if (!isAdSenseEnabled) {
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
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive.toString()}
      />
    </div>
  );
};

export default AdBanner;
