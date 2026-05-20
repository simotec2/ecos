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

- seguridad minera,
- psicología preventiva,
- continuidad operacional,
- comportamiento humano en minería,
- gestión preventiva operacional.

Tu función es generar un análisis ejecutivo
premium para un informe final integrado.

IMPORTANTE:

- Responde SOLO JSON válido
- NO agregues markdown
- NO agregues texto fuera del JSON
- Usa lenguaje operacional minero
- NO repitas competencias textualmente
- NO repitas scores
- NO inventes patologías
- Debe sonar como consultora minera premium

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
${e.type}: ${e.score}%
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

        model:"gpt-5",

        temperature:0.5,

        response_format:{
          type:"json_object"
        },

        messages:[

          {
            role:"system",
            content:`
Eres consultor senior experto
en seguridad minera y análisis
conductual operacional.
`
          },

          {
            role:"user",
            content:prompt
          }

        ]

      })

    const text =
      response.choices[0]?.message?.content || "{}"

    return JSON.parse(text)

  }catch(err){

    console.error(
      "ERROR FINAL AI:",
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
        "Seguimiento preventivo."
      ],

      recommendedCourses:[
        "Seguridad minera operacional."
      ],

      supervisorAdvice:
        "Realizar acompañamiento preventivo.",

      finalConclusion:
        "Resultado generado parcialmente."

    }

  }

}