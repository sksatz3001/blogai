import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#88C0D0] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB] text-[#2E3440] hover:from-[#88C0D0]/90 hover:to-[#8FBCBB]/90 shadow-md",
        secondary:
          "border-transparent bg-gradient-to-r from-[#D08770] to-[#EBCB8B] text-[#2E3440] hover:from-[#D08770]/90 hover:to-[#EBCB8B]/90 shadow-md",
        destructive:
          "border-transparent bg-[#BF616A] text-[#ECEFF4] hover:bg-[#BF616A]/80 shadow-md",
        outline: "border-[#88C0D0] text-[#88C0D0] hover:bg-[#88C0D0]/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
