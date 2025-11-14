import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border-2 border-[#434C5E] bg-[#3B4252] px-4 py-2 text-sm text-[#ECEFF4] ring-offset-[#2E3440] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#ECEFF4] placeholder:text-[#4C566A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#88C0D0] focus-visible:ring-offset-2 focus-visible:border-[#88C0D0] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
