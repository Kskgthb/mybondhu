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
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 mb-4">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        opts={{ loop: true }}
      >
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={index}>
              <div className="p-2 md:p-4">
                <Card className="border-2 border-primary/10 shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-500 overflow-hidden rounded-3xl bg-white/50 backdrop-blur-sm cursor-pointer group">
                  <CardContent className="flex items-center justify-center p-0">
                    <img 
                      src={banner} 
                      alt={`Banner ${index + 1}`} 
                      className="w-full object-cover max-h-[250px] sm:max-h-[350px] md:max-h-[450px] group-hover:scale-[1.02] transition-transform duration-700 rounded-3xl"
                      loading="lazy"
                    />
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4 md:-left-12 border-2 border-primary/20 shadow-lg hover:bg-primary hover:text-white hover:border-primary transition-all bg-white/80 backdrop-blur-sm" />
        <CarouselNext className="hidden md:flex -right-4 md:-right-12 border-2 border-primary/20 shadow-lg hover:bg-primary hover:text-white hover:border-primary transition-all bg-white/80 backdrop-blur-sm" />
      </Carousel>
    </div>
  );
}
