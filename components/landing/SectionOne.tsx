import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { PhoneFan } from "./PhoneFan";

interface Hero47Props {
  heading?: string;
  subheading?: string;
  description?: string;
  image?: {
    src: string;
    alt: string;
  };
  buttons?: {
    primary?: {
      text: string;
      url: string;
    };
    secondary?: {
      text: string;
      url: string;
    };
  };
}

const SectionOne = ({
  heading = "Custom Picks",
  subheading = " built with you in mind",
  description = "Our 7 AI connoisseurs curate personalized food recommendations based on your taste preferences and dining history.",
  buttons = {
    primary: {
      text: "Get Started",
      url: "#",
    }    
  },
  image = {
    src: "/images/landing/Images/feed_image.png",
    alt: "FUZO App Preview",
  },
}: Hero47Props) => {
  return (
    <section className="bg-background py-20 lg:py-32">
      <div className="container flex flex-col items-center gap-10 lg:my-0 lg:flex-row">
        <div className="flex flex-col gap-7 lg:w-2/3">
          <h2 className="text-5xl font-semibold text-foreground md:text-5xl lg:text-8xl">
            <span>{heading}</span>
            <span className="text-muted-foreground">{subheading}</span>
          </h2>
          <p className="text-base text-muted-foreground md:text-lg lg:text-xl">
            {description}
          </p>
          <div className="flex flex-wrap items-start gap-5 lg:gap-7">
            <Button asChild>
              <a href={buttons.primary?.url}>
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="size-4" />
                </div>
                <span className="pr-6 pl-4 text-sm whitespace-nowrap lg:pr-8 lg:pl-6 lg:text-base">
                  {buttons.primary?.text}
                </span>
              </a>
            </Button>
            <Button asChild variant="link" className="underline">
              <a href={buttons.secondary?.url}>{buttons.secondary?.text}</a>
            </Button>
          </div>
        </div>
        <div className="relative z-10">
          <div className="relative h-[500px] w-[450px]">
            {/* Center phone - static positioning */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative aspect-[9/19.5] w-64 rounded-[2rem] border-[10px] border-zinc-900 bg-black overflow-hidden">
                {/* Notch */}
                <div className="absolute left-1/2 top-0 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-900" />
                {/* Screen */}
                <Image
                  alt="FUZO App Preview"
                  src="/images/landing/Images/feed_image.png"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
                {/* Side buttons */}
                <div className="absolute left-0 top-16 h-10 w-1 rounded-r bg-zinc-800/80" />
                <div className="absolute right-0 top-24 h-16 w-1 rounded-l bg-zinc-800/80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionOne;
