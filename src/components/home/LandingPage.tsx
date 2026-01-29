import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import { PhoneFan } from './components/PhoneFan';
import { useAuth } from '../auth/AuthProvider';

interface LandingPageProps {
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

export function LandingPage({ onNavigateToSignup }: LandingPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: '/images/h1.png',
      title: 'Explore the World Through Taste.',
      subtitle: 'Discover global cuisines and flavors',
      buttonText: 'Start Exploring',
      buttonColor: '#52B788'
    },
    {
      image: '/images/h2.png',
      title: 'Every Culture Has a Flavor.',
      subtitle: 'Celebrate diversity of global cuisine',
      buttonText: 'Discover Cultures',
      buttonColor: '#E07856'
    },
    {
      image: '/images/h4.png',
      title: 'Your Food World, Curated.',
      subtitle: 'AI-powered recommendations just for you',
      buttonText: 'Get Started',
      buttonColor: '#00BCD4'
    },
    {
      image: '/images/h5.png',
      title: 'Discover What the World Eats.',
      subtitle: 'Uncover hidden culinary gems',
      buttonText: 'Start Discovering',
      buttonColor: '#E07856'
    }
  ];

  const handleGetStarted = () => {
    if (onNavigateToSignup) {
      onNavigateToSignup();
    } else {
      // If user is already authenticated, go directly to plate
      // Otherwise, go to auth page for sign in
      navigate(user ? '/plate' : '/auth');
    }
  };

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Animate phone mockups on scroll for desktop
  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const phones = entry.target.querySelectorAll('.phone-mockup');
          let index = 0;
          for (const phone of phones) {
            setTimeout(() => {
              phone.classList.add('animate');
            }, index * 150);
            index++;
          }
          observer.unobserve(entry.target);
        }
      }
    }, observerOptions);

    // Observe all sections with phone mockups
    const sections = document.querySelectorAll('.new-landing-page section');
    for (const section of sections) {
      observer.observe(section);
    }

    return () => {
      for (const section of sections) {
        observer.unobserve(section);
      }
    };
  }, []);

  return (
    <div className="new-landing-page">
      {/* Header */}
      <header className="fixed w-full top-0 shadow-sm z-50" style={{ backgroundColor: '#fbd556' }}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/logo_mobile.png" alt="FUZO" className="h-10" />
          </div>
          <nav className="hidden md:flex space-x-8"></nav>
          <div className="flex items-center space-x-4">
            <button className="md:hidden focus:outline-none">
              <i className="fa-solid fa-bars text-foreground text-xl"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Carousel Section */}
      <section className="relative h-[600px] md:h-[800px] overflow-hidden mt-0 md:mt-16">
        {/* Slides */}
        <div className="relative w-full h-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 z-20"></div>
            </div>
          ))}
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center container mx-auto px-4 md:px-6">
          <h1 className="text-[48px] font-bold text-white text-center mb-4 drop-shadow-lg">
            {slides[currentSlide].title}
          </h1>
          <p className="text-lg md:text-xl text-white text-center mb-8 drop-shadow-lg max-w-2xl">
            {slides[currentSlide].subtitle}
          </p>
          <button
            onClick={handleGetStarted}
            className="font-bold text-lg px-10 py-4 md:px-12 md:py-5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-white"
            style={{ backgroundColor: slides[currentSlide].buttonColor }}
          >
            {slides[currentSlide].buttonText}
          </button>
        </div>

        {/* Navigation Dots */}
        <div className="absolute bottom-8 left-0 right-0 z-40 flex justify-center gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Pin Food Section */}
      <section className="py-16 md:py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="heading-pin-food font-bold text-foreground mb-4 md:mb-6 text-center">
            Save Everything You Love
            </h2>            
            <p className="body-text-mobile body-text-desktop text-secondary max-w-2xl lg:max-w-3xl mx-auto text-center mb-4">
              Recipes, restaurant dishes, home-cooked ideas.Create your personal food library and never lose that amazing dish again.
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
      <section className="md:hidden relative py-16 min-h-[700px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/cook_bg.jpg"
            alt="professional kitchen cooking scene, chef preparing food"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/60 to-black/70"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="heading-cook-watch-mobile font-bold text-white mb-4 text-center">
            Cook With Confidence
            </h2>           
            <p className="body-text-mobile text-white max-w-2xl mx-auto text-center mb-4">
              Follow step-by-step video recipes and cook along with chefs and creators.            
            </p>
          </div>
          
          <div className="flex justify-center items-end gap-4">
            <div className="phone-mockup phone-left animate-on-scroll w-40">
              <div className="phone-screen aspect-[9/19.5]">
                <div className="phone-notch"></div>
                <img
                  src="/images/cook_1.jpg"
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
            src="/images/cook_bg.jpg"
            alt="professional kitchen with cooking utensils"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gray-900/80"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="heading-cook-watch-desktop font-bold text-white mb-6 text-center">
            Cook With Confidence
            </h2>
          
            <p className="body-text-mobile body-text-desktop text-white max-w-3xl mx-auto text-center mb-4">
              Follow step-by-step video recipes and cook along with chefs and creators. Clear instructions, delicious results - every single time.
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
            src="/images/share_bg.jpg"
            alt="beautiful food photography and plating"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-br from-purple-900/85 via-pink-900/85 to-orange-900/85"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="heading-food-storyboard-mobile font-bold text-white mb-4 text-center">
            Your Food, Your Style
            </h2>        
            <p className="body-text-mobile text-white max-w-2xl mx-auto text-center mb-4">
              Turn meals into memories.
            </p>
            <p className="body-text-mobile text-white max-w-2xl mx-auto text-center">
              Share recipes, photos, and food moments with friends or your foodie community, beautifully and effortlessly.
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
            src="/images/share_bg.jpg"
            alt="colorful flat lay of various dishes"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-br from-purple-900/85 via-pink-900/85 to-orange-900/85"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="heading-food-storyboard-desktop font-bold text-white mb-6 text-center">
            Your Food, Your Style
            </h2>           
            <p className="body-text-mobile body-text-desktop text-white max-w-3xl mx-auto text-center mb-4">
              Turn meals into memories. Share recipes, photos, and food moments with friends or your foodie community, beautifully and effortlessly.
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
      <section className="block md:hidden py-16 bg-linear-to-b from-primary/10 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="heading-tako-mobile font-bold text-foreground mb-4">
              Meet Tako : Your AI Food Buddy
            </h2>           
            <p className="body-text-mobile text-secondary max-w-2xl mx-auto mb-4">
              Ask for recipes, substitutes, meal ideas, or diet-friendly suggestions.
            </p>
            <p className="body-text-mobile text-secondary max-w-2xl mx-auto mb-4">
              Tako learns your taste and gives you spot-on recommendations every time.
            </p>
            <p className="body-text-mobile text-secondary/80 italic max-w-2xl mx-auto">
              "Tako, what can I cook with chicken, garlic, and tomatoes?"
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
      <section className="hidden md:block py-20 md:py-32" style={{ backgroundColor: '#fbd556' }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="heading-tako-desktop font-bold text-foreground mb-6">
              Meet Tako: Your AI Food Buddy
            </h2>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4 text-center">
              Your Smartest Kitchen Companion
            </h3>
            <p className="body-text-mobile body-text-desktop text-secondary max-w-3xl mx-auto mb-4">
              Ask for recipes, substitutes, meal ideas, or diet-friendly suggestions.
            </p>
            <p className="body-text-mobile body-text-desktop text-secondary max-w-3xl mx-auto mb-4">
              Tako learns your taste and gives you spot-on recommendations every time.
            </p>
            <p className="body-text-mobile body-text-desktop text-secondary/80 italic max-w-3xl mx-auto">
              "Tako, what can I cook with chicken, garlic, and tomatoes?"
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
            <h2 className="heading-explore-mobile font-bold text-foreground mb-4">
              Explore Food Everywhere
            </h2>
            <h3 className="text-2xl font-semibold text-foreground mb-3 text-center">
              Discover Great Food Around You
            </h3>
            <p className="body-text-mobile text-secondary max-w-2xl mx-auto">
              Find trending dishes, nearby restaurants, hidden gems, and local favorites.
            </p>
            <p className="body-text-mobile text-secondary max-w-2xl mx-auto">
              Plan your next meal with real photos, honest ratings, and smart recommendations.
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
              className="px-8 py-4 font-bold text-lg rounded-full transition shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              EXPLORE <i className="fa-solid fa-utensils ml-2"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Explore Food Section - Desktop */}
      <section className="hidden md:block py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="heading-explore-desktop font-bold text-foreground mb-6">
              Explore Food Everywhere
            </h2>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4 text-center">
              Discover Great Food Around You
            </h3>
            <p className="body-text-mobile body-text-desktop text-secondary max-w-3xl mx-auto mb-4">
              Find trending dishes, nearby restaurants, hidden gems, and local favorites.
            </p>
            <p className="body-text-mobile body-text-desktop text-secondary max-w-3xl mx-auto">
              Plan your next meal with real photos, honest ratings, and smart recommendations.
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
              className="px-8 py-4 font-bold text-lg rounded-full transition shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              EXPLORE <i className="fa-solid fa-utensils ml-2"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <img src="/logo_white.png" alt="FUZO" className="h-8 mb-4" />
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
            <p>© 2024 <img src="/logo_white.png" alt="FUZO" className="h-4 inline" />. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
