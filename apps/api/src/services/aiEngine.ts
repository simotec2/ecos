function getLevel(score:number){

  if(score >= 80) return "ALTO"

  if(score >= 60) return "ADECUADO"

  if(score >= 40) return "EN DESARROLLO"

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

export async function evaluateCompetencyAI(
  question:string,
  answer:string,
  keywords:string[]
){

  if(!answer || answer.trim().length === 0){

    return {
      competent:false,
      score:20
    }

  }

  const text = answer.toLowerCase()

  let matches = 0

  for(const k of (keywords || [])){

    if(
      text.includes(
        String(k).toLowerCase()
      )
    ){

      matches++

    }

  }

  let keywordScore = 50

  if(keywords?.length){

    keywordScore = Math.max(

      Math.round(
        (matches / keywords.length) * 100
      ),

      20

    )

  }

  const length = answer.length

  let depthScore = 40

  if(length > 200) depthScore = 100
  else if(length > 120) depthScore = 80
  else if(length > 60) depthScore = 60
  else if(length > 30) depthScore = 40
  else depthScore = 20

  const finalScore = Math.round(

    (keywordScore * 0.6) +
    (depthScore * 0.4)

  )

  return {

    competent: finalScore >= 60,

    score: finalScore || 30

  }

}

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

Estas competencias evidencian capacidades asociadas a desempeño preventivo, cumplimiento operacional y adaptación a entornos de trabajo con exigencias de seguridad.

Brechas detectadas:

${gaps}.

Las brechas identificadas podrían generar ${riskText}, especialmente en tareas que requieren control preventivo permanente y adherencia estricta a procedimientos.

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
      c.score >= 80
        ? "Mantener como fortaleza operacional."
        : c.score >= 60
        ? "Reforzar consistencia en terreno."
        : c.score >= 40
        ? "Desarrollar mediante capacitación y acompañamiento preventivo."
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