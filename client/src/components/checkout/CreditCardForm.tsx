import { useState, useEffect, useCallback } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCreatePaymentIntentMutation } from "@/store/api/orderSlice";
import { Loader2, CreditCard, Check } from "lucide-react";
import { debounce } from "lodash";
import { protectCreditCardForm } from "@/actions/payment";

interface CreditCardFormProps {
  amount: number;
  onPaymentMethodReady: (paymentMethodId: string | null) => void;
  onPaymentError: (error: string) => void;
  onValidationStart: () => void;
  onValidationEnd: () => void;
}

const CreditCardForm = ({
  amount,
  onPaymentMethodReady,
  onPaymentError,
  onValidationStart,
  onValidationEnd,
}: CreditCardFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [createPaymentIntent] = useCreatePaymentIntentMutation();

  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  // Получаем платежный намерение при изменении суммы
  useEffect(() => {
    const getPaymentIntent = async () => {
      if (amount <= 0) return;

      try {
        const response = await createPaymentIntent({ amount }).unwrap();
        setClientSecret(response.clientSecret);
      } catch (err) {
        console.error("Error creating payment intent:", err);
        onPaymentError("Failed to initialize payment. Please try again later.");
      }
    };

    if (amount > 0) {
      getPaymentIntent();
    }
  }, [amount, createPaymentIntent, onPaymentError]);

  const handleChange = (event: any) => {
    setError(event.error ? event.error.message : null);
    setIsComplete(event.complete);

    if (isValidated) {
      setIsValidated(false);
      onPaymentMethodReady(null);
    }
  };

  // Создаем функцию для проверки карты с помощью debounce
  const debouncedValidateCard = useCallback(
    debounce(async () => {
      if (!stripe || !elements || !isComplete) {
        return;
      }

      onValidationStart(); // Уведомляем родительский компонент о начале проверки
      setProcessing(true);

      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        setError("An error occurred processing your payment.");
        setProcessing(false);
        onValidationEnd(); // Уведомляем об окончании проверки
        onPaymentMethodReady(null);
        return;
      }

      try {
        // Добавляем проверку через Arcjet перед валидацией карты
        const securityCheck = await protectCreditCardForm();

        if (!securityCheck.success) {
          setError(
            securityCheck.error ||
              "Card validation blocked for security reasons"
          );
          onPaymentError(
            securityCheck.error ||
              "Card validation blocked for security reasons"
          );
          setIsValidated(false);
          onPaymentMethodReady(null);
          setProcessing(false);
          onValidationEnd();
          return;
        }

        // Если проверка Arcjet прошла успешно, продолжаем с валидацией карты
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
        });

        if (error) {
          setError(error.message || "Error creating payment method");
          onPaymentError(error.message || "Error creating payment method");
          setIsValidated(false);
          onPaymentMethodReady(null);
        } else if (paymentMethod) {
          setIsValidated(true);
          setError(null);
          onPaymentMethodReady(paymentMethod.id);
        }
      } catch (err) {
        console.error("Error processing payment:", err);
        setError("An error occurred processing your payment.");
        onPaymentError("An error occurred processing your payment.");
        setIsValidated(false);
        onPaymentMethodReady(null);
      }

      setProcessing(false);
      onValidationEnd(); // Уведомляем об окончании проверки
    }, 500),
    [
      stripe,
      elements,
      isComplete,
      onPaymentMethodReady,
      onPaymentError,
      onValidationStart,
      onValidationEnd,
    ]
  );

  // Функция для обработки события onBlur
  const handleBlur = () => {
    if (isComplete && !processing) {
      debouncedValidateCard();
    }
  };

  return (
    <div>
      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-2">
          <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Card Details
          </label>
        </div>
        <div className="border border-gray-300 dark:border-gray-600 p-3 rounded-md bg-white dark:bg-gray-900/30 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 shadow-sm">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: document.documentElement.classList.contains("dark")
                    ? "#f3f4f6"
                    : "#424770",
                  fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                  "::placeholder": {
                    color: document.documentElement.classList.contains("dark")
                      ? "#9ca3af"
                      : "#aab7c4",
                  },
                  ":-webkit-autofill": {
                    color: "#fce883",
                  },
                },
                invalid: {
                  color: "#e53e3e",
                  iconColor: "#e53e3e",
                },
              },
              hidePostalCode: true,
            }}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        {processing && (
          <div className="mt-2 flex items-center text-sm text-blue-600 dark:text-blue-400">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Validating card...
          </div>
        )}
        {isValidated && !error && (
          <div className="mt-2 flex items-center text-sm text-green-600 dark:text-green-400">
            <Check className="h-4 w-4 mr-2" />
            Card verified successfully
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-1 text-green-500 dark:text-green-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        Your card information is secured with SSL encryption.
      </div>
    </div>
  );
};

export default CreditCardForm;
