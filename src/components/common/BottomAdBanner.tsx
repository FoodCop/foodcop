import AdBanner from './AdBanner';

interface BottomAdBannerProps {
  /**
   * AdSense data-ad-slot ID for this specific ad unit
   */
  adSlot?: string;
}

/**
 * Bottom banner ad component
 * Displays after all page content
 */
const BottomAdBanner = ({ adSlot = 'YOUR_AD_SLOT_ID' }: BottomAdBannerProps) => {
  return (
    <div className="relative w-full bg-white border-t border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <AdBanner
          dataAdSlot={adSlot}
          dataAdFormat="horizontal"
          dataFullWidthResponsive={true}
          style={{
            minHeight: '50px',
            maxHeight: '100px'
          }}
        />
      </div>
      {/* Close button for better UX */}
      <button
        onClick={() => {
          const adContainer = document.querySelector('.border-t.border-gray-200.shadow-sm')?.parentElement as HTMLElement;
          if (adContainer) {
            adContainer.style.display = 'none';
          }
        }}
        className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 text-xs px-2 py-1 bg-white rounded-full"
        aria-label="Close ad"
      >
        ✕
      </button>
    </div>
  );
};

export default BottomAdBanner;
