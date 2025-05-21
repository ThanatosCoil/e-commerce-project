"use client";

import { Provider } from "react-redux";
import { store } from "@/store/store";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={true}
        disableTransitionOnChange
        enableColorScheme={false}
      >
        {children}
      </ThemeProvider>
    </Provider>
  );
}
