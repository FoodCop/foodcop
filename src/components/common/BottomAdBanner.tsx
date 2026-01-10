import AdBanner from './AdBanner';

interface BottomAdBannerProps {
  /**
   * AdSense data-ad-slot ID for this specific ad unit
   */
  adSlot?: string;
}

/**
 * Fixed bottom banner ad component
 * Stays at the bottom of the viewport across all pages
 */
const BottomAdBanner = ({ adSlot = 'YOUR_AD_SLOT_ID' }: BottomAdBannerProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
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
          const adContainer = document.querySelector('.fixed.bottom-0') as HTMLElement;
          if (adContainer) {
            adContainer.style.display = 'none';
          }
        }}
        className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 text-xs px-2 py-1"
        aria-label="Close ad"
      >
        ✕
      </button>
    </div>
  );
};

export default BottomAdBanner;
