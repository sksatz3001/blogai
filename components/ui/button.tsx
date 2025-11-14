import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#88C0D0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2E3440] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB] text-[#2E3440] hover:from-[#88C0D0]/90 hover:to-[#8FBCBB]/90 shadow-lg hover:shadow-xl hover:shadow-[#88C0D0]/20",
        destructive:
          "bg-gradient-to-r from-[#BF616A] to-[#D08770] text-[#ECEFF4] hover:from-[#BF616A]/90 hover:to-[#D08770]/90 shadow-lg",
        outline:
          "border-2 border-[#88C0D0]/30 bg-transparent text-[#88C0D0] hover:bg-[#88C0D0]/10 hover:border-[#88C0D0]/50",
        secondary:
          "bg-gradient-to-r from-[#D08770] to-[#EBCB8B] text-[#2E3440] hover:from-[#D08770]/90 hover:to-[#EBCB8B]/90 shadow-lg",
        ghost: "text-[#D8DEE9] hover:bg-[#3B4252] hover:text-[#88C0D0]",
        link: "text-[#88C0D0] underline-offset-4 hover:underline hover:text-[#D08770]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
