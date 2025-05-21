"use client";

import { useEffect, useState } from "react";
import Banner from "@/components/Banner";
import FeaturedProducts from "@/components/FeaturedProducts";
import NewArrivals from "@/components/NewArrivals";
import {
  useGetFeatureBannersQuery,
  useGetFeaturedProductsQuery,
} from "@/store/api/settingsSlice";
import { useGetLatestProductsQuery } from "@/store/api/apiSlice";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  const { data: banners = [], isLoading: bannersLoading } =
    useGetFeatureBannersQuery();
  const { data: featuredProducts = [], isLoading: productsLoading } =
    useGetFeaturedProductsQuery();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Отслеживаем прокрутку для кнопки "наверх"
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Функция прокрутки наверх
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <main className="min-h-screen bg-blue-50/30 dark:bg-background transition-colors duration-300">
      {/* Секция с баннером */}
      <section className="w-full relative">
        {bannersLoading ? (
          <div className="h-[400px] md:h-[550px] flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
            <div className="animate-spin h-10 w-10 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="relative">
            <Banner banners={banners} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/30 dark:to-background/30 pointer-events-none" />
          </div>
        )}
      </section>

      {/* Секция с предложенными продуктами */}
      <section className="pt-24 pb-16 px-4 relative bg-gradient-to-b from-blue-50/70 via-white to-blue-50/40 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="container mx-auto relative z-10">
          <div className="bg-blue-100/90 dark:bg-blue-900/40 p-8 rounded-xl shadow-md mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center"
            >
              <h2
                className="text-5xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-200
                dark:to-indigo-300"
              >
                Featured Products
              </h2>
              <div className="w-16 h-1 bg-blue-600 dark:bg-blue-400 mx-auto mb-6 rounded-full" />
              <p className="text-center text-gray-700 dark:text-gray-300 mb-2 max-w-2xl mx-auto text-lg">
                Discover our handpicked selection of premium products, curated
                just for you
              </p>
            </motion.div>
          </div>

          {productsLoading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin h-10 w-10 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -top-10 -right-20 w-64 h-64 bg-indigo-100/70 rounded-full blur-3xl dark:hidden"></div>
              <FeaturedProducts products={featuredProducts} />
            </motion.div>
          )}
        </div>
      </section>

      {/* Секция с новыми поступлениями */}
      <section className="pt-16 pb-24 px-4 relative bg-gradient-to-b from-blue-50/40 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto relative z-2">
          <div className="bg-indigo-100 dark:bg-indigo-900/40 p-8 rounded-xl shadow-md mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center"
            >
              <h2 className="text-5xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-700 dark:from-indigo-200 dark:to-blue-300">
                New Arrivals
              </h2>
              <div className="w-16 h-1 bg-indigo-600 dark:bg-indigo-400 mx-auto mb-6 rounded-full" />
              <p className="text-center text-gray-700 dark:text-gray-300 mb-2 max-w-2xl mx-auto text-lg">
                Be the first to explore our latest collection of newly added
                products
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -top-10 -left-20 w-64 h-64 bg-indigo-100/70 rounded-full blur-3xl dark:hidden"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-100/70 rounded-full blur-3xl dark:hidden"></div>

            <NewArrivals products={[]} />

            <div className="flex justify-center mt-10">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/products">
                  <Button className="relative overflow-hidden group px-8 py-5 h-auto text-base font-medium rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 shadow-sm hover:shadow hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-all duration-200">
                    <span className="relative flex items-center justify-center gap-2">
                      Browse All Products
                      <svg
                        className="w-5 h-5 text-blue-500 dark:text-blue-400 transition-transform duration-200 group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </span>
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Секция с подпиской на новости */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-900/40" />
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-200 dark:bg-blue-800/30 rounded-full opacity-50 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-200 dark:bg-indigo-800/30 rounded-full opacity-50 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-40 bg-pink-100/30 dark:bg-pink-900/10 rounded-full rotate-45 opacity-40 blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl mx-auto"
          >
            <div className="backdrop-blur-md bg-white/90 dark:bg-gray-900/80 p-12 rounded-2xl shadow-xl border border-white/40 dark:border-gray-800/50">
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white text-center">
                Stay Updated
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
                Subscribe to our newsletter for the latest products and
                exclusive offers
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-grow outline-none px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-gray-800/90 dark:text-white shadow-sm transition-all duration-200 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md"
                />
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium px-6 h-[50px] shadow-md hover:shadow-lg transition-all duration-200">
                  Subscribe
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Футер */}
      <footer className="bg-gray-50 dark:bg-gray-950 py-12 border-t border-gray-200 dark:border-gray-800/60">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <p className="text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} E-Commerce. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-8">
              <a
                href="#"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Кнопка прокрутки наверх */}
      {showScrollTop && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-5"
        >
          <Button
            onClick={scrollToTop}
            size="icon"
            className="rounded-full shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white p-3 hover:scale-105 transition-transform"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </motion.div>
      )}
    </main>
  );
}
