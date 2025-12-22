"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import type { BoundingBox } from "@/lib/pii-scanner"

type BoundingBoxOverlayProps = {
  imageUrl: string
  boxes: Array<{ id: string; box: BoundingBox; category: string; risk: string }>
  highlightedId: string | null
  showHighlights: boolean
  onBoxClick: (id: string) => void
}

const RISK_COLORS = {
  High: "rgba(239, 68, 68, 0.3)", // red
  Medium: "rgba(234, 179, 8, 0.3)", // yellow
  Low: "rgba(34, 197, 94, 0.3)", // green
}

const RISK_BORDER_COLORS = {
  High: "rgb(239, 68, 68)",
  Medium: "rgb(234, 179, 8)",
  Low: "rgb(34, 197, 94)",
}

export function BoundingBoxOverlay({
  imageUrl,
  boxes,
  highlightedId,
  showHighlights,
  onBoxClick,
}: BoundingBoxOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      const imgElement = document.getElementById("preview-image") as HTMLImageElement
      if (!imgElement) return

      const rect = imgElement.getBoundingClientRect()
      setDimensions({ width: rect.width, height: rect.height })
    }

    // Initial calculation
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = imageUrl
    img.onload = updateDimensions

    // Update on resize
    window.addEventListener("resize", updateDimensions)
    const timeoutId = setTimeout(updateDimensions, 100)

    return () => {
      window.removeEventListener("resize", updateDimensions)
      clearTimeout(timeoutId)
    }
  }, [imageUrl])

  useEffect(() => {
    if (!showHighlights) return

    const canvas = canvasRef.current
    if (!canvas || dimensions.width === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw bounding boxes
    boxes.forEach(({ id, box, risk }) => {
      const isHighlighted = id === highlightedId
      const color = RISK_COLORS[risk as keyof typeof RISK_COLORS] || RISK_COLORS.Low
      const borderColor = RISK_BORDER_COLORS[risk as keyof typeof RISK_BORDER_COLORS] || RISK_BORDER_COLORS.Low

      const x = box.x * canvas.width
      const y = box.y * canvas.height
      const w = box.width * canvas.width
      const h = box.height * canvas.height

      // Fill
      ctx.fillStyle = color
      ctx.fillRect(x, y, w, h)

      // Border
      ctx.strokeStyle = borderColor
      ctx.lineWidth = isHighlighted ? 3 : 2
      ctx.strokeRect(x, y, w, h)

      // Highlight glow effect
      if (isHighlighted) {
        ctx.strokeStyle = borderColor
        ctx.lineWidth = 6
        ctx.globalAlpha = 0.4
        ctx.strokeRect(x - 3, y - 3, w + 6, h + 6)
        ctx.globalAlpha = 1
      }
    })
  }, [boxes, highlightedId, showHighlights, dimensions])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    // Find clicked box
    for (const { id, box } of boxes) {
      if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) {
        onBoxClick(id)
        break
      }
    }
  }

  if (dimensions.width === 0) return null

  return (
    <div className="relative w-full">
      <img id="preview-image" src={imageUrl || "/placeholder.svg"} alt="preview" className="w-full" />
      {showHighlights && (
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute top-0 left-0 cursor-pointer pointer-events-auto"
          style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
          onClick={handleCanvasClick}
        />
      )}
    </div>
  )
}
