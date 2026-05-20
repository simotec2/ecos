import prisma from "../db"

import { generateFinalOperationalAI }
from "./finalOperationalAI"

export async function generateOperationalFinalReport(
  participantId:string
){

  const participant =
    await prisma.participant.findUnique({

      where:{
        id:participantId
      },

      include:{
        company:true
      }

    })

  if(!participant){

    throw new Error(
      "Participante no encontrado"
    )

  }

  const results =
    await prisma.evaluationResult.findMany({

      where:{
        participantId
      },

      include:{
        evaluation:true
      },

      orderBy:{
        createdAt:"desc"
      }

    })

  /* ======================================
  COMPETENCIAS
  ====================================== */

  const competencies:any[] = []

  results.forEach((result:any)=>{

    let json:any = {}

    try{

      json =
        typeof result.resultJson === "string"
          ? JSON.parse(result.resultJson)
          : result.resultJson || {}

    }catch{

      json = {}

    }

    const list =

      json.competencies ||

      json.competenciasDetalle ||

      []

    list.forEach((c:any)=>{

      if(
        c &&
        c.name &&
        typeof c.score === "number"
      ){

        competencies.push({

          name:c.name,
          score:c.score

        })

      }

    })

  })

  /* ======================================
  SCORE
  ====================================== */

  const score =
    results.length

      ? Math.round(

          results.reduce(

            (acc:any,r:any)=>
              acc + (r.score || 0),

            0

          ) / results.length

        )

      : 0

  /* ======================================
  TRAFFIC
  ====================================== */

  let traffic = {

    color:"ROJO",

    result:"NO RECOMENDABLE"

  }

  if(score >= 85){

    traffic = {

      color:"VERDE",

      result:"RECOMENDABLE"

    }

  }
  else if(score >= 55){

    traffic = {

      color:"AMARILLO",

      result:"RECOMENDABLE CON OBSERVACIONES"

    }

  }

  /* ======================================
  TOPS
  ====================================== */

  const topStrengths =

    [...competencies]

      .sort(
        (a,b)=>b.score-a.score
      )

      .slice(0,3)

  const topGaps =

    [...competencies]

      .sort(
        (a,b)=>a.score-b.score
      )

      .slice(0,3)

  /* ======================================
  HTML
  ====================================== */

  const strengthsHTML =

    topStrengths.map((c:any)=>`

      • ${c.name} (${c.score}%)

    `).join("<br/>")

  const gapsHTML =

    topGaps.map((c:any)=>`

      • ${c.name} (${c.score}%)

    `).join("<br/>")

  /* ======================================
  PROFILE
  ====================================== */

  const profile =

    participant.perfil ||
    "Operador"

  /* ======================================
  IA FINAL PREMIUM
  ====================================== */

  const aiInsights =
    await generateFinalOperationalAI({

      profile,

      score,

      traffic,

      competencies,

      evaluations:
        results.map((r:any)=>({

          type:
            r.evaluation?.name,

          score:
            r.score

        }))

    })

  const executiveSummary =
    aiInsights.executiveSummary || ""

  const operationalImpact =
    aiInsights.operationalImpact || ""

  const risks =
    aiInsights.exposureFactors || []

  const followUp =
    aiInsights.developmentPlan || []

  const recommendedCourses =
    aiInsights.recommendedCourses || []

  const supervisorAdvice =
    aiInsights.supervisorAdvice || ""

  const finalConclusion =
    aiInsights.finalConclusion || ""

  /* ======================================
  CARDS
  ====================================== */

  const evaluationsCards =

    results.map((r:any)=>{

      const score =
        Math.round(r.score || 0)

      let color = "#dc2626"

      let label =
        "NO RECOMENDABLE"

      if(score >= 85){

        color = "#16a34a"

        label =
          "RECOMENDABLE"

      }
      else if(score >= 55){

        color = "#d97706"

        label =
          "RECOMENDABLE CON OBSERVACIONES"

      }

      return `

        <div class="kpi">

          <div class="kpi-title">
            ${r.evaluation?.name || ""}
          </div>

          <div
            class="kpi-score"
            style="color:${color}"
          >
            ${score}%
          </div>

          <div
            class="kpi-result"
            style="color:${color}"
          >
            ${label}
          </div>

        </div>

      `

    }).join("")

  /* ======================================
  COURSES
  ====================================== */

  const uniqueCourses =
    [...new Set(recommendedCourses)]

  const coursesHTML =

    uniqueCourses.length

      ? uniqueCourses.map((course:string)=>`

          <li>${course}</li>

        `).join("")

      : `
          <li>
            Seguridad minera operacional
          </li>
        `

  /* ======================================
  DEVELOPMENT PLAN
  ====================================== */

  const developmentPlan = `

    <div class="summary-grid">

      <div class="good-box">

        <div class="summary-title">
          Seguimiento recomendado
        </div>

        <div class="text">

          <ul>

            ${followUp
              .map((item:string)=>`
                <li>${item}</li>
              `)
              .join("")}

          </ul>

        </div>

      </div>

      <div class="good-box">

        <div class="summary-title">
          Capacitación sugerida
        </div>

        <div class="text">

          <ul>

            ${coursesHTML}

          </ul>

        </div>

      </div>

    </div>

  `

  /* ======================================
  SUMMARY
  ====================================== */

  const supervisorSummary = `

    <div class="executive-box">

      <div class="summary-title">
        Síntesis ejecutiva
      </div>

      <div class="text">
        ${executiveSummary}
      </div>

    </div>

    <div class="alert-box">

      <div class="alert-title">
        Impacto operacional observado
      </div>

      <div class="text">
        ${operationalImpact}
      </div>

    </div>

    <div class="good-box">

      <div class="summary-title">
        Orientación para supervisión
      </div>

      <div class="text">
        ${supervisorAdvice}
      </div>

    </div>

  `

  /* ======================================
  EMPLOYER SUPPORT
  ====================================== */

  const employerSupport = `

    <div class="legal-grid">

      <div class="legal-card">

        <div class="legal-title">
          Continuidad operacional
        </div>

        <div class="legal-text">
          Favorece procesos preventivos
          y reducción de exposición operacional.
        </div>

      </div>

      <div class="legal-card">

        <div class="legal-title">
          Respaldo preventivo
        </div>

        <div class="legal-text">
          Evidencia objetiva para procesos
          de incorporación y seguimiento.
        </div>

      </div>

      <div class="legal-card">

        <div class="legal-title">
          Gestión de riesgo
        </div>

        <div class="legal-text">
          Permite detectar oportunidades
          de mejora preventiva.
        </div>

      </div>

      <div class="legal-card">

        <div class="legal-title">
          Seguridad operacional
        </div>

        <div class="legal-text">
          Compatible con estándares
          preventivos mineros.
        </div>

      </div>

    </div>

  `

  /* ======================================
  RISK ARROW
  ====================================== */

  const riskArrowClass =

    traffic.color === "VERDE"

      ? "green"

      : traffic.color === "AMARILLO"

      ? "orange"

      : "red"

  /* ======================================
  RETURN
  ====================================== */

  return {

    participant,

    date:new Date()
      .toLocaleDateString("es-CL"),

    score,

    traffic,

    competencies,

    strengths:
      strengthsHTML,

    gaps:
      gapsHTML,

    evaluationsCards,

    radar:"",

    riskArrowClass,

    developmentPlan,

    supervisorSummary,

    employerSupport,

    operationalExposureAnalysis:
    `

      <div class="alert-box">

        <div class="alert-title">
          Factores de exposición operacional
        </div>

        <div class="text">

          <ul>

            ${
              risks.length

                ? risks.map((r:string)=>`
                    <li>${r}</li>
                  `).join("")

                : `
                    <li>
                      No se observan factores críticos
                      de exposición operacional inmediata.
                    </li>
                  `
            }

          </ul>

          <br/>

          <strong>
            Conclusión operacional:
          </strong>

          <br/><br/>

          ${finalConclusion}

        </div>

      </div>

    `

  }

}