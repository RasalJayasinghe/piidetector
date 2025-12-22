import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Lock, Eye, Zap } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "About - PII Shield",
  description: "Learn about PII Shield and our mission to protect your privacy",
}

export default function AboutPage() {
  const features = [
    {
      icon: Lock,
      title: "Local Processing",
      description: "All scanning happens in your browser. Your data never leaves your device.",
    },
    {
      icon: Eye,
      title: "No Tracking",
      description: "We don't use analytics, tracking cookies, or collect any personal data.",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Built from the ground up with privacy as the top priority.",
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get immediate feedback on potential PII in your content.",
    },
  ]

  return (
    <div className="container flex flex-col gap-12 py-12 max-w-screen-xl">
      <div className="flex flex-col gap-8 max-w-3xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About PII Shield</h1>
          </div>
        </div>

        <Card className="p-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              In an era of increasing digital surveillance and data breaches, we created PII Shield to help people
              protect their personal information before sharing content online. Too often, sensitive data like phone
              numbers, addresses, or ID numbers accidentally make their way into social media posts, screenshots, or
              shared documents.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              PII Shield provides a simple, privacy-respecting way to scan your content for personally identifiable
              information before you post it. By processing everything locally in your browser, we ensure that your data
              remains truly private.
            </p>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-8">
        <h2 className="text-2xl font-bold tracking-tight">Why PII Shield?</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => (
            <Card key={index} className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-8 bg-muted/30">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Ready to Protect Your Privacy?</h2>
          <p className="text-muted-foreground max-w-2xl">
            Start scanning your content now. No account required, no data collection, completely free.
          </p>
          <Button asChild size="lg">
            <Link href="/scan">Start Scanning</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
