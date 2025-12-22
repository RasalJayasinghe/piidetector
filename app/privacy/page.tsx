import { Card } from "@/components/ui/card"
import { Shield } from "lucide-react"

export const metadata = {
  title: "Privacy Policy - PII Shield",
  description: "Learn about how PII Shield protects your privacy and handles your data",
}

export default function PrivacyPage() {
  return (
    <div className="container flex flex-col gap-8 py-12 max-w-screen-xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8" />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="flex flex-col gap-6 max-w-3xl">
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Our Privacy Commitment</h2>
            <p className="text-muted-foreground leading-relaxed">
              PII Shield is built with privacy at its core. We believe your personal information should remain private,
              which is why our tool processes everything locally in your browser by default.
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Data Processing</h2>
            <p className="text-muted-foreground leading-relaxed">When you use PII Shield:</p>
            <ul className="text-muted-foreground space-y-2 pl-4">
              <li>• Your content is processed entirely in your browser</li>
              <li>• No content data is sent to our servers</li>
              <li>• No personally identifiable information is collected or stored</li>
              <li>• No tracking cookies or analytics are used</li>
            </ul>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              PII Shield does not use any third-party tracking or analytics services. The application runs entirely in
              your browser without external API calls for content analysis.
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new
              privacy policy on this page and updating the "Last updated" date.
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this privacy policy or our practices, please contact us.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
