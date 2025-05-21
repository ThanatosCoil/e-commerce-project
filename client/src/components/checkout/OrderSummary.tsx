import Image from "next/image";
import { CartItem } from "@/store/api/cartSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Ticket, Trash2 } from "lucide-react";
import { getColorName } from "@/constants/product";
import Link from "next/link";

interface OrderSummaryProps {
  cartItems: CartItem[];
  total: number;
  couponCode: string;
  setCouponCode: (code: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon?: () => void;
  appliedCoupon: {
    valid: boolean;
    discount: number;
    message: string;
    code: string;
  } | null;
}

const OrderSummary = ({
  cartItems,
  total,
  couponCode,
  setCouponCode,
  onApplyCoupon,
  onRemoveCoupon,
  appliedCoupon,
}: OrderSummaryProps) => {
  // Рассчитываем общую сумму без скидок
  const totalWithoutDiscount = cartItems.reduce((sum, item) => {
    const price = item.price || 0;
    return sum + price * item.quantity;
  }, 0);

  // Рассчитываем общую сумму со скидками на товары, но без скидки купона
  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.price || 0;
    const itemDiscount = item.discount || 0;

    // Проверяем, хранится ли скидка как дробное число (0-1) или как процент (0-100)
    const discountMultiplier =
      itemDiscount > 1 ? itemDiscount / 100 : itemDiscount;
    const discountedPrice = itemPrice * (1 - discountMultiplier);

    return sum + discountedPrice * item.quantity;
  }, 0);

  // Скидка на товары (разница между полной ценой и ценой со скидками на товары)
  const itemsDiscountAmount = totalWithoutDiscount - subtotal;

  // Скидка по купону
  const couponDiscountAmount = appliedCoupon?.valid
    ? subtotal *
      (appliedCoupon.discount > 1
        ? appliedCoupon.discount / 100
        : appliedCoupon.discount)
    : 0;

  return (
    <div>
      <div className="max-h-80 overflow-y-auto mb-4">
        {cartItems.map((item) => {
          const itemPrice = item.price || 0;
          const itemDiscount = item.discount || 0;
          const discountMultiplier =
            itemDiscount > 1 ? itemDiscount / 100 : itemDiscount;
          const discountedPrice = itemPrice * (1 - discountMultiplier);

          return (
            <div
              key={item.id}
              className="py-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/30"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 w-16 h-16 relative">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      style={{ objectFit: "contain" }}
                      className="rounded bg-gray-100 dark:bg-gray-800 p-1"
                    />
                  )}
                </div>
                <div className="ml-3 flex-grow">
                  <Link
                    href={`/products/${item.productId}`}
                    className="font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {item.size && `Size: ${item.size}`}
                    {item.size && item.color && " | "}
                    {item.color && `Color: ${getColorName(item.color)}`}
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Quantity: {item.quantity}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Price:{" "}
                        {discountMultiplier > 0 ? (
                          <>
                            <span className="line-through">
                              ${itemPrice.toFixed(2)}
                            </span>{" "}
                            ${discountedPrice.toFixed(2)}
                          </>
                        ) : (
                          <>${itemPrice.toFixed(2)}</>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {discountMultiplier > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                            ${(itemPrice * item.quantity).toFixed(2)}
                          </span>
                          <span className="font-medium text-lg text-gray-900 dark:text-gray-100">
                            ${(discountedPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium text-lg text-gray-900 dark:text-gray-100">
                          ${(itemPrice * item.quantity).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Код купона */}
      <div className="mb-4">
        {!appliedCoupon?.valid ? (
          <>
            <label
              htmlFor="coupon-code"
              className="text-sm font-medium mb-1.5 block text-gray-700 dark:text-gray-300"
            >
              Have a coupon?
            </label>
            <div className="flex gap-2">
              <Input
                id="coupon-code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1"
              />
              <Button
                onClick={onApplyCoupon}
                disabled={!couponCode.trim()}
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Apply
              </Button>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
            <div className="flex items-center">
              <Ticket className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {appliedCoupon.code}: {appliedCoupon.discount}% off
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1"
              onClick={onRemoveCoupon}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        {appliedCoupon && !appliedCoupon.valid && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400">
            {appliedCoupon.message}
          </div>
        )}
      </div>

      {/* Разбивка цены */}
      <div className="space-y-1 text-sm border-t pt-3 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">
            Original price
          </span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">
            ${totalWithoutDiscount.toFixed(2)}
          </span>
        </div>

        {itemsDiscountAmount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Product discount
            </span>
            <span className="text-red-600 dark:text-red-400 font-medium">
              -${itemsDiscountAmount.toFixed(2)}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">
            ${subtotal.toFixed(2)}
          </span>
        </div>

        {appliedCoupon?.valid && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Coupon discount
            </span>
            <span className="text-red-600 dark:text-red-400 font-medium">
              -${couponDiscountAmount.toFixed(2)}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Shipping</span>
          <span className="text-green-600 dark:text-green-400 font-medium">
            Free
          </span>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-2 flex justify-between items-center">
          <span className="text-gray-900 dark:text-gray-100 font-bold text-lg">
            Total
          </span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
