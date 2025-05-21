"use client";

import Image from "next/image";
import banner from "/public/banner5.jpg";
import logobg from "/public/logobg.png";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import styles from "../auth-styles.module.css";
import { useAuth } from "@/hooks/useAuth";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  const { forgotPassword, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setIsSubmitted(true);
        toast.success(result.message || "Check your email for a reset link");
      } else {
        toast.error(result.message || "Failed to send reset link");
      }
    } catch (error: any) {
      toast.error(error?.error || "Failed to send reset link");
      console.error(error);
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

      {/* Стеклянный блок */}
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

        <h1 className="text-2xl font-bold text-center text-white mb-3 drop-shadow-md">
          Forgot Password
        </h1>

        {!isSubmitted ? (
          <>
            <p className="text-center text-white mb-6 leading-relaxed max-w-sm mx-auto">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-white/90 text-black hover:bg-white active:scale-[0.96] active:bg-gray-200 active:shadow-inner hover:shadow-lg transition-all duration-300 py-6 font-bold text-lg"
              >
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>

              <p className="text-center text-white mt-4 font-medium drop-shadow-md">
                <Link
                  href="/auth/login"
                  className="text-white/90 font-semibold hover:text-white underline transition-colors hover:scale-105 active:scale-95 inline-block"
                >
                  Back to login page
                </Link>
              </p>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-yellow-700/50 p-4 rounded-lg border border-yellow-700/90 mb-4">
              <p className="text-white font-medium text-lg">
                Check your email inbox
              </p>
              <p className="text-white/80 mt-2">
                We sent a password reset link to{" "}
                <span className="font-semibold text-white">{email}</span>
              </p>
              <p className="text-white/80 mt-4 text-sm">
                If you don't see it, please check your spam folder. The link
                will expire in 1 hour.
              </p>
            </div>
            <Button
              onClick={() => router.push("/auth/login")}
              className="mt-4 bg-white/90 text-black hover:bg-white hover:scale-[1.02] active:scale-[0.98] active:bg-gray-200 active:shadow-inner hover:shadow-lg transition-all duration-300 py-4 px-6 font-bold"
            >
              Back to login page
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
