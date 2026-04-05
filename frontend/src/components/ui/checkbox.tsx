"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn("flex h-5 w-5 items-center justify-center rounded-md border border-slate-300 bg-white data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600/10", className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="h-4 w-4 text-blue-600" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}