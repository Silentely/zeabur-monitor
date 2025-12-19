import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export function Dialog({ open, onOpenChange, title, children, className }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className={cn(
          "relative w-full max-w-lg rounded-xl bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200", 
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
