import './home.css';
import V6Scripts from '@/components/home/V6Scripts';
import Hero from '@/components/home/Hero';
import TasteProfile from '@/components/home/TasteProfile';
import Discover from '@/components/home/Discover';
import FoodCards from '@/components/home/FoodCards';
import ShareScout from '@/components/home/ShareScout';
import Grow from '@/components/home/Grow';
import TakoChat from '@/components/home/TakoChat';
import Emotional from '@/components/home/Emotional';
import FinalCTA from '@/components/home/FinalCTA';
import HomeFooter from '@/components/home/HomeFooter';

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
