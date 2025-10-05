"use client";

import { useState } from "react";
import Image from "next/image";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FeatureItem {
  id: number;
  title: string;
  image: string;
  description: string;
}

interface CuisineSectionProps {
  features?: FeatureItem[];
}

const defaultFeatures: FeatureItem[] = [
  {
    id: 1,
    title: "Street Food",
    image: "/images/landing/Images/categories/streetfood.png",
    description:
      "Late-night legends & hawker icons.",
  },
  {
    id: 2,
    title: "Fine Dining",
    image: "/images/landing/Images/categories/fine-dining.png",
    description:
      "Tasting menus worth dressing up for.",
  },
  {
    id: 3,
    title: "Pastry",
    image: "/images/landing/Images/categories/pastry.png",
    description:
      "Flaky, buttery, photogenic joy.",
  },
  {
    id: 4,
    title: "Healthy",
    image: "/images/landing/Images/categories/Healthy.png",
    description:
      "Bowls, salads, smart swaps.",
  },
  {
    id: 5,
    title: "BBQ",
    image: "/images/landing/Images/categories/BBQ.png",
    description:
      "Smoke, char and slow-cooked bliss.",
  },
   {
    id: 6,
    title: "Vegan",
    image: "/images/landing/Images/categories/vegan.png",
    description:
      "Bold flavors, zero compromise.",
  },
  {
    id: 7,
    title: "Sushi",
    image: "/images/landing/Images/categories/Sushi.png",
    description:
      "Omakase and immaculate cuts.",
  },
];

const CuisineSection = ({ features = defaultFeatures }: CuisineSectionProps) => {
  const [activeTabId, setActiveTabId] = useState<number | null>(1);
  const [activeImage, setActiveImage] = useState(features[0].image);

  return (
    <section className="py-32">
      <div className="container mx-auto">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            The World on your Plate
          </h2>
        </div>
        <div className="mb-12 flex w-full items-start justify-between gap-12">
          <div className="w-full md:w-1/2">
            <Accordion type="single" className="w-full" defaultValue="item-1">
              {features.map((tab) => (
                <AccordionItem key={tab.id} value={`item-${tab.id}`}>
                  <AccordionTrigger
                    onClick={() => {
                      setActiveImage(tab.image);
                      setActiveTabId(tab.id);
                    }}
                    className="cursor-pointer py-5 no-underline! transition"
                  >
                    <h6
                      className={`text-xl font-semibold ${tab.id === activeTabId ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {tab.title}
                    </h6>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mt-3 text-muted-foreground">
                      {tab.description}
                    </p>
                    <div className="mt-4 md:hidden">
                      <Image
                        src={tab.image}
                        alt={tab.title}
                        className="h-full max-h-80 w-full rounded-md object-cover"
                        width={320}
                        height={320}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div className="relative m-auto hidden w-[400px] h-[400px] overflow-hidden rounded-xl bg-muted md:block">
            <Image
              src={activeImage}
              alt="Feature preview"
              className="aspect-square rounded-xl object-cover w-full h-full"
              width={400}
              height={400}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CuisineSection;
