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

    if(text.includes(
      String(k).toLowerCase()
    )){

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
PROMPT FINAL IA CONTEXTUAL
====================================== */

function buildFinalPrompt(input:any){

  const profile =
    input.profile || "Operador"

  return `

Eres un especialista senior en seguridad minera,
riesgo operacional,
conducta preventiva
y procesos de incorporación minera.

Tu función es generar un análisis ejecutivo
profesional y operacional.

IMPORTANTE:

- Responde SOLO en JSON válido
- NO agregues texto fuera del JSON
- NO uses markdown
- NO inventes información
- NO contradigas scores
- NO hagas diagnósticos clínicos
- Usa lenguaje operacional minero
- El informe será leído por supervisores
  y administradores de contrato

PERFIL:
${profile}

RESULTADO:
${input.traffic?.result}

SCORE GLOBAL:
${input.score}

COMPETENCIAS:

${(input.competencies || []).map((c:any)=>`
- ${c.name}: ${c.score}% (${getLevel(c.score)})
`).join("\n")}

RESULTADOS POR EVALUACIÓN:

${(input.evaluations || []).map((e:any)=>`

${e.type}
Score: ${e.score}%

`).join("\n")}

RESPONDE EXACTAMENTE ESTE JSON:

{
  "executiveSummary":"",
  "operationalImpact":"",
  "exposureFactors":[
    "",
    ""
  ],
  "developmentPlan":[
    "",
    ""
  ],
  "recommendedCourses":[
    "",
    ""
  ],
  "supervisorAdvice":"",
  "finalConclusion":""
}

INSTRUCCIONES IMPORTANTES:

- "executiveSummary":
  resumen ejecutivo general.

- "operationalImpact":
  impacto operacional real de las brechas.

- "exposureFactors":
  NO repetir competencias ni scores.
  Deben describir escenarios operacionales
  donde podría existir mayor exposición.

- "developmentPlan":
  acciones concretas de acompañamiento.

- "recommendedCourses":
  cursos específicos sugeridos.

- "supervisorAdvice":
  orientación EXCLUSIVA para supervisor.
  NO repetir fortalezas ni brechas.

- "finalConclusion":
  cierre ejecutivo preventivo breve.

`.trim()

}

/* ======================================
CALL AI JSON
====================================== */

async function callAIJSON(prompt:string){

  try{

    const res =
      await openai.chat.completions.create({

        model:"gpt-4o-mini",

        temperature:0.5,

        response_format:{
          type:"json_object"
        },

        messages:[

          {
            role:"system",
            content:`
Eres un especialista senior
en seguridad minera,
riesgo operacional,
conducta preventiva
y continuidad operacional.
`
          },

          {
            role:"user",
            content:prompt
          }

        ]

      })

    const text =
      res.choices[0]?.message?.content || "{}"

    return JSON.parse(text)

  }catch(err){

    console.error(
      "ERROR IA JSON:",
      err
    )

    return {

      executiveSummary:
        "No fue posible generar análisis.",

      operationalImpact:
        "Sin información disponible.",

      exposureFactors:[
        "Sin información disponible."
      ],

      developmentPlan:[
        "Seguimiento operacional."
      ],

      recommendedCourses:[
        "Curso Seguridad Minera."
      ],

      supervisorAdvice:
        "Realizar acompañamiento preventivo.",

      finalConclusion:
        "Resultado generado parcialmente."

    }

  }

}

/* ======================================
CALL AI TEXTO SIMPLE
====================================== */

async function callAIText(
  input:any
){

  return `

El participante presenta un desempeño ${
    input.score >= 85
      ? "sólido"
      : input.score >= 55
      ? "adecuado con observaciones"
      : "con brechas relevantes"
  } en las competencias evaluadas.

Se recomienda reforzar acompañamiento preventivo y seguimiento operacional de acuerdo con las áreas de mejora detectadas.

  `.trim()

}

/* ======================================
ENGINE PRINCIPAL
====================================== */

export async function generateAIReport(
  input:any
){

  /* ======================================
  INFORME FINAL → JSON
  ====================================== */

  if(input.type === "FINAL"){

    const prompt =
      buildFinalPrompt(input)

    return await callAIJSON(prompt)

  }

  /* ======================================
  INFORMES PARCIALES → STRING
  ====================================== */

  return await callAIText(input)

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