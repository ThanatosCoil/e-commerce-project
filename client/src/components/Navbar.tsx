import { FC, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Search,
  Moon,
  Sun,
  LogOut,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SearchPopover from "./SearchPopover";
import { useGetCartQuery } from "@/store/api/cartSlice";

const Navbar: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isThemeChanging, setIsThemeChanging] = useState(false);
  const [previousTheme, setPreviousTheme] = useState<string | undefined>(
    undefined
  );
  const { logout } = useAuth();
  const router = useRouter();

  // Состояние для показа поиска
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Состояние для определения мобильного вида
  const [isMobile, setIsMobile] = useState(false);
  // Состояние для определения экранов до 1024px
  const [isTablet, setIsTablet] = useState(false);

  // Получаем данные корзины из RTK Query
  const { data: cartItems = [] } = useGetCartQuery();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Чтобы не было несоответствия из за темы
  useEffect(() => {
    setMounted(true);
  }, []);

  // Определение размера экрана
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      // Мобильный вариант: строго меньше 768px
      setIsMobile(width < 768);
      // Планшетный вариант: от 768px включительно до 1024px не включительно
      setIsTablet(width >= 768 && width < 1024);
    };

    // Инициализация при монтировании
    checkScreenSize();

    // Слушатель изменения размера окна
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  function toggleTheme() {
    setPreviousTheme(theme);
    setIsThemeChanging(true);
    setTheme(theme === "dark" ? "light" : "dark");
    // Отключаем анимацию через время
    setTimeout(() => {
      setIsThemeChanging(false);
    }, 1200);
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out");
      // Сначала удаляем куки на клиенте
      document.cookie =
        "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      // Редирект на страницу логина
      router.push("/auth/login");
    } catch (error) {
      toast.error("Error logging out");
      console.error("Logout error:", error);
    }
  };

  // Функция для открытия поиска
  const openSearch = () => {
    setIsSearchOpen(true);
  };

  // Функция для закрытия поиска
  const closeSearch = () => {
    setIsSearchOpen(false);
  };

  // Определяем тип отображения поиска в зависимости от размера экрана
  const getSearchDisplayClass = () => {
    if (isMobile) {
      // Мобильный (<768px) - отображается внизу экрана
      return "fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 shadow-lg border-t border-gray-200 dark:border-gray-800 px-3 py-4";
    } else if (isTablet) {
      // Планшет (≥768px и <1024px) - отображается под навбаром
      return "absolute top-full right-0   px-3 py-4 z-40";
    }
    // Для остальных размеров экрана (≥1024px) поиск отображается в навбаре
    return "";
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-gradient-to-r from-blue-100/70 to-indigo-100/70 dark:from-gray-900/80 dark:to-indigo-950/80 backdrop-blur-md shadow-md"
          : "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 shadow-sm"
      }`}
    >
      <div className="container mx-auto px-3 py-3">
        <div className="flex items-center justify-between">
          {/* Логотип */}
          <div className="flex items-center shrink-0 max-w-[50%] sm:max-w-none">
            <Link href="/" className="flex items-center space-x-1 sm:space-x-2">
              <Image
                src="/logobg.png"
                alt="E-COMMERCE"
                width={36}
                height={36}
                className="dark:invert"
              />
              <span className="font-bold text-lg sm:text-xl truncate dark:text-white">
                E-COMMERCE
              </span>
            </Link>
          </div>

          {/* Десктопная навигация */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/products"
              className="font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative group"
            >
              Products
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/about"
              className="font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative group"
            >
              About
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </nav>

          {/* Поиск, Тема, Корзина и Аккаунт */}
          <div className="flex items-center gap-0.5 xs:gap-2 sm:gap-4">
            {/* Контейнер для поиска */}
            <div className="relative">
              {!isSearchOpen ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="navbar-button w-8 h-8 sm:w-10 sm:h-10 rounded-full text-gray-700 dark:text-gray-200 hover:bg-blue-200/70 dark:hover:bg-indigo-900/50 transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none transition-property-[background-color,transform,color]"
                  onClick={openSearch}
                  aria-label="Search products"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200" />
                </Button>
              ) : (
                // Отображаем поиск в навбаре только для больших экранов (≥1024px)
                !isMobile &&
                !isTablet && (
                  <SearchPopover isOpen={isSearchOpen} onClose={closeSearch} />
                )
              )}
            </div>

            {/* Кнопка переключения темы */}
            {mounted && (
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="icon"
                className={`navbar-button relative w-8 h-8 sm:w-10 sm:h-10 rounded-full text-gray-700 dark:text-gray-200 hover:bg-blue-200/70 dark:hover:bg-indigo-900/50 transition-all duration-300 hover:scale-110 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none transition-property-[background-color,transform,color] ${
                  isThemeChanging
                    ? theme === "dark"
                      ? "bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30"
                      : "bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30"
                    : ""
                }`}
                aria-label="Toggle theme"
              >
                {/* Солнце - появляется или уходит */}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <Sun
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 absolute 
                      ${
                        previousTheme === "dark" && isThemeChanging
                          ? "animate-sun-set"
                          : theme === "dark" && isThemeChanging
                          ? "animate-sun-rise"
                          : theme === "dark"
                          ? "opacity-100"
                          : "opacity-0"
                      }
                    `}
                  />
                </div>

                {/* Луна - появляется или уходит */}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <Moon
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 absolute 
                      ${
                        previousTheme === "light" && isThemeChanging
                          ? "animate-moon-set"
                          : theme === "light" && isThemeChanging
                          ? "animate-moon-rise"
                          : theme === "light"
                          ? "opacity-100"
                          : "opacity-0"
                      }
                    `}
                  />
                </div>
              </Button>
            )}

            <Link
              href="/cart"
              className="navbar-button w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-blue-200/70 dark:hover:bg-indigo-900/50 transition-all duration-300 relative text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 group focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none transition-property-[background-color,transform,color]"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full text-[10px] sm:text-xs">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {/* Профиль с выпадающим меню */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="navbar-button w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-blue-200/70 dark:hover:bg-indigo-900/50 transition-all duration-300 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 group focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none transition-property-[background-color,transform,color]"
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={8}
                className="w-48 xs:w-56 p-2 bg-gradient-to-b from-blue-50/90 to-white/90 dark:from-gray-900 dark:to-indigo-950/70 shadow-lg backdrop-blur-sm rounded-md border dark:border-gray-800 border-blue-100/50 focus:outline-none focus:ring-0 focus-visible:ring-0 outline-none"
              >
                <DropdownMenuItem asChild>
                  <Link
                    href="/account"
                    className="w-full flex items-center py-2 px-3 rounded-md"
                  >
                    <User className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                    <span>Profile Page</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/orders"
                    className="w-full flex items-center py-2 px-3 rounded-md"
                  >
                    <ClipboardList className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                    <span>My Orders</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2 bg-blue-200/50 dark:bg-indigo-800/50" />
                <DropdownMenuItem asChild className="logout-item">
                  <div
                    className="w-full flex items-center py-2 px-3 rounded-md text-red-500 dark:text-red-400"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Logout</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Кнопка мобильного меню */}
            <Button
              variant="ghost"
              size="icon"
              className="navbar-button md:hidden w-8 h-8 sm:w-10 sm:h-10 rounded-full text-gray-700 dark:text-gray-200 hover:bg-blue-100/70 dark:hover:bg-indigo-900/50 transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 group focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none transition-property-[background-color,transform,color]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
              ) : (
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
              )}
            </Button>
          </div>
        </div>

        {/* Мобильное меню */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t mt-3 dark:border-gray-800 border-opacity-30">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/"
                className="font-medium px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-blue-100/60 dark:hover:bg-indigo-900/40 hover:text-blue-700 dark:hover:text-blue-400 transition-all duration-200 cursor-pointer"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/products"
                className="font-medium px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-blue-100/60 dark:hover:bg-indigo-900/40 hover:text-blue-700 dark:hover:text-blue-400 transition-all duration-200 cursor-pointer"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/categories"
                className="font-medium px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-blue-100/60 dark:hover:bg-indigo-900/40 hover:text-blue-700 dark:hover:text-blue-400 transition-all duration-200 cursor-pointer"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
              <Link
                href="/about"
                className="font-medium px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-blue-100/60 dark:hover:bg-indigo-900/40 hover:text-blue-700 dark:hover:text-blue-400 transition-all duration-200 cursor-pointer"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Поисковый интерфейс для мобильных устройств и планшетов */}
      {isSearchOpen && (isMobile || isTablet) && (
        <div className={getSearchDisplayClass()}>
          <SearchPopover
            isOpen={isSearchOpen}
            onClose={closeSearch}
            isMobileView={isMobile}
            isTabletView={isTablet}
          />
        </div>
      )}
    </header>
  );
};

export default Navbar;
