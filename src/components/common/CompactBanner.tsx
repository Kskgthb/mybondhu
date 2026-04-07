import { useEffect, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Card } from '@/components/ui/card';

const bannerImages = [
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83g7symugk5d.jpg',
    alt: 'Food Delivery Services',
    title: 'Instant Food Delivery',
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83g831oj6txc.jpg',
    alt: 'Community Celebration',
    title: 'Join Our Community',
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83g8eg2ymlfk.jpg',
    alt: 'Tech Services',
    title: 'Tech & Digital Services',
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83g8mrznq8e9.jpg',
    alt: 'Ideas & Collaboration',
    title: 'Ideas to Reality',
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83gjzfa3k1kw.jpg',
    alt: 'Package Delivery',
    title: 'Reliable Package Delivery',
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83gkkgxysetc.jpg',
    alt: 'Professional Services',
    title: 'Trusted Professional Services',
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83gl4793cc8w.jpg',
    alt: 'Learning & Education',
    title: 'Learning & Education Support',
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83glsr6xt9ts.jpg',
    alt: 'Post New Task',
    title: 'Post Your Task Today',
  },
  {
    url: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251208/file-83gmhqx16gw0.png',
    alt: 'Join the Family',
    title: 'Join the Bondhu Family',
  },
];

export default function CompactBanner() {
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    api.on('select', () => {
      setCurrentIndex(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="w-full mb-6">
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 5000,
            stopOnInteraction: false,
          }),
        ]}
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent>
          {bannerImages.map((image, index) => (
            <CarouselItem key={index}>
              <Card className="border-0 overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="relative aspect-[16/5] w-full overflow-hidden rounded-lg">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover object-center"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h4 className="text-lg xl:text-xl font-semibold drop-shadow-lg">
                      {image.title}
                    </h4>
                  </div>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-3">
        {bannerImages.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex
                ? 'w-6 bg-primary'
                : 'w-1.5 bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
