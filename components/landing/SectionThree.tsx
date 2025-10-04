import { ArrowDownRight } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";

interface Hero3Props {
  heading?: string;
  description?: string;
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

const SectionThree = ({
  heading = "Explore near & far",
  description = "Lunch around the corner or a weekend crawl across town—find the right spot, right now. Save, navigate and go.",
  buttons = {
    primary: {
      text: "Sign Up",
      url: "/auth/signup",
    },   
  },
}: Hero3Props) => {
  return (
    <section className="py-20 lg:py-32">
      <div className="container grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
        {/* Image on the left */}
        <div className="flex relative order-2 lg:order-1">
          <Image
            src="/images/landing/Images/hero_image.png"
            alt="placeholder hero"
            width={600}
            height={800}
            className="max-h-[600px] w-full rounded-md object-cover lg:max-h-[800px]"
          />
        </div>
        
        {/* Text and button on the right */}
        <div className="mx-auto flex flex-col items-center text-center order-1 lg:order-2 md:mr-auto lg:max-w-3xl lg:items-start lg:text-left">
          <h1 className="my-6 text-pretty text-4xl font-bold lg:text-6xl xl:text-7xl">
            {heading}
          </h1>
          <p className="text-muted-foreground mb-8 max-w-xl lg:text-xl">
            {description}
          </p>
          <div className="flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start">
            {buttons.primary && (
              <Button asChild className="w-full sm:w-auto">
                <a href={buttons.primary.url}>{buttons.primary.text}</a>
              </Button>
            )}
            {buttons.secondary && (
              <Button asChild variant="outline">
                <a href={buttons.secondary.url}>
                  {buttons.secondary.text}
                  <ArrowDownRight className="size-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionThree;