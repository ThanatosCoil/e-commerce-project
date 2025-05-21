type PaymentMethod = "CREDIT_CARD" | "CASH_ON_DELIVERY";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

const PaymentMethodSelector = ({
  selectedMethod,
  onSelectMethod,
}: PaymentMethodSelectorProps) => {
  return (
    <div className="space-y-3">
      <div
        className={`border p-4 rounded-md cursor-pointer flex items-center transition-colors duration-200 ${
          selectedMethod === "CREDIT_CARD"
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700"
            : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/30"
        }`}
        onClick={() => onSelectMethod("CREDIT_CARD")}
      >
        <div className="relative h-4 w-4 flex items-center justify-center">
          <input
            type="radio"
            id="cc-payment"
            name="payment-method"
            checked={selectedMethod === "CREDIT_CARD"}
            onChange={() => onSelectMethod("CREDIT_CARD")}
            className="sr-only"
          />
          <div className="absolute h-4 w-4 rounded-full border border-gray-400 dark:border-gray-600"></div>
          {selectedMethod === "CREDIT_CARD" && (
            <div className="absolute h-2 w-2 rounded-full bg-blue-600"></div>
          )}
        </div>

        <label htmlFor="cc-payment" className="ml-3 cursor-pointer flex-grow">
          <div className="font-medium text-gray-800 dark:text-gray-200">
            Credit Card
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Pay securely with your card
          </div>
        </label>
        <div className="flex space-x-2">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 h-8 w-12 rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">MC</span>
          </div>
        </div>
      </div>

      <div
        className={`border p-4 rounded-md cursor-pointer flex items-center transition-colors duration-200 ${
          selectedMethod === "CASH_ON_DELIVERY"
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700"
            : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/30"
        }`}
        onClick={() => onSelectMethod("CASH_ON_DELIVERY")}
      >
        <div className="relative h-4 w-4 flex items-center justify-center">
          <input
            type="radio"
            id="cod-payment"
            name="payment-method"
            checked={selectedMethod === "CASH_ON_DELIVERY"}
            onChange={() => onSelectMethod("CASH_ON_DELIVERY")}
            className="sr-only"
          />
          <div className="absolute h-4 w-4 rounded-full border border-gray-400 dark:border-gray-600"></div>
          {selectedMethod === "CASH_ON_DELIVERY" && (
            <div className="absolute h-2 w-2 rounded-full bg-blue-600"></div>
          )}
        </div>

        <label htmlFor="cod-payment" className="ml-3 cursor-pointer">
          <div className="font-medium text-gray-800 dark:text-gray-200">
            Cash on Delivery
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Pay when you receive the order
          </div>
        </label>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
