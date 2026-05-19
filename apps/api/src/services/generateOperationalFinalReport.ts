import prisma from "../db"

export async function generateOperationalFinalReport(
  participantId: string
) {

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
  SCORE GENERAL
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

      result:"APTA CON PLAN DE DESARROLLO"

    }

  }

  /* ======================================
  TOP FORTALEZAS
  ====================================== */

  const topStrengths =

    [...competencies]

      .sort(
        (a,b)=>b.score-a.score
      )

      .slice(0,3)

  /* ======================================
  TOP BRECHAS
  ====================================== */

  const topGaps =

    [...competencies]

      .sort(
        (a,b)=>a.score-b.score
      )

      .slice(0,3)

  /* ======================================
  HTML FORTALEZAS
  ====================================== */

  const strengthsHTML =

    topStrengths.map((c:any)=>`

      • ${c.name} (${c.score}%)

    `).join("<br/>")

  /* ======================================
  HTML BRECHAS
  ====================================== */

  const gapsHTML =

    topGaps.map((c:any)=>`

      • ${c.name} (${c.score}%)

    `).join("<br/>")

  /* ======================================
  EVALUATION CARDS
  ====================================== */

  const evaluationsCards =

    results.map((r:any)=>{

      const score =
        Math.round(r.score || 0)

      let color = "#dc2626"

      let label =
        "No recomendable"

      if(score >= 85){

        color = "#16a34a"

        label =
          "Recomendable"

      }
      else if(score >= 55){

        color = "#d97706"

        label =
          "Recomendable con observaciones"

      }

      return `

        <div class="kpi">

          <div class="kpi-title">
            ${r.evaluation?.name || "Evaluación"}
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
  PLAN DESARROLLO
  ====================================== */

  const developmentPlan = `

    <div class="summary-grid">

      <div class="good-box">

        <div class="summary-title">
          Seguimiento operacional
        </div>

        <div class="text">
          Supervisión directa y observaciones
          en terreno durante los primeros
          90 días.
        </div>

      </div>

      <div class="good-box">

        <div class="summary-title">
          Reforzamiento preventivo
        </div>

        <div class="text">
          Capacitación dirigida en control
          de riesgos, comunicación y trabajo seguro.
        </div>

      </div>

    </div>

  `

  /* ======================================
  RESUMEN SUPERVISOR
  ====================================== */

  const supervisorSummary = `

    <div class="summary-grid">

      <div class="good-box">

        <div class="summary-title green">
          Lo que trae bien desarrollado
        </div>

        <div class="text">
          ${strengthsHTML}
        </div>

      </div>

      <div class="bad-box">

        <div class="summary-title red">
          Lo que necesita acompañamiento
        </div>

        <div class="text">
          ${gapsHTML}
        </div>

      </div>

    </div>

    <div class="alert-box">

      <div class="alert-title">
        Atención supervisor / administrador
      </div>

      <div class="text">
        Se recomienda seguimiento operacional
        directo durante el periodo inicial de
        incorporación, reforzando conductas
        preventivas y adaptación al entorno laboral.
      </div>

    </div>

  `

  /* ======================================
  RESPALDO EMPLEADOR
  ====================================== */

  const employerSupport = `

    <div class="legal-grid">

      <div class="legal-card">

        <div class="legal-title">
          Reducción de costos
        </div>

        <div class="legal-text">
          Prevención de accidentes,
          rotación y pérdidas operacionales.
        </div>

      </div>

      <div class="legal-card">

        <div class="legal-title">
          Continuidad operacional
        </div>

        <div class="legal-text">
          Disminuye interrupciones
          y pérdida de productividad.
        </div>

      </div>

      <div class="legal-card">

        <div class="legal-title">
          Alineamiento normativo
        </div>

        <div class="legal-text">
          Compatible con estándares
          de seguridad minera.
        </div>

      </div>

      <div class="legal-card">

        <div class="legal-title">
          Debida diligencia
        </div>

        <div class="legal-text">
          Respaldo documental para
          procesos de selección.
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

    strengths: strengthsHTML,

    gaps: gapsHTML,

    evaluationsCards,

    radar:"",

    riskArrowClass,

    developmentPlan,

    supervisorSummary,

    employerSupport

  }

}