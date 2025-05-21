"use client";

import Image from "next/image";
import banner from "/public/banner5.jpg";
import logobg from "/public/logobg.png";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import styles from "../auth-styles.module.css";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Компонент-обертка для использования useSearchParams
function ResetPasswordContent() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const { resetPassword, checkResetToken, isLoading } = useAuth();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      validateResetToken(tokenParam);
    } else {
      setIsTokenValid(false);
    }
  }, [searchParams]);

  const validateResetToken = async (token: string) => {
    try {
      const result = await checkResetToken(token);
      setIsTokenValid(result.valid);
      if (!result.valid) {
        toast.error("Invalid or expired reset link");
      }
    } catch (error) {
      console.error(error);
      setIsTokenValid(false);
      toast.error("Invalid or expired reset link");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (!token) {
      toast.error("Reset token is missing");
      return;
    }

    try {
      const result = await resetPassword(token, formData.password);

      if (result.success) {
        toast.success(result.message || "Password changed successfully");
        router.push("/auth/login");
      } else {
        toast.error(result.message || "Failed to reset password");
      }
    } catch (error: any) {
      toast.error(error?.error || "Failed to reset password");
      console.error(error);
    }
  };

  if (isLoading && isTokenValid === null) {
    return (
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={banner}
            alt="Background"
            fill
            priority
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto p-8 backdrop-blur-lg bg-white/30 rounded-xl shadow-2xl border border-white/30">
          <div className="flex justify-center mb-8">
            <Image
              src={logobg}
              alt="Logo"
              width={180}
              height={45}
              className="drop-shadow-lg"
            />
          </div>
          <div className="text-center text-white text-lg">
            Checking reset link...
          </div>
        </div>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={banner}
            alt="Background"
            fill
            priority
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto p-8 backdrop-blur-lg bg-white/30 rounded-xl shadow-2xl border border-white/30">
          <div className="flex justify-center mb-8">
            <Image
              src={logobg}
              alt="Logo"
              width={180}
              height={45}
              className="drop-shadow-lg"
            />
          </div>
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-white">Invalid link</h2>
            <p className="text-white">The reset link is invalid or expired.</p>
            <Button
              onClick={() => router.push("/auth/forgot-password")}
              className="mt-4 bg-white/90 text-black hover:bg-white hover:scale-[1.02] active:scale-[0.98] active:bg-gray-200 active:shadow-inner hover:shadow-lg transition-all duration-300 py-4 px-6 font-bold"
            >
              Request new link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={banner}
          alt="Background"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto p-8 backdrop-blur-lg bg-white/30 rounded-xl shadow-2xl border border-white/30">
        <div className="flex justify-center mb-8">
          <Image
            src={logobg}
            alt="Logo"
            width={180}
            height={45}
            className="drop-shadow-lg"
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-white mb-6 drop-shadow-md">
          Create new password
        </h1>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-gray-800 font-semibold text-lg drop-shadow-md"
            >
              New password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
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
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-gray-800 font-semibold text-lg drop-shadow-md"
            >
              Confirm password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                required
                className={`${styles.input} pr-10`}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${styles.passwordButton} focus:outline-none`}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-white/90 text-black hover:bg-white active:scale-[0.96] active:bg-gray-200 active:shadow-inner hover:shadow-lg transition-all duration-300 py-6 font-bold text-lg"
          >
            {isLoading ? "Processing..." : "Save new password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// Загрузочный компонент для Suspense
function LoadingResetPassword() {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={banner}
          alt="Background"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto p-8 backdrop-blur-lg bg-white/30 rounded-xl shadow-2xl border border-white/30">
        <div className="flex justify-center mb-8">
          <Image
            src={logobg}
            alt="Logo"
            width={180}
            height={45}
            className="drop-shadow-lg"
          />
        </div>
        <div className="text-center text-white text-lg">
          Loading reset password page...
        </div>
      </div>
    </div>
  );
}

// Основной компонент страницы, обернутый в Suspense
function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingResetPassword />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

export default ResetPasswordPage;
