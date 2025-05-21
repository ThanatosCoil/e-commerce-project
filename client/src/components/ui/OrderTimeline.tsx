import React from "react";
import {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface OrderTimelineProps {
  status: string;
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ status }) => {
  // Если заказ отменен, показываем специальное отображение
  if (status === "CANCELED") {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
          <AlertTriangle className="h-6 w-6 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-1">
          Order Canceled
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          This order has been canceled and will not be processed further.
        </p>
      </div>
    );
  }

  const statuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
  const statusLabels = ["Pending", "Processing", "Shipped", "Delivered"];
  const statusIcons = [
    <Clock key="pending" className="h-5 w-5 text-white" />,
    <Package key="processing" className="h-5 w-5 text-white" />,
    <Truck key="shipped" className="h-5 w-5 text-white" />,
    <CheckCircle2 key="delivered" className="h-5 w-5 text-white" />,
  ];
  const currentIndex = statuses.indexOf(status);
  const isLast = status === "DELIVERED"; // Проверяем, является ли это последним статусом

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center py-2">
        {statuses.map((step, index) => (
          <div
            key={step}
            className={`flex items-center relative ${
              index === statuses.length - 1 ? "flex-[0_0_auto]" : "flex-1"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex-shrink-0 z-10 flex items-center justify-center shadow-sm ${
                index <= currentIndex
                  ? index === currentIndex
                    ? isLast && index === statuses.length - 1
                      ? "bg-green-500 ring-2 ring-green-100 dark:ring-green-900/30" // Последний элемент зеленый
                      : "bg-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30"
                    : "bg-green-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              {statusIcons[index]}
              <span className="sr-only">
                {statusLabels[index]}{" "}
                {index <= currentIndex ? "completed" : "pending"}
              </span>
            </div>
            {index < statuses.length - 1 && (
              <div
                className={`h-1 flex-grow ${
                  index < currentIndex
                    ? "bg-green-500"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-2">
        {statusLabels.map((label, index) => (
          <div
            key={label}
            className={`text-xs font-medium md:ml-1 lg:ml-0 ${
              index === 0
                ? "text-left"
                : index === statusLabels.length - 1
                ? "text-right"
                : "text-center"
            } ${
              index === currentIndex
                ? "text-blue-600 dark:text-blue-400 font-semibold"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTimeline;
