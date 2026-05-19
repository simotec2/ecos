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

/* ======================================
PROMPT FINAL IA CONTEXTUAL
====================================== */

function buildFinalPrompt(input:any){

  const profile =
    input.profile || "Operador"

  return `

Eres un especialista senior en seguridad minera,
riesgo operacional y procesos de incorporación
de personal en minería.

Tu función es generar un análisis ejecutivo
profesional y operacional.

IMPORTANTE:

- Responde SOLO en JSON válido
- NO agregues texto fuera del JSON
- NO uses markdown
- NO uses \`\`\`
- NO inventes información
- NO contradigas scores
- NO hagas diagnósticos clínicos
- Usa lenguaje operacional minero
- El informe será leído por:
  supervisores,
  RRHH operacional,
  administradores de contrato

PERFIL DEL PARTICIPANTE:
${profile}

RESULTADO FINAL:
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

GENERA EXACTAMENTE ESTE JSON:

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

`.trim()

}

/* ======================================
CALL AI
====================================== */

async function callAI(prompt:string){

  try{

    const res =
      await openai.chat.completions.create({

        model:"gpt-4o-mini",

        temperature:0.4,

        response_format:{
          type:"json_object"
        },

        messages:[

          {
            role:"system",
            content:`
Eres un especialista senior en seguridad minera,
riesgo operacional,
conducta preventiva
y desarrollo operacional.

Debes responder SIEMPRE
en JSON válido.
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
      "ERROR IA:",
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
ENGINE
====================================== */

export async function generateAIReport(
  input:any
){

  if(input.type !== "FINAL"){

    return {
      text:
        "Análisis individual no disponible."
    }

  }

  const prompt =
    buildFinalPrompt(input)

  return await callAI(prompt)

}