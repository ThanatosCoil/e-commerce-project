import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Star, X, Package } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Review } from "@/types/review";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    review: Omit<Review, "id" | "date" | "userId" | "userName">
  ) => void;
  product: {
    name: string;
    brand: string;
    images?: string[];
  };
  existingReview: Review | null;
}

export default function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  existingReview,
}: ReviewModalProps) {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [mouseDownOnOverlay, setMouseDownOnOverlay] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Refs для текстовых областей
  const prosRef = useRef<HTMLTextAreaElement>(null);
  const consRef = useRef<HTMLTextAreaElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // Функция для автоматического изменения высоты текстовой области
  const adjustTextareaHeight = () => {
    // Адаптивная высота для textarea
    const adjustHeight = (element: HTMLTextAreaElement | null) => {
      if (!element) return;

      element.style.height = "auto";
      element.style.height = `${element.scrollHeight}px`;
      element.style.overflow = element.scrollHeight > 200 ? "auto" : "hidden";
    };

    // Применяем ко всем textarea
    if (prosRef.current) adjustHeight(prosRef.current);
    if (consRef.current) adjustHeight(consRef.current);
    if (commentRef.current) adjustHeight(commentRef.current);
  };

  // Регулировать высоту при изменении содержимого или открытии модального окна
  useEffect(() => {
    if (isOpen) {
      // Используем setTimeout, чтобы дать время для рендеринга
      setTimeout(adjustTextareaHeight, 0);
    }
  }, [pros, cons, comment, isOpen]);

  // Заполняем форму существующим отзывом
  useEffect(() => {
    if (existingReview) {
      setUserRating(existingReview.rating);
      setPros(existingReview.pros);
      setCons(existingReview.cons);
      setComment(existingReview.comment);
      setIsAnonymous(existingReview.isAnonymous);
    } else {
      // Сбрасываем форму при открытии для нового отзыва
      setUserRating(0);
      setPros("");
      setCons("");
      setComment("");
      setIsAnonymous(false);
    }
  }, [existingReview, isOpen]);

  // Обработка отправки формы
  const handleSubmit = () => {
    if (userRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    onSubmit({
      rating: userRating,
      pros,
      cons,
      comment,
      isAnonymous,
    });
  };

  if (!isOpen) return null;

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      setMouseDownOnOverlay(true);
    }
  };

  const handleOverlayMouseUp = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && mouseDownOnOverlay) {
      onClose();
    }
    setMouseDownOnOverlay(false);
  };

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Rate this product
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <Package className="h-8 w-8 text-gray-300 dark:text-gray-600 m-auto" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {product.brand.charAt(0).toUpperCase() + product.brand.slice(1)}
              </p>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {product.name}
              </h3>
            </div>
          </div>

          {/* Звездный рейтинг */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your rating
            </p>
            <div
              className="flex relative gap-0 w-fit"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setUserRating(rating)}
                  onMouseEnter={() => setHoverRating(rating)}
                  className="focus:outline-none p-0.5 relative hover:z-10"
                >
                  <Star
                    className={`h-8 w-8 ${
                      (hoverRating || userRating) >= rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    } transition-colors duration-300`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Плюсы */}
          <div className="mb-4">
            <Label
              htmlFor="pros"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Pros
            </Label>
            <Textarea
              ref={prosRef}
              id="pros"
              placeholder="What did you like about this product?"
              value={pros}
              onChange={(e) => {
                setPros(e.target.value);
                setTimeout(adjustTextareaHeight, 0);
              }}
              className="mt-1 resize-none min-h-[80px] max-h-[150px]"
            />
          </div>

          {/* Минусы */}
          <div className="mb-4">
            <Label
              htmlFor="cons"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Cons
            </Label>
            <Textarea
              ref={consRef}
              id="cons"
              placeholder="What didn't you like about this product?"
              value={cons}
              onChange={(e) => {
                setCons(e.target.value);
                setTimeout(adjustTextareaHeight, 0);
              }}
              className="mt-1 resize-none min-h-[80px] max-h-[150px]"
            />
          </div>

          {/* Комментарий */}
          <div className="mb-6">
            <Label
              htmlFor="comment"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Comment
            </Label>
            <Textarea
              ref={commentRef}
              id="comment"
              placeholder="Share your thoughts about this product..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setTimeout(adjustTextareaHeight, 0);
              }}
              className="mt-1 resize-none min-h-[100px] max-h-[150px]"
            />
          </div>

          {/* Анонимный переключатель */}
          <div className="flex items-center justify-between mb-6">
            <Label
              htmlFor="anonymous-switch"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Post anonymously
            </Label>
            <Switch
              id="anonymous-switch"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>

          {/* Кнопка отправки */}
          <Button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Send Review
          </Button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            By submitting this review, you agree to our terms and conditions
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
