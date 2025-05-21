"use client";

import Image from "next/image";
import banner from "/public/banner5.jpg";
import logobg from "/public/logobg.png";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { protectLoginAction } from "@/actions/auth";
import styles from "../auth-styles.module.css";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, isLoading, user } = useAuth();
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
    setLoginFailed(false);

    const checkFirstLevelOfValidation = await protectLoginAction(
      formData.email
    );
    if (!checkFirstLevelOfValidation.success) {
      toast.error(checkFirstLevelOfValidation.error);
      return;
    }

    const success = await login(formData.email, formData.password, rememberMe);
    if (success) {
      toast.success("Login successful");
      if (user?.role === "SUPER_ADMIN") {
        router.push(`/super-admin`);
      } else {
        router.push(`/home`);
      }
    } else {
      setLoginFailed(true);
      toast.error("Invalid email or password");
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
        <form className="space-y-5" onSubmit={handleSubmit}>
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
              className={styles.input}
              value={formData.email}
              onChange={handleChange}
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
                className={`${styles.input} pr-10`}
                value={formData.password}
                onChange={handleChange}
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
            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center space-x-2 group">
                <div className={styles.checkboxContainer}>
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked === true)
                    }
                    className={styles.checkbox}
                  />
                </div>
                <label htmlFor="rememberMe" className={styles.checkboxLabel}>
                  Keep me logged in
                </label>
              </div>
              <Link
                href="/auth/forgot-password"
                className={`text-sm font-medium transition-all duration-200 hover:underline focus:outline-none ${
                  loginFailed
                    ? "text-yellow-300 underline font-extrabold hover:text-yellow-400"
                    : "text-white/80 hover:text-white focus:text-white"
                }`}
              >
                {loginFailed ? "Forgot your password?" : "Forgot Password?"}
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-6 text-black transition-all duration-300 py-6 font-bold text-lg relative ${
              isLoading
                ? "bg-white/70 cursor-not-allowed"
                : "bg-white/90 hover:bg-white active:scale-[0.96] active:bg-gray-200 active:shadow-inner hover:shadow-lg"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Logging in...</span>
              </div>
            ) : (
              "Login"
            )}
          </Button>

          <p className="text-center text-white mt-4 font-medium drop-shadow-md">
            Not registered?{" "}
            <Link
              href="/auth/register"
              className="text-white/90 font-semibold hover:text-white underline transition-colors hover:scale-105 active:scale-95 inline-block"
            >
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
