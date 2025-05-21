"use client";

import { motion } from "framer-motion";
import {
  Users,
  Heart,
  Check,
  Award,
  Truck,
  ShieldCheck,
  Star,
  Clock,
  Smile,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useLanguage } from "@/lib/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { useInView } from "framer-motion";
import { useRef } from "react";

// Компонент для анимации при скролле
function AnimateOnScroll({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: delay * 0.1 }}
    >
      {children}
    </motion.div>
  );
}

export default function AboutPage() {
  const { language, changeLanguage } = useLanguage();

  // Тексты на разных языках
  const texts = {
    en: {
      title: "About StyleHub",
      subtitle: "Your trusted destination for quality fashion and accessories",
      features: ["Premium Quality", "Sustainable", "Affordable"],
      switchToRu: "Русский",
      switchToEn: "English",

      storyTitle: "Our Story",
      storyP1:
        "Founded in 2015, StyleHub started with a simple mission: to provide high-quality, sustainable fashion that doesn't compromise on style or affordability. What began as a small boutique in downtown has grown into an international brand loved by customers around the world.",
      storyP2:
        "We believe that fashion should be accessible to everyone while maintaining the highest standards of quality and ethical production. Our team of talented designers works tirelessly to create collections that reflect current trends while maintaining timeless appeal.",
      storyP3:
        "Today, StyleHub continues to expand its offerings while staying true to its founding principles of quality, sustainability, and affordability.",

      valuesTitle: "Our Values",
      valuesSubtitle:
        "At StyleHub, our values guide everything we do, from design to delivery.",

      value1Title: "Sustainability",
      value1Text:
        "We're committed to reducing our environmental impact through sustainable materials, ethical production, and eco-friendly packaging.",

      value2Title: "Community",
      value2Text:
        "We believe in building strong relationships with our customers, partners, and the communities where we operate.",

      value3Title: "Quality",
      value3Text:
        "We never compromise on quality, ensuring that every item we sell meets our rigorous standards for durability and craftsmanship.",

      whyChooseTitle: "Why Choose StyleHub",
      whyChooseText:
        "We go beyond just selling clothes – we're creating an experience that puts you first.",

      benefit1Title: "Fast Delivery",
      benefit1Text:
        "Get your order quickly with our expedited shipping options.",

      benefit2Title: "Secure Shopping",
      benefit2Text:
        "Your data is protected with industry-leading security protocols.",

      benefit3Title: "Quality Products",
      benefit3Text:
        "Every item is carefully selected to ensure premium quality.",

      benefit4Title: "24/7 Support",
      benefit4Text: "Our customer service team is always here to help you.",

      teamTitle: "Meet Our Team",
      teamSubtitle:
        "The talented people behind StyleHub who make fashion accessible to everyone.",

      person1Name: "Michael Johnson",
      person1Role: "CEO & Founder",
      person1Text: "Visionary leader with over 15 years in fashion retail.",

      person2Name: "Sarah Chen",
      person2Role: "Design Director",
      person2Text:
        "Award-winning designer with a passion for sustainable fashion.",

      person3Name: "David Garcia",
      person3Role: "Operations Director",
      person3Text: "Logistics expert ensuring smooth delivery of every order.",

      person4Name: "Olivia Wilson",
      person4Role: "Customer Experience",
      person4Text: "Dedicated to creating exceptional shopping experiences.",

      ctaTitle: "Join the StyleHub Community",
      ctaText:
        "Stay updated on our latest collections, exclusive offers, and style inspiration.",
      ctaButton: "Subscribe to Newsletter",
    },
    ru: {
      title: "О StyleHub",
      subtitle: "Ваш надежный магазин качественной одежды и аксессуаров",
      features: ["Премиум качество", "Экологичность", "Доступные цены"],
      switchToRu: "Русский",
      switchToEn: "English",

      storyTitle: "Наша история",
      storyP1:
        "Основанный в 2015 году, StyleHub начал свой путь с простой миссии: предложить высококачественную, экологичную моду, не уступающую в стиле и доступности. То, что начиналось как небольшой бутик в центре города, превратилось в международный бренд, любимый покупателями по всему миру.",
      storyP2:
        "Мы убеждены, что мода должна быть доступна каждому при сохранении высочайших стандартов качества и этичного производства. Наша команда талантливых дизайнеров неустанно работает над созданием коллекций, отражающих современные тенденции и обладающих вневременной привлекательностью.",
      storyP3:
        "Сегодня StyleHub продолжает расширять свой ассортимент, сохраняя верность своим основным принципам: качеству, устойчивому развитию и доступности.",

      valuesTitle: "Наши ценности",
      valuesSubtitle:
        "В StyleHub наши ценности определяют всё, что мы делаем, от дизайна до доставки.",

      value1Title: "Экологичность",
      value1Text:
        "Мы стремимся уменьшить влияние на окружающую среду, используя экологичные материалы, этичное производство и упаковку.",

      value2Title: "Сообщество",
      value2Text:
        "Мы строим прочные отношения с нашими клиентами, партнерами и сообществами, в которых мы работаем.",

      value3Title: "Качество",
      value3Text:
        "Мы никогда не идем на компромисс в качестве, гарантируя, что каждый товар соответствует высоким стандартам прочности и мастерства.",

      whyChooseTitle: "Почему выбирают StyleHub",
      whyChooseText:
        "Мы не просто продаем одежду – мы создаем опыт, в центре которого находитесь вы.",

      benefit1Title: "Быстрая доставка",
      benefit1Text:
        "Получите ваш заказ быстро с нашими ускоренными вариантами доставки.",

      benefit2Title: "Безопасные покупки",
      benefit2Text: "Ваши данные защищены передовыми протоколами безопасности.",

      benefit3Title: "Качественные товары",
      benefit3Text:
        "Каждый товар тщательно отобран для обеспечения премиального качества.",

      benefit4Title: "Поддержка 24/7",
      benefit4Text: "Наша служба поддержки всегда готова помочь вам.",

      teamTitle: "Наша команда",
      teamSubtitle:
        "Талантливые люди, работающие в StyleHub, которые делают моду доступной для всех.",

      person1Name: "Михаил Джонсон",
      person1Role: "CEO и основатель",
      person1Text:
        "Дальновидный лидер с более чем 15-летним опытом в модной индустрии.",

      person2Name: "Сара Чен",
      person2Role: "Директор по дизайну",
      person2Text: "Титулованный дизайнер с страстью к экологичной моде.",

      person3Name: "Давид Гарсия",
      person3Role: "Директор по операциям",
      person3Text:
        "Эксперт по логистике, обеспечивающий бесперебойную доставку каждого заказа.",

      person4Name: "Оливия Вильсон",
      person4Role: "Клиентский опыт",
      person4Text: "Посвятила себя созданию исключительного опыта шоппинга.",

      ctaTitle: "Присоединяйтесь к сообществу StyleHub",
      ctaText:
        "Получайте обновления о наших новейших коллекциях, эксклюзивных предложениях и модном вдохновении.",
      ctaButton: "Подписаться на рассылку",
    },
  };

  // Выбор языка
  const t = texts[language === "ru" ? "ru" : "en"];

  // Анимация для элементов при скролле
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  // Функция переключения языка
  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "ru" : "en");
  };

  return (
    <main className="bg-gradient-to-b from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 min-h-screen">
      {/* Главная секция */}
      <section className="pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute w-full h-full bg-indigo-600/5 dark:bg-indigo-800/10"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto relative z-10">
          {/* Кнопка переключения языка */}
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 border-blue-200 dark:border-blue-800"
            >
              <Globe className="h-4 w-4" />
              {language === "en" ? t.switchToRu : t.switchToEn}
            </Button>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-400 dark:to-indigo-500 text-transparent bg-clip-text mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {t.title}
            </motion.h1>
            <motion.p
              className="text-xl text-gray-600 dark:text-gray-300 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {t.subtitle}
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row justify-center sm:space-x-6 space-y-3 sm:space-y-0 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {t.features.map((feature, index) => (
                <div key={index} className="flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-200">
                    {feature}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Наша история */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <AnimateOnScroll delay={0}>
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                  alt="Our store interior"
                  fill
                  className="object-cover"
                />
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={1}>
              <div className="flex flex-col">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
                  {t.storyTitle}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {t.storyP1}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {t.storyP2}
                </p>
                <p className="text-gray-600 dark:text-gray-300">{t.storyP3}</p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Наши ценности */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-12"
            {...fadeInUp}
          >
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
              {t.valuesTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {t.valuesSubtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimateOnScroll delay={0}>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 shadow-sm border border-blue-100 dark:border-blue-800">
                <div className="bg-blue-100 dark:bg-blue-800/30 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-5">
                  <Heart className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                  {t.value1Title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t.value1Text}
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={1}>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 shadow-sm border border-purple-100 dark:border-purple-800">
                <div className="bg-purple-100 dark:bg-purple-800/30 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-5">
                  <Users className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                  {t.value2Title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t.value2Text}
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={2}>
              <div className="bg-gradient-to-br from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20 rounded-xl p-6 shadow-sm border border-teal-100 dark:border-teal-800">
                <div className="bg-teal-100 dark:bg-teal-800/30 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-5">
                  <Award className="h-7 w-7 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                  {t.value3Title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t.value3Text}
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Почему выбирают нас */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-12"
            {...fadeInUp}
          >
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
              {t.whyChooseTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {t.whyChooseText}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimateOnScroll delay={0}>
              <Card className="bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardContent className="p-6">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    {t.benefit1Title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {t.benefit1Text}
                  </p>
                </CardContent>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll delay={1}>
              <Card className="bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardContent className="p-6">
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    {t.benefit2Title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {t.benefit2Text}
                  </p>
                </CardContent>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll delay={2}>
              <Card className="bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardContent className="p-6">
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    {t.benefit3Title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {t.benefit3Text}
                  </p>
                </CardContent>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll delay={3}>
              <Card className="bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardContent className="p-6">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    {t.benefit4Title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {t.benefit4Text}
                  </p>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Команда */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-12"
            {...fadeInUp}
          >
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
              {t.teamTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{t.teamSubtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimateOnScroll delay={0}>
              <div className="text-center">
                <div className="relative h-64 mb-4 rounded-xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80"
                    alt="CEO"
                    fill
                    className="object-cover"
                    objectPosition="center 30%"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {t.person1Name}
                </h3>
                <p className="text-blue-600 dark:text-blue-400 mb-2">
                  {t.person1Role}
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t.person1Text}
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={1}>
              <div className="text-center">
                <div className="relative h-64 mb-4 rounded-xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=776&q=80"
                    alt="Design Director"
                    fill
                    className="object-cover"
                    objectPosition="center 30%"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {t.person2Name}
                </h3>
                <p className="text-blue-600 dark:text-blue-400 mb-2">
                  {t.person2Role}
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t.person2Text}
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={2}>
              <div className="text-center">
                <div className="relative h-64 mb-4 rounded-xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80"
                    alt="Operations Director"
                    fill
                    className="object-cover"
                    objectPosition="center 30%"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {t.person3Name}
                </h3>
                <p className="text-blue-600 dark:text-blue-400 mb-2">
                  {t.person3Role}
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t.person3Text}
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={3}>
              <div className="text-center">
                <div className="relative h-64 mb-4 rounded-xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1573497019418-b400bb3ab074?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80"
                    alt="Customer Experience Manager"
                    fill
                    className="object-cover"
                    objectPosition="center 30%"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {t.person4Name}
                </h3>
                <p className="text-blue-600 dark:text-blue-400 mb-2">
                  {t.person4Role}
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t.person4Text}
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Присоединяйтесь к нам */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute w-full h-full bg-gradient-to-br from-blue-600/10 to-indigo-600/10 dark:from-blue-800/20 dark:to-indigo-800/20"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <AnimateOnScroll>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-6">
                {t.ctaTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                {t.ctaText}
              </p>
              <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 mx-auto">
                <Smile className="h-5 w-5" />
                <span>{t.ctaButton}</span>
              </button>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  );
}
