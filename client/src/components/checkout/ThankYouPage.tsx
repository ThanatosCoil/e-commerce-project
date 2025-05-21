import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface ThankYouPageProps {
  orderId: string;
  total: number;
}

const ThankYouPage: React.FC<ThankYouPageProps> = ({ orderId, total }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 flex items-center justify-center p-4">
      <Card className="text-center py-12 px-8 shadow-md bg-white/90 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 max-w-md w-full">
        <CardContent className="flex flex-col items-center">
          <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full mb-6">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Thank you for your order!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
            Your order has been successfully placed.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Order number:{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              #{orderId.substring(0, 8).toUpperCase()}
            </span>
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Total:{" "}
            <span className="font-semibold text-green-600 dark:text-green-400">
              ${total.toFixed(2)}
            </span>
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-8">
            <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full animate-pulse"></div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting to order details page...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThankYouPage;
