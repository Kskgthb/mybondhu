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
    <div className="w-full max-w-5xl mx-auto mb-10 px-4 md:px-6">
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
              <div className="p-1">
                <Card className="border-0 shadow-lg overflow-hidden rounded-2xl">
                  <CardContent className="flex items-center justify-center p-0">
                    <img 
                      src={banner} 
                      alt={`Banner ${index + 1}`} 
                      className="w-full max-h-[300px] md:max-h-[400px] object-cover"
                      loading="lazy"
                    />
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex left-2" />
        <CarouselNext className="hidden md:flex right-2" />
      </Carousel>
    </div>
  );
}
