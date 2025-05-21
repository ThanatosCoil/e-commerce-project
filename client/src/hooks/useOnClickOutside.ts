import { useEffect, RefObject } from "react";

type Handler = (event: MouseEvent | TouchEvent) => void;

export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: Handler,
  mouseEvent: "mousedown" | "mouseup" = "mousedown"
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;

      // Не делаем ничего, если клик был внутри элемента
      if (!el || el.contains((event.target as Node) || null)) {
        return;
      }

      handler(event);
    };

    // Добавляем обработчики событий
    document.addEventListener(mouseEvent, listener);
    document.addEventListener("touchstart", listener);

    return () => {
      // Удаляем обработчики событий
      document.removeEventListener(mouseEvent, listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler, mouseEvent]);
}
