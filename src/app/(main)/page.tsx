import './home-v6.css';
import V6Scripts from '@/components/home-v6/V6Scripts';
import Hero from '@/components/home-v6/Hero';
import TasteProfile from '@/components/home-v6/TasteProfile';
import Discover from '@/components/home-v6/Discover';
import FoodCards from '@/components/home-v6/FoodCards';
import ShareScout from '@/components/home-v6/ShareScout';
import Grow from '@/components/home-v6/Grow';
import TakoChat from '@/components/home-v6/TakoChat';
import Emotional from '@/components/home-v6/Emotional';
import FinalCTA from '@/components/home-v6/FinalCTA';
import HomeFooter from '@/components/home-v6/HomeFooter';

export default function Home() {
  return (
    <div className="v6-page-wrapper v6-page">
      <div id="cur"></div>
      <div id="cur-o"></div>
      <div id="pbar"></div>

      <Hero />
      <TasteProfile />
      <Discover />
      <FoodCards />
      <ShareScout />
      <Grow />
      <TakoChat />
      <Emotional />
      <FinalCTA />
      <HomeFooter />

      <V6Scripts />
    </div>
  );
}
