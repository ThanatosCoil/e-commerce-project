"use client";

import * as React from "react";
import { IMaskMixin } from "react-imask";
import { Input } from "@/components/ui/input";

// Создаем миксин для Input компонента
const MaskedInput = IMaskMixin(
  ({
    inputRef,
    ...props
  }: { inputRef: React.Ref<HTMLInputElement> } & React.ComponentProps<
    typeof Input
  >) => <Input {...props} ref={inputRef as any} />
);

export { MaskedInput };
