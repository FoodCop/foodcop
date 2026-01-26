import AdBanner from './AdBanner';

interface BottomAdBannerProps {
  /**
   * AdSense data-ad-slot ID for this specific ad unit
   */
  adSlot?: string;
  /**
   * Custom banner image URL (if provided, shows image instead of AdSense)
   */
  bannerImage?: string;
}

/**
 * Bottom banner ad component
 * Displays after all page content
 */
const BottomAdBanner = ({ adSlot = 'YOUR_AD_SLOT_ID', bannerImage }: BottomAdBannerProps) => {
  console.log('BottomAdBanner rendered with bannerImage:', bannerImage);
  
  return (
    <div className="relative w-full border-t border-gray-200/50 shadow-sm bg-white">
      <div className="max-w-7xl mx-auto px-4 py-2">
        {bannerImage ? (
          <div>
            <img
              src={bannerImage}
              alt="Banner"
              className="w-full h-auto max-h-24 object-contain"
              style={{
                minHeight: '50px',
                maxHeight: '100px'
              }}
              onError={(e) => {
                console.error('Banner image failed to load:', bannerImage, e);
              }}
              onLoad={() => {
                console.log('Banner image loaded successfully:', bannerImage);
              }}
            />
          </div>
        ) : (
          <AdBanner
            dataAdSlot={adSlot}
            dataAdFormat="horizontal"
            dataFullWidthResponsive={true}
            style={{
              minHeight: '50px',
              maxHeight: '100px'
            }}
          />
        )}
      </div>
      <button
        onClick={() => {
          const adContainer = document.querySelector('.border-t.border-gray-200/50.shadow-sm')?.parentElement as HTMLElement;
          if (adContainer) {
            adContainer.style.display = 'none';
          }
        }}
        className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 text-xs px-2 py-1 bg-white/80 rounded-full shadow-sm"
        aria-label="Close ad"
      >
        ✕
      </button>
    </div>
  );
};

export default BottomAdBanner;
