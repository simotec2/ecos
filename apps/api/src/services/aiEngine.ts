import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/* ======================================
UTILS
====================================== */
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

/* ======================================
PETS SCORING
====================================== */
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

    if(text.includes(String(k).toLowerCase())){

      matches++

    }

  }

  let keywordScore = 50

  if(keywords && keywords.length > 0){

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

/* ======================================
PROMPTS INDIVIDUALES
====================================== */
function buildGenericPrompt(input:any){

  return `
Eres un especialista en seguridad minera, desarrollo operacional y procesos de incorporación de personal.

Analizas UN solo participante.

IMPORTANTE:
- Usa lenguaje simple y operacional
- NO uses lenguaje psicológico ni clínico
- El informe será leído por supervisores y RRHH operacional
- NO inventes información
- Sé claro y directo

PUNTAJE:
${input.score}

COMPETENCIAS:
${(input.competencies || []).map((c:any)=>`
- ${c.name}: ${c.score}% (${getLevel(c.score)})
`).join("\n")}

GENERA EL INFORME EN ESTE FORMATO:

DIAGNÓSTICO GENERAL:
Explica brevemente el comportamiento esperado del participante en contexto operacional.

FORTALEZAS:
- ...
- ...
- ...

BRECHAS:
- ...
- ...
- ...

RECOMENDACIONES:
- ...
- ...
- ...

CONCLUSIÓN:
Conclusión breve y clara para supervisión minera.
`
}

/* ======================================
PROMPT FINAL PREMIUM MINERÍA
====================================== */
function buildFinalPrompt(input:any){

  if(!input.evaluations || input.evaluations.length === 0){

    return "No hay información suficiente."

  }

  return `
Eres un especialista senior en desarrollo operacional, seguridad minera y procesos de incorporación de personal en minería.

Tu función es generar un informe ejecutivo simple, claro y operacional para supervisores, RRHH y administradores de contrato.

IMPORTANTE:
- El informe NO debe parecer psicológico ni clínico
- Utiliza lenguaje simple y operacional
- Habla como minería real
- NO uses términos psicológicos técnicos
- NO exageres fortalezas
- NO inventes información
- Prioriza seguridad, adaptación, trabajo en equipo y continuidad operacional
- El informe será leído por supervisores de faena, NO psicólogos
- El enfoque debe estar orientado a prevención y desarrollo
- Si existen brechas, propone acompañamiento y capacitación
- Relaciona las recomendaciones con Hombre Nuevo, seguridad y adaptación operacional

CONTEXTO:
ECOS es una evaluación preventiva previa a acreditación minera.

RESULTADOS DEL PARTICIPANTE:

${input.evaluations.map((e:any)=>`

${e.type}

Puntaje: ${e.score}%

Análisis:
${e.analysis || "Sin análisis"}

`).join("\n")}

RESULTADO FINAL:
${input.traffic?.result}

COMPETENCIAS INTEGRADAS:

${(input.competencies || []).map((c:any)=>`
- ${c.name}: ${c.score}%
`).join("\n")}

GENERA EL INFORME EN ESTE FORMATO EXACTO:

DIAGNÓSTICO GENERAL:
Explica en lenguaje simple cómo podría desempeñarse la persona en contexto minero operacional.

FORTALEZAS OPERACIONALES:
- ...
- ...
- ...

BRECHAS PRIORITARIAS:
- ...
- ...
- ...

IMPACTO OPERACIONAL:
Explica cómo las brechas podrían afectar seguridad, integración, desempeño o continuidad operacional.

PLAN DE DESARROLLO SUGERIDO:
- ...
- ...
- ...

CURSOS RECOMENDADOS:
- ...
- ...
- ...

RECOMENDACIÓN PARA SUPERVISOR:
Explica qué debería reforzar o acompañar el supervisor durante los primeros meses.

CONCLUSIÓN FINAL:
Conclusión ejecutiva breve y clara.
`
}

/* ======================================
LLAMADA IA
====================================== */
async function callAI(prompt:string){

  try{

    const res = await openai.chat.completions.create({

      model: "gpt-4o-mini",

      temperature: 0.2,

      messages:[

        {
          role:"system",
          content:`
Eres un especialista senior en seguridad minera,
desarrollo operacional y evaluación preventiva.

Tu lenguaje debe ser:
- simple
- ejecutivo
- operacional
- entendible para supervisores

NO uses:
- lenguaje clínico
- conceptos psicológicos complejos
- diagnósticos clínicos

Tu foco es:
- prevención
- adaptación
- seguridad
- continuidad operacional
- desarrollo de personas
`
        },

        {
          role:"user",
          content: prompt
        }

      ]

    })

    const text =
      res.choices[0]?.message?.content || ""

    if(!text || text.trim().length < 30){

      console.warn(
        "⚠️ IA devolvió texto insuficiente"
      )

      return "No fue posible generar el análisis automático."

    }

    return text

  }catch(err){

    console.error(
      "❌ ERROR IA:",
      err
    )

    return "No fue posible generar el análisis automático."

  }

}

/* ======================================
ENGINE
====================================== */
export async function generateAIReport(input:any){

  let prompt = ""

  if(input.type === "FINAL"){

    prompt = buildFinalPrompt(input)

  }else{

    prompt = buildGenericPrompt(input)

  }

  return await callAI(prompt)

}

/* ======================================
RECOMENDACIONES
====================================== */
export function generateRecommendations(
  competencies:any[]
){

  return (competencies || []).map(c=>{

    if(c.score >= 80){

      return {
        name:c.name,
        text:"Mantener como fortaleza operacional."
      }

    }

    if(c.score >= 60){

      return {
        name:c.name,
        text:"Reforzar consistencia en terreno."
      }

    }

    if(c.score >= 40){

      return {
        name:c.name,
        text:"Desarrollar mediante capacitación y acompañamiento."
      }

    }

    return {
      name:c.name,
      text:"Requiere intervención prioritaria y seguimiento."
    }

  })

}

/* ======================================
RIESGO
====================================== */
export function calculateRisk(score:number){

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

/* ======================================
ENRICH COMPETENCIES
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