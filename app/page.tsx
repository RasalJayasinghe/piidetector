"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { BoundingBoxOverlay } from "@/components/bounding-box-overlay"
import { scanImage, type PIIDetection } from "@/lib/pii-scanner"
import {
  Upload,
  FileImage,
  Download,
  Trash2,
  AlertTriangle,
  Info,
  CreditCard,
  Award as IdCard,
  MapPin,
  Phone,
  Mail,
  Car,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react"

type ScanStep = "Preprocessing" | "OCR" | "Visual Detection" | "Classification"

function getCategoryIcon(category: string) {
  switch (category) {
    case "Credit Card": return CreditCard
    case "ID Card": return IdCard
    case "Address": return MapPin
    case "Phone": return Phone
    case "Email": return Mail
    case "License Plate": return Car
    default: return Info
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "Credit Card": return "bg-yellow-100 text-yellow-800"
    case "ID Card": return "bg-blue-100 text-blue-800"
    case "Address": return "bg-green-100 text-green-800"
    case "Phone": return "bg-purple-100 text-purple-800"
    case "Email": return "bg-pink-100 text-pink-800"
    case "License Plate": return "bg-gray-100 text-gray-800"
    default: return "bg-muted text-muted-foreground"
  }
}

function getRiskColor(risk: string) {
  switch (risk) {
    case "High": return "bg-red-100 text-red-800"
    case "Medium": return "bg-orange-100 text-orange-800"
    case "Low": return "bg-green-100 text-green-800"
    default: return "bg-muted text-muted-foreground"
  }
}

export default function ScanPage() {
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<ScanStep | null>(null)
  const [detections, setDetections] = useState<PIIDetection[]>([])
  const [isLocalScan, setIsLocalScan] = useState(true)
  const [countdown, setCountdown] = useState(300)
  const [isDragging, setIsDragging] = useState(false)
  const [showHighlights, setShowHighlights] = useState(true)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const detectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!image) return
    setCountdown(300)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearImage()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [image])

  const handleFileChange = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB")
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
        setImageFile(file)
        setFileName(file.name)
        setDetections([])
        setHighlightedId(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileChange(file)
    },
    [handleFileChange],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const runScan = async () => {
    if (!imageFile) return
    setIsScanning(true)
    setDetections([])
    const steps: ScanStep[] = ["Preprocessing", "OCR", "Visual Detection", "Classification"]
    try {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i])
        setScanProgress(((i + 1) / steps.length) * 100)
        if (i === 1) {
          const result = await scanImage(imageFile)
          setDetections(Array.isArray(result.detections) ? result.detections : [])
        } else {
          await new Promise((resolve) => setTimeout(resolve, 800))
        }
      }
      setCurrentStep(null)
    } catch (error) {
      console.error("Scan error:", error)
      alert("Scan failed. Please try again.")
    } finally {
      setIsScanning(false)
    }
  }

  const clearImage = useCallback(() => {
    setImage(null)
    setImageFile(null)
    setFileName("")
    setDetections([])
    setScanProgress(0)
    setCurrentStep(null)
    setHighlightedId(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const handleBoxClick = (id: string) => {
    setHighlightedId(id)
    const element = detectionRefs.current[id]
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }

  const handleDetectionHover = (id: string | null) => {
    setHighlightedId(id)
  }

  // Top detection and risk logic
  const topDetection = detections.length
    ? detections.reduce((max, det) => det.confidence > max.confidence ? det : max, detections[0])
    : null
  const overallRisk =
    detections.length === 0
      ? null
      : detections.some((d) => d.risk === "High")
        ? "High"
        : detections.some((d) => d.risk === "Medium")
          ? "Medium"
          : "Low"
  const categoryCounts = detections.reduce(
    (acc, det) => {
      acc[det.category] = (acc[det.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col gap-4 sm:gap-6 min-w-0">
            {/* Upload Area */}
            {!image ? (
              <Card
                className={`p-8 sm:p-12 border-2 border-dashed transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
                  <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">Upload an Image</h2>
                    <p className="text-sm text-muted-foreground max-w-md">Drag and drop an image here, or click to browse</p>
                    <p className="text-xs text-muted-foreground">Supports JPG, PNG, WebP up to 10MB</p>
                  </div>
                  <Button size="lg" onClick={() => fileInputRef.current?.click()} className="mt-2">
                    <FileImage className="mr-2 h-5 w-5" />
                    <span>Choose File</span>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                    className="hidden"
                  />
                </div>
              </Card>
            ) : (
              <>
                {/* Single Preview Image with Overlays, Border/Shadow, and Highlighted Detections */}
                <div className="mb-2 text-center text-xs font-semibold text-muted-foreground">Preview Image</div>
                <Card className="overflow-hidden shadow-lg border-2 border-gray-200">
                  <div className="relative bg-muted/30 w-full flex items-center justify-center min-h-[300px] max-h-[70vh]">
                    {/* Only one image is rendered here, overlays are absolutely positioned on top */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={image || "/placeholder.svg"}
                        alt="Preview content"
                        className="w-full h-auto max-h-[70vh] object-contain rounded-lg border border-gray-300 shadow-md"
                        id="preview-image"
                      />
                      {/* Overlay bounding boxes if detections exist and highlights are enabled */}
                      {image && detections.length > 0 && showHighlights && (
                        <BoundingBoxOverlay
                          imageUrl={image}
                          boxes={detections.map((d) => ({
                            id: d.id,
                            box: d.boundingBox,
                            category: d.category,
                            risk: d.risk,
                            color: d.risk === "High" ? "#ef4444" : d.risk === "Medium" ? "#f59e42" : "#22c55e",
                            tooltip: `${d.category} (${Math.round(d.confidence * 100)}%) - ${d.risk} risk`,
                          }))}
                          highlightedId={highlightedId}
                          showHighlights={showHighlights}
                          onBoxClick={handleBoxClick}
                        />
                      )}
                    </div>
                    {/* Show detection count badge */}
                    {detections.length > 0 && (
                      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-3 py-1.5 rounded-md text-sm font-medium z-10 shadow-md border border-gray-200">
                        {detections.length} detection{detections.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </Card>
                <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t bg-card">
                  <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
                    <FileImage className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{fileName}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {detections.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setShowHighlights(!showHighlights)} className="flex-1 sm:flex-initial">
                        {showHighlights ? (
                          <><EyeOff className="mr-2 h-4 w-4" />Hide</>
                        ) : (
                          <><Eye className="mr-2 h-4 w-4" />Show</>
                        )}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={clearImage} className="flex-1 sm:flex-initial">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </div>
                {/* Category Legend */}
                {detections.length > 0 && (
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold mb-3">Category Legend</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(categoryCounts).map((category) => {
                        const Icon = getCategoryIcon(category)
                        return (
                          <Badge key={category} variant="outline" className={getCategoryColor(category)}>
                            <Icon className="h-3 w-3 mr-1" />
                            {category}
                          </Badge>
                        )
                      })}
                    </div>
                  </Card>
                )}
                {/* Scan Controls */}
                <Card className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Switch id="local-scan" checked={isLocalScan} onCheckedChange={setIsLocalScan} />
                        <label htmlFor="local-scan" className="text-sm font-medium cursor-pointer">Run scan locally (recommended)</label>
                      </div>
                      {!isLocalScan && (
                        <Badge variant="outline" className="text-xs w-fit">Faster / Heavier models</Badge>
                      )}
                    </div>
                    {isScanning ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{currentStep}</span>
                          <span className="text-muted-foreground">{Math.round(scanProgress)}%</span>
                        </div>
                        <Progress value={scanProgress} className="h-2" />
                      </div>
                    ) : (
                      <Button onClick={runScan} size="lg" className="w-full" disabled={!image}>Scan Image</Button>
                    )}
                    {detections.length > 0 && (
                      <div className="flex flex-col gap-3 pt-4 border-t">
                        <h3 className="text-sm font-semibold">Actions</h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />Download Redacted
                          </Button>
                          <Button variant="outline" size="sm" onClick={clearImage}>
                            <Trash2 className="mr-2 h-4 w-4" />Delete Now
                          </Button>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground cursor-pointer">Auto-delete after 5 minutes</label>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}
            {/* Empty State Info */}
            {!image && (
              <Card className="p-4 sm:p-6 bg-muted/20 border-muted">
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Info className="h-4 w-4" />What happens next?
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex gap-2"><span className="text-muted-foreground/50">1.</span><span>Upload an image containing text or visual elements</span></li>
                    <li className="flex gap-2"><span className="text-muted-foreground/50">2.</span><span>Our AI scans for PII through OCR and visual detection</span></li>
                    <li className="flex gap-2"><span className="text-muted-foreground/50">3.</span><span>Review detections with risk levels and recommendations</span></li>
                    <li className="flex gap-2"><span className="text-muted-foreground/50">4.</span><span>Download a redacted version or delete sensitive content</span></li>
                  </ul>
                </div>
              </Card>
            )}
          </div>
          {/* Results Sidebar */}
          {detections.length > 0 && (
            <div className="w-full lg:w-96 lg:shrink-0 flex flex-col gap-4 sm:gap-6">
              {/* Summary Card - Only Top Detection */}
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-semibold">Scan Results</h2>
                    {overallRisk && <Badge className={getRiskColor(overallRisk)}>{overallRisk} Risk</Badge>}
                  </div>
                  {topDetection && (
                    <div className="flex flex-col gap-2 pt-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Top Detection</h3>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(topDetection.category) && (
                          <span className="inline-flex items-center gap-1">
                            {React.createElement(getCategoryIcon(topDetection.category), { className: "h-4 w-4 text-muted-foreground" })}
                            <span className="font-medium">{topDetection.category}</span>
                          </span>
                        )}
                        <Badge variant="outline" className={`text-xs ${getRiskColor(topDetection.risk)}`}>{topDetection.risk}</Badge>
                        <span className="text-xs text-muted-foreground">{Math.round(topDetection.confidence * 100)}% confident</span>
                      </div>
                      {topDetection.text && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">Detected text:</span>
                          <code className="text-xs bg-muted px-2 py-1 rounded break-all">{topDetection.text}</code>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-xs">
                        <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{topDetection.recommendation}</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
              {/* Detections List */}
              <Card className="p-4 sm:p-6">
                <h3 className="text-sm font-semibold mb-4">Detections</h3>
                <Accordion type="single" collapsible className="w-full">
                  {detections.map((detection) => {
                    const Icon = getCategoryIcon(detection.category)
                    return (
                      <AccordionItem
                        key={detection.id}
                        value={detection.id}
                        ref={(el) => { detectionRefs.current[detection.id] = el }}
                        onMouseEnter={() => handleDetectionHover(detection.id)}
                        onMouseLeave={() => handleDetectionHover(null)}
                        className={`transition-colors ${highlightedId === detection.id ? "bg-accent/50" : ""}`}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex flex-col gap-1 min-w-0">
                              <span className="text-sm font-medium">{detection.category}</span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={`text-xs ${getRiskColor(detection.risk)}`}>{detection.risk}</Badge>
                                <span className="text-xs text-muted-foreground">{Math.round(detection.confidence * 100)}% confident</span>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col gap-3 pt-2 pl-7">
                            {detection.text && (
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Detected text:</span>
                                <code className="text-xs bg-muted px-2 py-1 rounded break-all">{detection.text}</code>
                              </div>
                            )}
                            <div className="flex items-start gap-2 text-xs">
                              <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">{detection.recommendation}</span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
