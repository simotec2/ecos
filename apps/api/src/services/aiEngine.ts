import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/* ======================================
NIVELES
====================================== */
function getLevel(score:number){

  if(score >= 80) return "ALTO"

  if(score >= 55) return "ADECUADO"

  if(score >= 40) return "EN DESARROLLO"

  return "CRITICO"

}

/* ======================================
SEMÁFORO
====================================== */
function getTraffic(score:number){

  if(score >= 80){

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
IA GUIADA PETS
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
      score:20,
      reason:"Sin respuesta"
    }

  }

  try{

    const prompt = `

Eres un psicólogo laboral senior experto en:

- seguridad minera
- conducta preventiva
- comportamiento operacional
- continuidad operacional
- gestión del riesgo
- cultura de seguridad

Tu función es evaluar respuestas conductuales de trabajadores operacionales.

IMPORTANTE:

- Evalúa criterio preventivo operacional
- Evalúa intención preventiva
- Evalúa conciencia de riesgo
- Evalúa conducta segura
- Evalúa toma de decisiones
- Evalúa escalamiento y comunicación preventiva
- Evalúa adherencia operacional

MUY IMPORTANTE:

- NO evalúes ortografía
- NO evalúes redacción
- NO penalices respuestas breves
- Los trabajadores operacionales utilizan lenguaje simple
- Una respuesta corta puede demostrar alta competencia preventiva
- Debes interpretar el sentido operacional de la respuesta

La mayoría de trabajadores:
- no usa lenguaje corporativo
- no redacta técnicamente
- responde de forma simple y directa

IMPORTANTE:
NO regales puntajes altos.
Debes mantener criterio profesional y exigencia operacional.

ESCALA:

80-100:
Conducta preventiva sólida y criterio operacional consistente.

55-79:
Conducta preventiva adecuada pero con oportunidades de mejora.

40-54:
Conducta preventiva insuficiente o inconsistente.

0-39:
Conducta riesgosa o ausencia de criterio preventivo.

Pregunta:
"${question}"

Respuesta trabajador:
"${answer}"

Keywords de apoyo:
${(keywords || []).join(", ")}

Responde SOLO JSON válido:

{
  "score": number,
  "reason": "explicación breve"
}

`

    const response =
      await openai.chat.completions.create({

        model:"gpt-4.1-mini",

        temperature:0.2,

        messages:[

          {
            role:"system",
            content:"Responde SOLO JSON válido."
          },

          {
            role:"user",
            content:prompt
          }

        ]

      })

    const content =
      response.choices?.[0]
        ?.message
        ?.content || ""

    let parsed:any = null

    try{

      parsed = JSON.parse(content)

    }catch{

      parsed = null

    }

    let finalScore =
      Number(parsed?.score || 50)

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

      competent: finalScore >= 55,

      score: Math.round(finalScore),

      reason:
        parsed?.reason || ""

    }

  }catch(error){

    console.log(
      "ERROR IA PETS"
    )

    console.log(error)

    /* =========================
    FALLBACK
    ========================= */
    return {

      competent:true,

      score:60,

      reason:"Fallback automático"

    }

  }

}

/* ======================================
ANÁLISIS GENERAL IA
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
    input.score >= 80
      ? "bajo nivel de exposición operacional"
      : input.score >= 55
      ? "riesgos operacionales moderados que requieren seguimiento"
      : "brechas críticas que podrían impactar la seguridad operacional"

  return `

Análisis general:

El participante presenta un desempeño ${
  input.score >= 80
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
  input.score >= 80
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
  input.score >= 80
    ? "mantener seguimiento preventivo estándar y potenciar fortalezas observadas."
    : input.score >= 55
    ? "implementar acompañamiento preventivo focalizado y reforzar competencias críticas."
    : "desarrollar intervención preventiva prioritaria antes de exposición operacional de alto riesgo."
}

Conclusión ejecutiva:

Los resultados obtenidos permiten identificar tendencias conductuales y operacionales relevantes para la gestión preventiva, proporcionando información útil para procesos de seguimiento, capacitación y fortalecimiento de competencias críticas en seguridad.

`.trim()

}

/* ======================================
RECOMENDACIONES
====================================== */
export function generateRecommendations(
  competencies:any[]
){

  return (competencies || []).map(c=>({

    name:c.name,

    text:
      c.score >= 80
        ? "Mantener como fortaleza operacional."
        : c.score >= 55
        ? "Reforzar consistencia preventiva en terreno."
        : c.score >= 40
        ? "Desarrollar mediante capacitación y acompañamiento preventivo."
        : "Requiere intervención preventiva prioritaria."

  }))

}

/* ======================================
RIESGO
====================================== */
export function calculateRisk(
  score:number
){

  if(score >= 80){

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

/* ======================================
ENRIQUECER
====================================== */
export function enrichCompetencies(
  competencies:any[]
){

  return (competencies || []).map(c=>({

    ...c,

    levelLabel:getLevel(c.score),

    traffic:getTraffic(c.score)

  }))

}