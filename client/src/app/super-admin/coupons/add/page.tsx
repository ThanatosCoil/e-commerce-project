"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateCouponMutation } from "@/store/api/couponsSlice";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { protectCreateCouponAction } from "@/actions/coupon";
import { Ticket } from "lucide-react";

function AddCouponPage() {
  const router = useRouter();
  const [createCoupon, { isLoading }] = useCreateCouponMutation();
  const [rippleEffect, setRippleEffect] = useState({
    active: false,
    x: 0,
    y: 0,
  });

  const [formData, setFormData] = useState({
    code: "",
    discount: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateRandomCode = (e: React.MouseEvent) => {
    // Создаем эффект волны при нажатии
    const button = e.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setRippleEffect({ active: true, x, y });
    setTimeout(() => setRippleEffect({ active: false, x: 0, y: 0 }), 500);

    // Генерируем код
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    setFormData((prev) => ({ ...prev, code: result }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация данных
    if (!formData.code) {
      toast.error("Please enter coupon code");
      return;
    }

    if (
      !formData.discount ||
      isNaN(Number(formData.discount)) ||
      Number(formData.discount) <= 0
    ) {
      toast.error("Please enter a valid discount value");
      return;
    }

    if (!formData.startDate) {
      toast.error("Please select start date");
      return;
    }

    if (!formData.endDate) {
      toast.error("Please select end date");
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    if (
      !formData.usageLimit ||
      isNaN(Number(formData.usageLimit)) ||
      Number(formData.usageLimit) <= 0
    ) {
      toast.error("Please enter a valid usage limit");
      return;
    }

    // Проверяем купон на чувствительную информацию перед созданием
    const { error, success } = await protectCreateCouponAction({
      code: formData.code,
    });

    if (!success) {
      toast.error(error);
      return;
    }

    try {
      // Подготовка данных для отправки
      const couponData = {
        code: formData.code,
        discount: Number(formData.discount),
        startDate: formData.startDate,
        endDate: formData.endDate,
        usageLimit: Number(formData.usageLimit),
      };

      // Отправка данных
      await createCoupon(couponData).unwrap();

      // Уведомление об успешном создании
      toast.success("Coupon created successfully!", {
        description: "Your coupon has been added to the system",
      });

      // Перенаправление на список купонов
      router.push("/super-admin/coupons/list");
    } catch (error) {
      // Обработка ошибок
      toast.error("Failed to create coupon", {
        description: "Please try again later",
      });
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="overflow-hidden shadow-2xl dark:shadow-gray-800/20 pt-0 gap-0 dark:border-gray-800">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-6">
          <h1 className="text-2xl font-bold text-white">Add New Coupon</h1>
          <p className="text-blue-100 mt-2">
            Fill in the details to create a new discount coupon
          </p>
        </div>

        <CardContent className="p-6 dark:bg-gray-800/30">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            {/* Информация о купоне */}
            <div>
              <Label className="text-base font-medium underline dark:text-gray-200">
                Coupon Information
              </Label>
              <div className="mt-3 space-y-4">
                {/* Код купона */}
                <div>
                  <Label
                    htmlFor="code"
                    className="text-sm text-gray-600 dark:text-gray-300"
                  >
                    Coupon Code
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="Enter coupon code (e.g. SUMMER20)"
                      className="flex-1 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
                      required
                    />
                    <Button
                      type="button"
                      onClick={generateRandomCode}
                      className="relative overflow-hidden text-white bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-700 dark:to-blue-800 hover:from-indigo-700 hover:to-blue-700 
                      dark:hover:from-indigo-800 dark:hover:to-blue-900 active:from-indigo-800 active:to-blue-800 active:scale-[0.98] active:shadow-inner
                      transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      {rippleEffect.active && (
                        <span
                          className="absolute animate-ripple rounded-full bg-white/30"
                          style={{
                            left: rippleEffect.x + "px",
                            top: rippleEffect.y + "px",
                            transform: "translate(-50%, -50%)",
                          }}
                        />
                      )}
                      Generate Code
                    </Button>
                  </div>
                </div>

                {/* Скидка */}
                <div>
                  <Label
                    htmlFor="discount"
                    className="text-sm text-gray-600 dark:text-gray-300"
                  >
                    Discount (%)
                  </Label>
                  <Input
                    id="discount"
                    name="discount"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discount}
                    onChange={handleInputChange}
                    placeholder="Enter discount percentage"
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
                    required
                  />
                </div>

                {/* Дата начала */}
                <div>
                  <Label
                    htmlFor="startDate"
                    className="text-sm text-gray-600 dark:text-gray-300"
                  >
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
                    required
                  />
                </div>

                {/* Дата окончания */}
                <div>
                  <Label
                    htmlFor="endDate"
                    className="text-sm text-gray-600 dark:text-gray-300"
                  >
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
                    required
                  />
                </div>

                {/* Лимит использования */}
                <div>
                  <Label
                    htmlFor="usageLimit"
                    className="text-sm text-gray-600 dark:text-gray-300"
                  >
                    Usage Limit
                  </Label>
                  <Input
                    id="usageLimit"
                    name="usageLimit"
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    placeholder="Enter maximum number of uses"
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Кнопка отправки */}
            <div className="pt-4">
              <Button
                type="submit"
                className={`w-full mx-auto md:min-w-[200px] lg:min-w-[240px] font-medium text-base py-6 rounded-xl
                  bg-gradient-to-r ${
                    formData.code === "" ||
                    formData.discount === "" ||
                    formData.startDate === "" ||
                    formData.endDate === "" ||
                    formData.usageLimit === ""
                      ? "from-gray-400 to-gray-500 dark:from-gray-700 dark:to-gray-800 cursor-not-allowed"
                      : "from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 active:from-blue-800 active:to-indigo-800 active:scale-[0.98]"
                  }
                  transition-all duration-300 shadow-md hover:shadow-lg h-auto flex items-center justify-center dark:text-white`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating Coupon...
                  </>
                ) : (
                  <>
                    <Ticket className="h-5 w-5 mr-2" />
                    Create Coupon
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default AddCouponPage;
