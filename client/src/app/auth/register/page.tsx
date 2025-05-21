"use client";

import Image from "next/image";
import banner from "/public/banner5.jpg";
import logobg from "/public/logobg.png";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { protectSignupAction } from "@/actions/auth";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import styles from "../auth-styles.module.css";

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const { register, isLoading } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const checkFirstLevelOfValidation = await protectSignupAction(
      formData.email
    );
    if (!checkFirstLevelOfValidation.success) {
      toast.error(checkFirstLevelOfValidation.error);
      return;
    }

    const userId = await register(
      formData.name,
      formData.email,
      formData.password
    );
    if (userId) {
      toast.success("Registration successful");
      router.push(`/auth/login`);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Фоновое изображение на весь экран */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={banner}
          alt="Background"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
        {/* Затемнение фона для лучшей читаемости */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Стеклянный блок регистрации */}
      <div className="relative z-10 w-full max-w-md mx-auto p-8 backdrop-blur-lg bg-white/30 rounded-xl shadow-2xl border border-white/30">
        {/* Логотип */}
        <div className="flex justify-center mb-8">
          <Image
            src={logobg}
            alt="Logo"
            width={180}
            height={45}
            className="drop-shadow-lg"
          />
        </div>

        {/* Форма регистрации */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-gray-800 font-semibold text-lg drop-shadow-md"
            >
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your name"
              required
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-gray-800 font-semibold text-lg drop-shadow-md"
            >
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-gray-800 font-semibold text-lg drop-shadow-md"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`${styles.input} pr-10`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${styles.passwordButton} focus:outline-none`}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-6 bg-white/90 text-black hover:bg-white hover:scale-[1.02] active:scale-[0.98] active:bg-gray-200 active:shadow-inner hover:shadow-lg transition-all duration-300 py-6 font-bold text-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Registering...
              </span>
            ) : (
              "Register"
            )}
          </Button>

          <p className="text-center text-white mt-4 font-medium drop-shadow-md">
            Already registered?{" "}
            <Link
              href="/auth/login"
              className="text-white/90 font-semibold hover:text-white underline transition-colors hover:scale-105 active:scale-95 inline-block"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
