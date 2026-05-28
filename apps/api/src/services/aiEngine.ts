function getLevel(score:number){

  if(score >= 85) return "ALTO"

  if(score >= 70) return "ADECUADO"

  if(score >= 55) return "ACEPTABLE"

  return "CRITICO"

}

function getTraffic(score:number){

  if(score >= 85){

    return {
      color:"VERDE",
      result:"RECOMENDABLE"
    }

  }

  if(score >= 55){

    return {
      color:"AMARILLO",
      result:"RECOMENDABLE CON OBSERVACIONES"
    }

  }

  return {
    color:"ROJO",
    result:"NO RECOMENDABLE"
  }

}

/* ======================================
DETECCIÓN SEMÁNTICA OPERACIONAL PETS
====================================== */
export async function evaluateCompetencyAI(
  question:string,
  answer:string,
  keywords:string[]
){

  /* =========================
  SIN RESPUESTA
  ========================= */
  if(!answer || answer.trim().length === 0){

    return {
      competent:false,
      score:20
    }

  }

  const text = answer.toLowerCase()

  /* =========================
  KEYWORDS FLEXIBLES
  ========================= */
  let matches = 0

  for(const k of (keywords || [])){

    const keyword = String(k)
      .toLowerCase()
      .trim()

    if(!keyword) continue

    if(text.includes(keyword)){

      matches++

    }

  }

  /* =========================
  SCORE BASE HUMANO
  NO PARTIR DESDE 0
  ========================= */
  let keywordScore = 60

  if(matches >= 1) keywordScore = 70
  if(matches >= 2) keywordScore = 78
  if(matches >= 3) keywordScore = 85
  if(matches >= 5) keywordScore = 92

  /* =========================
  DETECCIÓN PREVENTIVA BÁSICA
  ========================= */
  const preventiveIndicators = [

    "aviso",
    "informo",
    "detengo",
    "paro",
    "supervisor",
    "riesgo",
    "peligro",
    "seguridad",
    "epp",
    "bloqueo",
    "procedimiento",
    "prevenir",
    "proteger",
    "cuidado",
    "verifico",
    "reviso",
    "alerto"

  ]

  let preventiveMatches = 0

  for(const p of preventiveIndicators){

    if(text.includes(p)){

      preventiveMatches++

    }

  }

  let preventiveScore = 0

  if(preventiveMatches >= 1) preventiveScore = 5
  if(preventiveMatches >= 3) preventiveScore = 10
  if(preventiveMatches >= 5) preventiveScore = 15

  /* =========================
  DETECCIÓN DE CONDUCTAS CRÍTICAS
  ========================= */
  const dangerousIndicators = [

    "ignoro",
    "continúo igual",
    "sigo trabajando",
    "no aviso",
    "da lo mismo",
    "sin epp"

  ]

  let dangerous = false

  for(const d of dangerousIndicators){

    if(text.includes(d)){

      dangerous = true

    }

  }

  /* =========================
  LONGITUD SOLO COMO APOYO
  NO CASTIGAR RESPUESTAS CORTAS
  ========================= */
  let depthScore = 0

  if(answer.length > 150){

    depthScore = 5

  }

  /* =========================
  SCORE FINAL
  ========================= */
  let finalScore = Math.round(

    keywordScore +
    preventiveScore +
    depthScore

  )

  /* =========================
  AJUSTE POR CONDUCTA CRÍTICA
  ========================= */
  if(dangerous){

    finalScore -= 25

  }

  /* =========================
  LIMITES
  ========================= */
  if(finalScore > 100){

    finalScore = 100

  }

  if(finalScore < 20){

    finalScore = 20

  }

  return {

    competent: finalScore >= 60,

    score: finalScore

  }

}

/* ======================================
ANÁLISIS IA
====================================== */
export async function generateAIReport(
  input:any
){

  const competencies =
    input.competencies || []

  const sorted =
    [...competencies]
      .sort((a,b)=>b.score - a.score)

  const top =
    sorted.slice(0,3)

  const bottom =
    [...sorted]
      .reverse()
      .slice(0,3)

  const strengths =
    top.map((c:any)=>
      `${c.name} (${c.score}%)`
    ).join(", ")

  const gaps =
    bottom.map((c:any)=>
      `${c.name} (${c.score}%)`
    ).join(", ")

  const riskText =
    input.score >= 85
      ? "bajo nivel de exposición operacional"
      : input.score >= 55
      ? "riesgos operacionales moderados que requieren seguimiento"
      : "brechas críticas que podrían impactar la seguridad operacional"

  return `

Análisis general:

El participante presenta un desempeño ${
  input.score >= 85
    ? "sólido y consistente"
    : input.score >= 55
    ? "adecuado con oportunidades de mejora"
    : "insuficiente para contextos operacionales de alta exigencia"
} en las competencias evaluadas.

Fortalezas observadas:

${strengths}.

Las respuestas entregadas evidencian criterios preventivos asociados a control operacional, identificación de riesgos y conductas de seguridad aplicables a entornos de trabajo de exigencia operacional.

Brechas detectadas:

${gaps}.

Las brechas identificadas podrían generar ${riskText}, especialmente en tareas que requieren control preventivo permanente y adherencia estricta a procedimientos operacionales.

Análisis operacional:

El perfil evaluado evidencia ${
  input.score >= 85
    ? "adecuada capacidad de respuesta frente a condiciones operacionales."
    : input.score >= 55
    ? "necesidad de reforzar criterios preventivos y seguimiento en terreno."
    : "riesgo de respuestas inconsistentes frente a situaciones operacionales críticas."
}

Competencias destacadas:

${top.map((c:any)=>`
- ${c.name}: ${c.levelLabel || getLevel(c.score)}
`).join("")}

Competencias críticas:

${bottom.map((c:any)=>`
- ${c.name}: ${c.levelLabel || getLevel(c.score)}
`).join("")}

Recomendación profesional:

Se recomienda ${
  input.score >= 85
    ? "mantener seguimiento preventivo estándar y potenciar fortalezas observadas."
    : input.score >= 55
    ? "implementar acompañamiento preventivo focalizado y reforzar competencias críticas."
    : "desarrollar intervención preventiva prioritaria antes de exposición operacional de alto riesgo."
}

Conclusión ejecutiva:

Los resultados obtenidos permiten identificar tendencias conductuales y operacionales relevantes para la gestión preventiva, proporcionando información útil para procesos de seguimiento, capacitación y fortalecimiento de competencias críticas en seguridad.

`.trim()

}

export function generateRecommendations(
  competencies:any[]
){

  return (competencies || []).map(c=>({

    name:c.name,

    text:
      c.score >= 85
        ? "Mantener como fortaleza operacional."
        : c.score >= 70
        ? "Reforzar consistencia preventiva en terreno."
        : c.score >= 55
        ? "Desarrollar mediante acompañamiento preventivo."
        : "Requiere intervención preventiva prioritaria."

  }))

}

export function calculateRisk(
  score:number
){

  if(score >= 85){

    return {
      level:"BAJO",
      text:"Riesgo operacional bajo."
    }

  }

  if(score >= 55){

    return {
      level:"MEDIO",
      text:"Riesgo operacional moderado."
    }

  }

  return {
    level:"ALTO",
    text:"Riesgo operacional alto."
  }

}

export function enrichCompetencies(
  competencies:any[]
){

  return (competencies || []).map(c=>({

    ...c,

    levelLabel:getLevel(c.score),

    traffic:getTraffic(c.score)

  }))

}