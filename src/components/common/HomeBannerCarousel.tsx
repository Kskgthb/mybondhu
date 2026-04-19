import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

export function HomeBannerCarousel() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  
  // Use a stable reference for the plugin
  const autoplayRef = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  const banners = [
    "/banners/banner2.jpeg",
    "/banners/banner3.jpeg",
    "/banners/banner4.jpeg",
    "/banners/banner5.jpeg"
  ];

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 mb-4 relative group carousel-container">
      <style>{`
        @keyframes fillProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .progress-bar {
          animation: fillProgress 4s linear forwards;
          background-color: #6411ac;
        }
        .carousel-container:hover .progress-bar {
          animation-play-state: paused;
        }
      `}</style>
      <Carousel
        setApi={setApi}
        plugins={[autoplayRef.current]}
        className="w-full"
        onMouseEnter={() => autoplayRef.current.stop()}
        onMouseLeave={() => autoplayRef.current.reset()}
        opts={{ loop: true }}
      >
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={index}>
              <div className="p-2 md:p-4">
                <Card className="border-2 border-primary/10 shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-500 overflow-hidden rounded-3xl bg-white/50 backdrop-blur-sm cursor-pointer banner-card">
                  <CardContent className="flex items-center justify-center p-0">
                    <img 
                      src={banner} 
                      alt={`Banner ${index + 1}`} 
                      className="w-full object-cover max-h-[250px] sm:max-h-[350px] md:max-h-[450px] hover:scale-[1.02] transition-transform duration-700 rounded-3xl"
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

      <div className="flex justify-center items-center gap-2 mt-4 pb-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`h-2 rounded-full transition-all duration-500 relative overflow-hidden ${
              current === index ? "w-10 bg-gray-200" : "w-4 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          >
            {current === index && (
              <div className="absolute top-0 left-0 h-full rounded-full progress-bar" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
