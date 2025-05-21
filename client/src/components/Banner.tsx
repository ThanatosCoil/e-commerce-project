import { FC, useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FeatureBanner } from "@/store/api/settingsSlice";

interface BannerProps {
  banners: FeatureBanner[];
}

const Banner: FC<BannerProps> = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, currentIndex]);

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[400px] md:h-[550px] overflow-hidden group">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${
            index === currentIndex
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105 pointer-events-none"
          }`}
        >
          {/* Затемнение для текста */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent dark:from-black/70 z-10"></div>

          <Image
            src={banner.imageUrl}
            alt={"Banner"}
            fill
            priority
            quality={90}
            className="object-cover transition-transform duration-10000 group-hover:scale-105"
          />
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 dark:bg-gray-800/30 dark:hover:bg-gray-800/50 text-gray-800 dark:text-gray-200 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 dark:bg-gray-800/30 dark:hover:bg-gray-800/50 text-gray-800 dark:text-gray-200 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md"
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-white w-8"
                    : "bg-white/60 hover:bg-white/80"
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Banner;
