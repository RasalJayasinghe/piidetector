"use client"

import Link from "next/link"
import { Shield } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Shield className="h-6 w-6" />
          <span className="text-lg">PII Shield</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground/80"
          >
            Privacy
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground/80"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  )
}
