import { FuzoCard } from './FuzoCard';
import { PhoneFan } from './PhoneFan';

export function CookWatchSection() {
  return (
    <section 
      className="py-20 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(11, 31, 58, 0.7), rgba(11, 31, 58, 0.7)), url('https://images.unsplash.com/photo-1654064755996-80036b6e6984?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHhjb29raW5nJTIwa2l0Y2hlbiUyMHV0ZW5zaWxzJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NTY4MzI5NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <FuzoCard background="yellow" className="max-w-2xl text-center shadow-2xl">
            <div className="space-y-6">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-[#F14C35] rounded-full flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl">👨‍🍳</span>
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#0B1F3A]">
                Cook, Watch & Try
              </h2>
              <p className="text-lg text-[#0B1F3A]/80">
                Follow step-by-step cooking videos, try new recipes from around the world, and share your culinary creations with the FUZO community.
              </p>

              {/* Phone Fan Animation */}
              <PhoneFan
                leftImage="https://images.unsplash.com/photo-1758522488003-f48d8b40ea82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb29raW5nJTIwdmlkZW8lMjByZWNpcGV8ZW58MXx8fHwxNzYxNTMxODc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                centerImage="https://images.unsplash.com/photo-1731007530051-42866cac7e80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwcGxhdGluZyUyMGNoZWZ8ZW58MXx8fHwxNzYxNTMxODc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                rightImage="https://images.unsplash.com/photo-1760383710574-73f43fd3370d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwY29va2luZyUyMHN0ZXBzfGVufDF8fHx8MTc2MTUzMTg3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                altText="FUZO cooking recipes"
              />
            </div>
          </FuzoCard>
        </div>
      </div>
    </section>
  );
}