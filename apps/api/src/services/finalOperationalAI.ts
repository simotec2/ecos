import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

function getLevel(score:number){

  if(score >= 80) return "ALTO"

  if(score >= 60) return "ADECUADO"

  if(score >= 40) return "EN DESARROLLO"

  return "CRITICO"

}

function buildPrompt(input:any){

  return `

Eres un especialista senior en:

- seguridad minera
- psicología preventiva
- continuidad operacional
- comportamiento humano en minería
- gestión preventiva operacional

Tu función es generar un análisis ejecutivo premium para un informe final integrado.

IMPORTANTE:

- Responde SOLO JSON válido
- NO uses markdown
- NO agregues texto fuera del JSON
- Usa lenguaje operacional minero
- Redacción breve, ejecutiva y accionable
- Debe servir para supervisión directa
- No inventar patologías
- No repetir frases
- Máximo 2 párrafos por sección
- Debe sonar como consultora minera

PERFIL:
${input.profile}

RESULTADO:
${input.traffic?.result}

SCORE:
${input.score}

COMPETENCIAS:

${(input.competencies || []).map((c:any)=>`
- ${c.name}: ${c.score}% (${getLevel(c.score)})
`).join("\n")}

EVALUACIONES:

${(input.evaluations || []).map((e:any)=>`
- ${e.type}: ${e.score}%
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

`.trim()

}

export async function generateFinalOperationalAI(
  input:any
){

  try{

    const prompt =
      buildPrompt(input)

    const response =
      await openai.chat.completions.create({

        model:"gpt-4o-mini",

        temperature:0.3,

        messages:[

          {
            role:"system",
            content:`
Eres consultor senior experto
en seguridad minera y análisis
conductual operacional.

Debes responder únicamente
JSON válido.
`
          },

          {
            role:"user",
            content:prompt
          }

        ]

      })

    const raw =
      response.choices[0]?.message?.content || "{}"

    console.log("================================")
    console.log("FINAL AI RAW RESPONSE")
    console.log("================================")
    console.log(raw)

    const clean = raw

      .replace(/```json/gi,"")
      .replace(/```/gi,"")
      .replace(/\n/g," ")
      .replace(/\r/g," ")
      .trim()

    let parsed:any = {}

    try{

      parsed = JSON.parse(clean)

    }catch(parseError){

      console.error("ERROR PARSING JSON")
      console.error(parseError)

      parsed = {

        executiveSummary:
          clean.substring(0,500),

        operationalImpact:
          "Se recomienda seguimiento preventivo operacional.",

        exposureFactors:[
          "Posibles desviaciones operacionales bajo presión.",
          "Necesidad de reforzar adherencia preventiva."
        ],

        developmentPlan:[
          "Observación operacional inicial.",
          "Seguimiento preventivo en terreno."
        ],

        recommendedCourses:[
          "Seguridad operacional minera.",
          "Control preventivo de riesgos."
        ],

        supervisorAdvice:
          "Mantener acompañamiento preventivo inicial y reforzar cumplimiento procedimental.",

        finalConclusion:
          "El resultado integrado permite apoyar procesos de incorporación y seguimiento preventivo."

      }

    }

    return {

      executiveSummary:
        parsed.executiveSummary || "",

      operationalImpact:
        parsed.operationalImpact || "",

      exposureFactors:
        Array.isArray(parsed.exposureFactors)
          ? parsed.exposureFactors
          : [],

      developmentPlan:
        Array.isArray(parsed.developmentPlan)
          ? parsed.developmentPlan
          : [],

      recommendedCourses:
        Array.isArray(parsed.recommendedCourses)
          ? parsed.recommendedCourses
          : [],

      supervisorAdvice:
        parsed.supervisorAdvice || "",

      finalConclusion:
        parsed.finalConclusion || ""

    }

  }catch(err){

    console.error("================================")
    console.error("ERROR FINAL AI")
    console.error("================================")

    console.error(err)

    if(err instanceof Error){

      console.error("MESSAGE:")
      console.error(err.message)

      console.error("STACK:")
      console.error(err.stack)

    }

    return {

      executiveSummary:
        "El participante requiere seguimiento preventivo asociado a las competencias observadas durante el proceso de evaluación integrada.",

      operationalImpact:
        "Se recomienda supervisión operacional inicial y reforzamiento preventivo focalizado.",

      exposureFactors:[
        "Posibles desviaciones conductuales bajo presión operacional.",
        "Necesidad de reforzar seguimiento preventivo en terreno."
      ],

      developmentPlan:[
        "Seguimiento preventivo inicial.",
        "Observación conductual en tareas críticas."
      ],

      recommendedCourses:[
        "Seguridad minera operacional.",
        "Control preventivo de riesgos."
      ],

      supervisorAdvice:
        "Mantener acompañamiento preventivo inicial y reforzar adherencia a procedimientos operacionales.",

      finalConclusion:
        "El resultado integrado permite orientar procesos de incorporación y seguimiento operacional preventivo."

    }

  }

}