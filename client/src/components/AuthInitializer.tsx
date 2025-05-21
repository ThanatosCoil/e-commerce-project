"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useGetMeQuery } from "@/store/api/authSlice";
import { setUser } from "@/store/slices/authSlice";

/**
 * Компонент для инициализации состояния пользователя при загрузке приложения
 * Проверяет, авторизован ли пользователь и загружает его данные в Redux
 */
export default function AuthInitializer() {
  const dispatch = useDispatch();
  const { data: user, isSuccess } = useGetMeQuery();

  useEffect(() => {
    // Если запрос выполнился успешно и информация о пользователе получена,
    // записываем ее в Redux store
    if (isSuccess && user) {
      dispatch(setUser(user));
    }
  }, [isSuccess, user, dispatch]);

  // Компонент ничего не рендерит в UI
  return null;
}
