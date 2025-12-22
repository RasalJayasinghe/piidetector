import Link from "next/link"
import { Shield } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container flex flex-col gap-8 py-12 max-w-screen-xl md:flex-row md:justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">PII Shield</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Protect your privacy before sharing on social media. Scan locally in your browser.
          </p>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:gap-12">
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium">Product</h4>
            <Link href="/scan" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Scan Now
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium">Legal</h4>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border/40">
        <div className="container flex h-16 items-center justify-center max-w-screen-xl">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} PII Shield. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
