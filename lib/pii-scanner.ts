// Client-side PII scanning module

export type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
}

export type PIIDetection = {
  id: string
  category: string
  text: string
  confidence: number
  risk: "Low" | "Medium" | "High"
  boundingBox: BoundingBox
  recommendation: string
}

export type DocumentType = "Boarding Pass" | "Bank Card" | "ID Card" | "Passport" | "Driver License" | "Unknown"

export type ScanResult = {
  documentType: DocumentType
  confidence: number
  detections: PIIDetection[]
}

// Flask API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
console.log('[PII Scanner] API_URL configured as:', API_URL);

// Call Flask backend for document detection
export async function runOcr(file: File): Promise<{ text: string; detections: PIIDetection[] }> {
  const formData = new FormData()
  formData.append('image', file)
  try {
    const response = await fetch(`${API_URL}/detect`, {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    const result = await response.json()
    return {
      text: result.document_type,
      detections: result.detections || [],
    }
  } catch (error) {
    console.error('[PII Scanner] Error calling API:', error)
    throw error
  }
}

// PII Classification Rules (unchanged)
const PII_PATTERNS = {
  creditCard: {
    pattern: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
    category: "Credit Card",
    risk: "High" as const,
    recommendation: "Redact or blur this card number immediately",
  },
  ssn: {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    category: "SSN/Tax ID",
    risk: "High" as const,
    recommendation: "This is highly sensitive identity information",
  },
  phone: {
    pattern: /\b(?:\+?1[-.\s]?)?[(]?([0-9]{3})[)]?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    category: "Phone Number",
    risk: "Medium" as const,
    recommendation: "Consider removing or masking phone number",
  },
  email: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    category: "Email Address",
    risk: "Low" as const,
    recommendation: "Remove email to prevent spam",
  },
  licensePlate: {
    pattern: /\b[A-Z]{3}\d{4}\b|\b\d{3}[A-Z]{3}\b/g,
    category: "License Plate",
    risk: "Medium" as const,
    recommendation: "This could identify your vehicle",
  },
  address: {
    pattern:
      /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct),?\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}\b/gi,
    category: "Physical Address",
    risk: "High" as const,
    recommendation: "This reveals your location",
  },
}

export function classifyPII(text: string, boxes: BoundingBox[]): PIIDetection[] {
  const detections: PIIDetection[] = []
  let boxIndex = 0
  const categoryCount: Record<string, number> = {}

  for (const [key, config] of Object.entries(PII_PATTERNS)) {
    const matches = text.matchAll(config.pattern)

    for (const match of matches) {
      if (match[0]) {
        const category = config.category
        categoryCount[category] = (categoryCount[category] || 0) + 1

        const boundingBox = boxes[boxIndex % boxes.length]
        boxIndex++

        detections.push({
          id: `${key}-${detections.length}`,
          category,
          text: match[0],
          confidence: 0.85 + Math.random() * 0.14,
          risk: config.risk,
          boundingBox,
          recommendation: config.recommendation,
        })
      }
    }
  }

  detections.forEach((detection) => {
    if (detection.category === "Email Address" || detection.category === "Phone Number") {
      if (categoryCount[detection.category] >= 2 && detection.risk === "Low") {
        detection.risk = "Medium"
      }
    }
  })

  return detections
}

export async function scanImage(file: File): Promise<ScanResult> {
  console.log("[PII Scanner] Starting scan for:", file.name)
  const { text: documentType, detections } = await runOcr(file)
  console.log("[PII Scanner] Document detected:", documentType)
  return {
    documentType: documentType as DocumentType,
    confidence: 0.9,
    detections: Array.isArray(detections) ? detections : [],
  }
}

