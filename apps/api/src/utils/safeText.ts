export function safeText(value: any): string {
  try {
    if (value === null || value === undefined) {
      return ""
    }

    // si ya es string
    if (typeof value === "string") {
      return value
    }

    // números o boolean
    if (
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value)
    }

    // arrays
    if (Array.isArray(value)) {
      return value
        .map((v) => safeText(v))
        .join(", ")
    }

    // objetos
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2)
    }

    return String(value)

  } catch (error) {
    console.error("safeText error:", error)
    return ""
  }
}

export function cleanText(value: any): string {
  return safeText(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}