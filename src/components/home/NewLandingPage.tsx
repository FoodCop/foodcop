import { useEffect, useState } from 'react';
import './NewLandingPage.css';
import { PhoneFan } from './components/PhoneFan';
import { useAuth } from '../auth/AuthProvider';

interface NewLandingPageProps {
  onNavigateToSignup?: () => void;
}

// Static Phone Mockup for Desktop
function StaticPhoneMockup({ image, alt, className = "" }: { image: string; alt: string; className?: string }) {
  return (
    <div className={`phone-mockup ${className} w-40 h-80 md:w-60 md:h-[480px]`}>
      <div className="relative w-full h-full bg-gray-900 rounded-[3rem] shadow-2xl p-2">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-10"></div>
        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
          <img src={image} alt={alt} className="w-full h-full object-cover" />
        </div>
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full"></div>
      </div>
    </div>
  );
}

export function NewLandingPage({ onNavigateToSignup }: NewLandingPageProps) {
  const [colorMode, setColorMode] = useState<'white' | 'yellow'>('white');
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (onNavigateToSignup) {
      onNavigateToSignup();
    } else {
      // If user is already authenticated, go directly to plate
      // Otherwise, go to auth page for sign in
      globalThis.location.hash = user ? '#plate' : '#auth';
    }
  };

  const toggleColorMode = () => {
    setColorMode(prev => prev === 'white' ? 'yellow' : 'white');
  };

  // Apply color mode to background CSS variable
  useEffect(() => {
    const backgroundColor = colorMode === 'yellow' ? '#FFD53B' : '#FAFAFA';
    const landingPage = document.querySelector('.new-landing-page') as HTMLElement;
    if (landingPage) {
      landingPage.style.setProperty('--background', backgroundColor);
    }
  }, [colorMode]);

  // Animate phone mockups on scroll for desktop
  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const phones = entry.target.querySelectorAll('.phone-mockup');
          phones.forEach((phone, index) => {
            setTimeout(() => {
              phone.classList.add('animate');
            }, index * 150);
          });
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all sections with phone mockups
    const sections = document.querySelectorAll('.new-landing-page section');
    sections.forEach(section => observer.observe(section));

    return () => {
      sections.forEach(section => observer.unobserve(section));
    };
  }, []);

  return (
    <div className="new-landing-page">
      {/* Header */}
      <header className="fixed w-full top-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/logo_mobile.png" alt="FUZO" className="h-10" />
          </div>
          <nav className="hidden md:flex space-x-8"></nav>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleColorMode}
              className="px-4 py-2 rounded-full border-2 transition"
              style={{ 
                borderColor: colorMode === 'yellow' ? '#FFD53B' : '#FFFFFF',
                backgroundColor: colorMode === 'yellow' ? '#FFD53B' : '#FFFFFF',
                color: colorMode === 'yellow' ? '#000000' : '#000000'
              }}
              title="Toggle Color Mode"
            >
              <i className="fa-solid fa-palette"></i>
            </button>
            <button
              onClick={handleGetStarted}
              className="hidden md:block px-6 py-2 bg-white text-foreground font-semibold rounded-full border-2 border-gray-300 hover:bg-gray-50 transition"
            >
              Get Started
            </button>
            <button className="md:hidden focus:outline-none">
              <i className="fa-solid fa-bars text-foreground text-xl"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Mobile Version */}
      <section className="block md:hidden relative min-h-[600px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/Hero.png"
            alt="world map made of colorful food, continents as dishes"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-20 min-h-[600px] flex flex-col justify-center">
          <div className="flex flex-col items-center gap-8">
            <div className="text-center max-w-2xl">
              <h1 className="text-4xl font-bold text-white mb-6 leading-tight drop-shadow-lg text-center">
                Unearth<br/>
                <span className="text-white">the undiscovered gastronomy</span>
              </h1>
            
              <button
                onClick={handleGetStarted}
                className="bg-white hover:bg-gray-50 text-foreground font-bold text-lg px-10 py-4 rounded-full border-2 border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              > Get Started<i className="fa-solid fa-arrow-right ml-2"></i>
              </button>
            </div>
            
           
          </div>
        </div>
      </section>

      {/* Hero Section - Desktop Version */}
      <section className="hidden md:flex relative h-[800px] items-center justify-center overflow-hidden mt-16">
        <div className="absolute inset-0 z-0">
          <img
            src="/Hero.png"
            alt="world map made of colorful food, continents as dishes"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="max-w-4xl">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg text-center">
                Discover Your Next Favorite Meal
              </h1>
              <p className="text-xl md:text-2xl text-white mb-8 leading-relaxed drop-shadow-lg text-center">
                Save recipes, watch cooking tutorials, share food stories, and explore restaurants with your AI food buddy Tako
              </p>
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-white text-foreground font-bold text-lg rounded-full border-2 border-gray-300 hover:bg-gray-50 transition shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started <i className="fa-solid fa-arrow-right ml-2"></i>
              </button>
            </div>
            <div className="hidden md:flex justify-center items-center"></div>
          </div>
        </div>
      </section>

      {/* Pin Food Section */}
      <section className="py-16 md:py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 text-center">
              Pin Your Favorite Foods
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-secondary max-w-2xl lg:max-w-3xl mx-auto text-center">
              Save recipes, bookmark dishes, and create your personal food wishlist. Never lose track of that amazing recipe again.
            </p>
          </div>
          {/* Mobile: PhoneFan with animations */}
          <div className="block md:hidden">
            <PhoneFan
              leftImage="/images/pin1.jpg"
              centerImage="/images/pin2.jpg"
              rightImage="/images/pin3.jpg"
              altText="Pin Your Favorite Foods"
            />
          </div>
          {/* Desktop: Static phone mockups */}
          <div className="hidden md:flex justify-center items-end gap-6 md:gap-12 perspective-1000">
            <StaticPhoneMockup 
              image="/images/pin1.jpg"
              alt="mobile app interface showing saved recipes and bookmarks"
              className="phone-left"
            />
            <StaticPhoneMockup 
              image="/images/pin2.jpg"
              alt="mobile app showing favorite dishes collection"
              className="phone-center -mt-8"
            />
            <StaticPhoneMockup 
              image="/images/pin3.jpg"
              alt="food wishlist planning screen on mobile app"
              className="phone-right"
            />
          </div>
        </div>
      </section>

      {/* Cook Watch Section - Mobile */}
      <section className="block md:hidden relative py-16 min-h-[700px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://storage.googleapis.com/uxpilot-auth.appspot.com/facc971d01-9cb23a35020b35626d9c.png"
            alt="professional kitchen cooking scene, chef preparing food"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4 text-center">
              Cook &amp; Watch
            </h2>
            <p className="text-lg text-white max-w-2xl mx-auto text-center">
              Learn from step-by-step video recipes and cooking guides. Master new techniques with expert chefs.
            </p>
          </div>
          
          <div className="flex justify-center items-end gap-4">
            <div className="phone-mockup phone-left animate-on-scroll w-40">
              <div className="phone-screen aspect-[9/19.5]">
                <div className="phone-notch"></div>
                <img
                  src="/images/cook1.jpg"
                  alt="cooking video recipe interface"
                  className="w-full h-full object-cover"
                />
                <div className="phone-indicator"></div>
              </div>
            </div>
            
            <div className="phone-mockup phone-center animate-on-scroll w-[180px]">
              <div className="phone-screen aspect-[9/19.5]">
                <div className="phone-notch"></div>
                <img
                  src="/images/cook2.jpg"
                  alt="food plating techniques demonstration"
                  className="w-full h-full object-cover"
                />
                <div className="phone-indicator"></div>
              </div>
            </div>
            
            <div className="phone-mockup phone-right animate-on-scroll w-40">
              <div className="phone-screen aspect-[9/19.5]">
                <div className="phone-notch"></div>
                <img
                  src="/images/cook3.jpg"
                  alt="kitchen cooking steps breakdown"
                  className="w-full h-full object-cover"
                />
                <div className="phone-indicator"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cook Watch Section - Desktop */}
      <section className="hidden md:block relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://storage.googleapis.com/uxpilot-auth.appspot.com/8590841fbf-3850affa462e7161230c.png"
            alt="professional kitchen with cooking utensils"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gray-900/80"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 text-center">
              Cook &amp; Watch
            </h2>
            <p className="text-xl md:text-2xl text-white max-w-3xl mx-auto text-center">
              Follow step-by-step video recipes and cooking guides. Learn from professional chefs and master new techniques.
            </p>
          </div>
          <div className="flex justify-center items-end gap-6 md:gap-12">
            <StaticPhoneMockup 
              image="/images/cook1.jpg"
              alt="cooking video recipe interface on mobile"
              className="phone-left"
            />
            <StaticPhoneMockup 
              image="/images/cook2.jpg"
              alt="food plating techniques and chef cooking"
              className="phone-center -mt-8"
            />
            <StaticPhoneMockup 
              image="/images/cook3.jpg"
              alt="kitchen cooking steps breakdown interface"
              className="phone-right"
            />
          </div>
        </div>
      </section>

      {/* Food Storyboard Section - Mobile */}
      <section className="flex md:hidden relative py-16 min-h-[700px] items-center">
        <div className="absolute inset-0 z-0">
          <img
            src="/Hero.png"
            alt="beautiful food photography and plating"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/85 via-pink-900/85 to-orange-900/85"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4 text-center">
              Food Storyboard
            </h2>
            <p className="text-lg text-white max-w-2xl mx-auto text-center">
              Share your culinary journey through stunning food photography and stories.
            </p>
          </div>
          
          <div className="flex justify-center items-end gap-4">
            <div className="phone-mockup phone-left animate-on-scroll w-40">
              <div className="phone-screen aspect-[9/19.5]">
                <div className="phone-notch"></div>
                <img
                  src="/images/share1.jpg"
                  alt="food storyboard interface with gallery"
                  className="w-full h-full object-cover"
                />
                <div className="phone-indicator"></div>
              </div>
            </div>
            
            <div className="phone-mockup phone-center animate-on-scroll w-[180px]">
              <div className="phone-screen aspect-[9/19.5]">
                <div className="phone-notch"></div>
                <img
                  src="/images/share2.jpg"
                  alt="food photography story sharing"
                  className="w-full h-full object-cover"
                />
                <div className="phone-indicator"></div>
              </div>
            </div>
            
            <div className="phone-mockup phone-right animate-on-scroll w-40">
              <div className="phone-screen aspect-[9/19.5]">
                <div className="phone-notch"></div>
                <img
                  src="/images/share3.jpg"
                  alt="culinary stories and experiences"
                  className="w-full h-full object-cover"
                />
                <div className="phone-indicator"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Food Storyboard Section - Desktop */}
      <section className="hidden md:block relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/Hero.png"
            alt="colorful flat lay of various dishes"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/85 via-pink-900/85 to-orange-900/85"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 text-center">
              Share Your Food Story
            </h2>
            <p className="text-xl md:text-2xl text-white max-w-3xl mx-auto text-center">
              Capture and share your culinary adventures. Connect with food lovers and inspire others with your food photography.
            </p>
          </div>
          <div className="flex justify-center items-end gap-6 md:gap-12">
            <StaticPhoneMockup 
              image="/images/share1.jpg"
              alt="social media food posts feed"
              className="phone-left"
            />
            <StaticPhoneMockup 
              image="/images/share2.jpg"
              alt="food photography sharing interface"
              className="phone-center -mt-8"
            />
            <StaticPhoneMockup 
              image="/images/share3.jpg"
              alt="food blogger story view"
              className="phone-right"
            />
          </div>
        </div>
      </section>

      {/* Tako AI Section - Mobile */}
      <section className="block md:hidden py-16 bg-gradient-to-b from-primary/10 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Meet Tako, Your AI Food Buddy
            </h2>
            <p className="text-lg text-secondary max-w-2xl mx-auto">
              Chat with Tako for personalized food recommendations, cooking tips, and dietary advice.
            </p>
          </div>
          
          <PhoneFan
            leftImage="/images/tako1.jpg"
            centerImage="/images/tako2.jpg"
            rightImage="/images/tako3.jpg"
            altText="Tako AI Food Buddy"
          />
        </div>
      </section>

      {/* Tako AI Section - Desktop */}
      <section className="hidden md:block py-20 md:py-32 bg-gradient-to-b from-yellow-50 to-orange-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Meet Tako, Your AI Food Buddy
            </h2>
            <p className="text-xl md:text-2xl text-secondary max-w-3xl mx-auto">
              Chat with Tako for personalized food recommendations, cooking tips, dietary advice, and culinary inspiration anytime.
            </p>
          </div>
          <div className="flex justify-center items-end gap-6 md:gap-12">
            <StaticPhoneMockup 
              image="/images/tako1.jpg"
              alt="AI chatbot assistant interface for food recommendations"
              className="phone-left"
            />
            <StaticPhoneMockup 
              image="/images/tako2.jpg"
              alt="mobile chat app conversation with AI"
              className="phone-center -mt-8"
            />
            <StaticPhoneMockup 
              image="/images/tako3.jpg"
              alt="cute octopus mascot Tako character"
              className="phone-right"
            />
          </div>
        </div>
      </section>

      {/* Explore Food Section - Mobile */}
      <section className="block md:hidden py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Explore Food Everywhere
            </h2>
            <p className="text-lg text-secondary max-w-2xl mx-auto">
              Discover new restaurants, explore street food markets, and browse diverse menus.
            </p>
          </div>
          
          <PhoneFan
            leftImage="/images/explore1.jpg"
            centerImage="/images/explore2.jpg"
            rightImage="/images/explore3.jpg"
            altText="Explore Food Everywhere"
          />
          
          <div className="text-center">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-white text-foreground font-bold text-lg rounded-full border-2 border-gray-300 hover:bg-gray-50 transition shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Exploring <i className="fa-solid fa-utensils ml-2"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Explore Food Section - Desktop */}
      <section className="hidden md:block py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Explore Food Everywhere
            </h2>
            <p className="text-xl md:text-2xl text-secondary max-w-3xl mx-auto">
              Discover new restaurants, explore street food markets, and browse diverse menus. Your next culinary adventure awaits.
            </p>
          </div>
          <div className="flex justify-center items-end gap-6 md:gap-12 mb-16">
            <StaticPhoneMockup 
              image="/images/explore1.jpg"
              alt="restaurant food discovery app interface"
              className="phone-left"
            />
            <StaticPhoneMockup 
              image="/images/explore2.jpg"
              alt="street food market exploration app"
              className="phone-center -mt-8"
            />
            <StaticPhoneMockup 
              image="/images/explore3.jpg"
              alt="food menu variety browsing interface"
              className="phone-right"
            />
          </div>
          <div className="text-center mt-16">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-white text-foreground font-bold text-lg rounded-full border-2 border-gray-300 hover:bg-gray-50 transition shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Exploring <i className="fa-solid fa-utensils ml-2"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-4">FUZO</h3>
              <p className="text-gray-400">Your ultimate food discovery companion</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Pin Foods</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Cooking Videos</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Food Stories</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Tako AI</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition text-xl">
                  <i className="fa-brands fa-instagram"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition text-xl">
                  <i className="fa-brands fa-facebook"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition text-xl">
                  <i className="fa-brands fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition text-xl">
                  <i className="fa-brands fa-youtube"></i>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2024 FUZO. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
