import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

export function HomeBannerCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  const banners = [
    "/banners/banner2.jpeg",
    "/banners/banner3.jpeg",
    "/banners/banner4.jpeg",
    "/banners/banner5.jpeg"
  ];

  return (
    <div className="w-full mb-10">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        opts={{ loop: true }}
      >
        <CarouselContent className="ml-0">
          {banners.map((banner, index) => (
            <CarouselItem key={index} className="pl-0">
              <div className="w-full h-full">
                <Card className="border-0 shadow-none overflow-hidden rounded-none bg-transparent">
                  <CardContent className="flex items-center justify-center p-0">
                    <img 
                      src={banner} 
                      alt={`Banner ${index + 1}`} 
                      className="w-full object-cover max-h-[300px] md:max-h-[500px]"
                      loading="lazy"
                    />
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex left-4 border-2 shadow-lg" />
        <CarouselNext className="hidden md:flex right-4 border-2 shadow-lg" />
      </Carousel>
    </div>
  );
}
