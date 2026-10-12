"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const sliderData = [
  {
    id: 1,
    title: "Experience Pure Sound - Your Perfect Headphones Awaits!",
    offer: "Limited Time Offer 30% Off",
    cta: "Shop headphones",
    href: "/all-products?category=headphones",
    imgSrc: "/images/hero-headphones.jpg",
    imgAlt: "Over-ear wireless headphones",
  },
  {
    id: 2,
    title: "Next-Level Gaming Starts Here - Discover PlayStation 5 Today!",
    offer: "Only a few left!",
    cta: "Shop gaming",
    href: "/all-products?search=playstation",
    imgSrc: "/images/hero-console.jpg",
    imgAlt: "PlayStation 5 console with controller",
  },
  {
    id: 3,
    title: "Power Meets Elegance - Apple MacBook Pro is Here for you!",
    offer: "Exclusive Deal 40% Off",
    cta: "Shop laptops",
    href: "/all-products?category=laptops",
    imgSrc: "/images/hero-laptop.jpg",
    imgAlt: "Apple MacBook Pro laptop",
  },
];

const controlButton =
  "inline-flex items-center justify-center min-w-11 min-h-11 rounded-full border border-gray-300 bg-white/80 text-gray-700 hover:text-gray-900 hover:border-gray-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2";

const HeaderSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  /* Someone who asked the OS for less motion gets a static first slide they
     page through themselves, never an autoplaying carousel. */
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduceMotion(query.matches);
      if (query.matches) setPlaying(false);
    };

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!playing || reduceMotion) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [playing, reduceMotion]);

  const go = useCallback((delta) => {
    setCurrentSlide((prev) => (prev + delta + sliderData.length) % sliderData.length);
  }, []);

  return (
    <section
      className="relative w-full"
      aria-roledescription="carousel"
      aria-label="Featured offers"
    >
      <div className="overflow-hidden">
        <div
          className={`flex ${reduceMotion ? "" : "transition-transform duration-700 ease-in-out"}`}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {sliderData.map((slide, index) => (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${sliderData.length}`}
              aria-hidden={index !== currentSlide}
              className="flex flex-col-reverse md:flex-row items-center justify-between bg-[#E6E9F2] py-8 md:px-14 px-5 mt-6 rounded-xl min-w-full"
            >
              <div className="md:pl-8 mt-10 md:mt-0">
                <p className="md:text-base text-orange-700 pb-1">{slide.offer}</p>
                <h2 className="max-w-lg md:text-[40px] md:leading-[48px] text-2xl font-semibold">
                  {slide.title}
                </h2>
                <div className="flex items-center mt-4 md:mt-6">
                  <Link
                    href={slide.href}
                    tabIndex={index === currentSlide ? undefined : -1}
                    className="md:px-10 px-7 md:py-2.5 py-2 min-h-11 inline-flex items-center bg-orange-700 rounded-full text-white font-medium hover:bg-orange-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2"
                  >
                    {slide.cta}
                  </Link>
                </div>
              </div>
              <div className="flex items-center flex-1 justify-center">
                <Image
                  className="md:w-72 w-48 rounded-xl shadow-md object-cover aspect-square"
                  src={slide.imgSrc}
                  alt={slide.imgAlt}
                  width={700}
                  height={700}
                  priority={index === 0}
                  loading={index === 0 ? undefined : "lazy"}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-6">
        <button onClick={() => go(-1)} aria-label="Previous slide" className={controlButton}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>

        <div className="flex items-center gap-2 px-2">
          {sliderData.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={currentSlide === index}
              className="min-w-11 min-h-11 grid place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700"
            >
              <span
                className={`h-2 w-2 rounded-full ${currentSlide === index ? "bg-orange-700" : "bg-gray-500/30"}`}
              />
            </button>
          ))}
        </div>

        <button onClick={() => go(1)} aria-label="Next slide" className={controlButton}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>

        {!reduceMotion && (
          <button
            onClick={() => setPlaying((prev) => !prev)}
            aria-label={playing ? "Pause carousel" : "Play carousel"}
            className={`${controlButton} ml-2`}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </section>
  );
};

export default HeaderSlider;
