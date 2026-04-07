import * as React from 'react';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Card } from '@/components/ui/card';

const bannerImages = [
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83g7symugk5d.jpg',
    alt: 'Food Delivery Services - Get groceries, meals, and more delivered instantly',
    title: 'Instant Food Delivery',
    description: 'From groceries to gourmet meals, get everything delivered to your doorstep'
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83g831oj6txc.jpg',
    alt: 'Community Celebration - Join our growing community of helpers and seekers',
    title: 'Join Our Community',
    description: 'Be part of a vibrant community helping each other every day'
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83g8eg2ymlfk.jpg',
    alt: 'Tech Services - Get help with coding, design, and digital tasks',
    title: 'Tech & Digital Services',
    description: 'Find experts for web development, design, and technical assistance'
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83g8mrznq8e9.jpg',
    alt: 'Ideas & Collaboration - Turn your ideas into reality with instant help',
    title: 'Ideas to Reality',
    description: 'Collaborate with skilled helpers to bring your projects to life'
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83gjzfa3k1kw.jpg',
    alt: 'Package Delivery - Reliable delivery service for all your needs',
    title: 'Reliable Package Delivery',
    description: 'Get your packages delivered safely and on time with trusted helpers'
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83gkkgxysetc.jpg',
    alt: 'Professional Services - Quality service with ratings and reviews',
    title: 'Trusted Professional Services',
    description: 'Connect with verified professionals and rate your experience'
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83gl4793cc8w.jpg',
    alt: 'Learning & Education - Get help with tutoring and educational tasks',
    title: 'Learning & Education Support',
    description: 'Find tutors and educational helpers for all subjects and levels'
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83glsr6xt9ts.jpg',
    alt: 'Post New Task - Easy task posting with Bondhu',
    title: 'Post Your Task Today',
    description: 'Quick and easy task posting to find the perfect helper instantly'
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83gmhqx16gw0.png',
    alt: 'Join the Family - Become part of the Bondhu community',
    title: 'Join the Bondhu Family',
    description: 'Start early and become a valued member of our growing community'
  },
];

export default function HeroBanner() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    api.on('select', () => {
      setCurrentIndex(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 4000,
            stopOnInteraction: true,
          }),
        ]}
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent>
          {bannerImages.map((image, index) => (
            <CarouselItem key={index}>
              <Card className="border-0 overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="relative aspect-[21/9] xl:aspect-[21/7] w-full overflow-hidden rounded-lg">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover object-center"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 xl:p-8 text-white">
                    <h3 className="text-2xl xl:text-3xl font-bold mb-2 drop-shadow-lg">
                      {image.title}
                    </h3>
                    <p className="text-sm xl:text-base text-white/90 drop-shadow-md max-w-2xl">
                      {image.description}
                    </p>
                  </div>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 xl:left-6 bg-white/90 hover:bg-white border-0 shadow-lg" />
        <CarouselNext className="right-4 xl:right-6 bg-white/90 hover:bg-white border-0 shadow-lg" />
      </Carousel>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {bannerImages.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-primary'
                : 'w-2 bg-muted hover:bg-muted-foreground/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
