import { TrendingUp, Users, Zap } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { PersonalizedGreeting } from "@/components/auth/PersonalizedGreeting";

const Hero = () => {
  return (
    <section className="h-full w-screen overflow-hidden py-32 relative bg-gradient-to-br from-orange-50 via-blue-50 to-orange-100">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage: 'url(/images/landing/Images/hero_image.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center'
        }}
      />
      
      {/* Content */}
      <div className="container border-b border-t border-dashed relative z-10">
        <div className="relative flex w-full max-w-5xl flex-col justify-start border border-t-0 border-dashed px-5 py-12 md:items-center md:justify-center lg:mx-auto">
          <p className="text-white flex items-center gap-2 text-sm">
            <span className="inline-block size-2 rounded bg-green-500" />
            WELCOME TO FUZO
          </p>
          <div className="mb-7 mt-3 w-full max-w-xl text-5xl font-semibold tracking-tighter md:mb-10 md:text-center md:text-6xl lg:relative lg:mb-0 lg:text-center lg:text-7xl">
            <h1 className="text-white relative z-10 block mb-4">
              A Smarter Way to <br className="block md:hidden" /> Discover
            </h1>
            <div className="flex justify-center">
              <ContainerTextFlip
                className="text-primary text-4xl font-semibold tracking-tighter md:text-5xl lg:text-7xl"
                words={["Food", "Restaurants", "Recipes", "Yourself"]}
              />
            </div>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center border border-b-0 border-t-0 border-dashed py-20">
          <div className="w-full max-w-2xl space-y-5 md:text-center">
            <p className="text-white px-5 lg:text-lg">
              Seven food-specialist AIs scan top cities to surface unmissable restaurants and recipes—from hawker legends to omakase gems. Pin what you love.
            </p>
            <Link href="/auth/signin" className="mx-5">
              <Button className="h-12 rounded-lg w-full">Get Started Now</Button>
            </Link>
          </div>
        </div>
        <ul className="md:h-34 mx-auto grid h-44 w-full max-w-5xl grid-cols-1 border border-b-0 border-dashed md:grid-cols-2 lg:h-24 lg:grid-cols-3">
          <li className="flex h-full items-center justify-between gap-10 px-5 md:gap-3 lg:justify-center">
            <div className="bg-muted flex size-12 items-center justify-center rounded-lg">
              <Zap className="text-muted-foreground size-6" />
            </div>
            <p className="text-white text-lg">
              AI Recommendations
            </p>
          </li>
          <li className="flex h-full items-center justify-between gap-10 border-l border-t border-dashed px-5 md:gap-3 lg:justify-center lg:border-t-0">
            <div className="bg-muted flex size-12 items-center justify-center rounded-lg">
              <Users className="text-muted-foreground size-6" />
            </div>
            <p className="text-white text-lg">AI Powered Chat</p>
          </li>
          <li className="col-span-1 flex h-full items-center justify-between gap-10 border-l border-t border-dashed px-5 md:col-span-2 md:justify-center md:gap-3 lg:col-span-1 lg:border-t-0">
            <div className="bg-muted flex size-12 items-center justify-center rounded-lg">
              <TrendingUp className="text-muted-foreground size-6" />
            </div>
            <p className="text-white text-lg">
              Tailor Made For You
            </p>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default Hero;
