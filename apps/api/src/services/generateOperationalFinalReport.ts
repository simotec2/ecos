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
  RESULTADO FINAL
  ====================================== */

  let traffic = {

    color:"ROJO",

    result:"AUN NO RECOMENDABLE"

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

      result:"RECOMENDABLE CON SEGUIMIENTO"

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
  PERFIL
  ====================================== */

  const profile =

  participant.perfil ||
  "Operador"

  const isSupervisor =

    String(profile)
      .toLowerCase()
      .includes("supervisor")

  /* ======================================
  SÍNTESIS EJECUTIVA IA
  ====================================== */

  const strengthsText =

    topStrengths
      .map((s:any)=>
        s.name.toLowerCase()
      )
      .join(", ")

  const gapsText =

    topGaps
      .map((g:any)=>
        g.name.toLowerCase()
      )
      .join(", ")

  let executiveSummary = ""

  if(isSupervisor){

    executiveSummary = `

El participante presenta un desempeño ${
  score >= 85
    ? "sólido"
    : score >= 55
    ? "adecuado con observaciones"
    : "con exposición relevante"
} en competencias asociadas a liderazgo preventivo y control operacional.

Destacan fortalezas relacionadas con ${strengthsText}, favoreciendo la supervisión de tareas críticas y la gestión preventiva de equipos.

No obstante, persisten oportunidades de mejora vinculadas a ${gapsText}, las cuales podrían afectar la consistencia del liderazgo operacional bajo escenarios de presión y alta exigencia operacional.

    `.trim()

  }else{

    executiveSummary = `

El participante presenta un desempeño ${
  score >= 85
    ? "sólido"
    : score >= 55
    ? "adecuado con observaciones"
    : "con exposición relevante"
} en competencias asociadas a seguridad operacional y ejecución segura de tareas críticas.

Se observan fortalezas relacionadas con ${strengthsText}, favoreciendo la adherencia preventiva y el cumplimiento operacional.

Sin perjuicio de lo anterior, se identifican oportunidades de mejora relacionadas con ${gapsText}, las cuales podrían afectar la consistencia conductual bajo condiciones de presión operacional.

    `.trim()

  }

  /* ======================================
  RIESGOS POTENCIALES
  ====================================== */

  const risks:string[] = []

  topGaps.forEach((g:any)=>{

    const name =
      String(g.name || "")
        .toLowerCase()

    if(name.includes("equipo")){

      risks.push(
        "Dificultades de coordinación en tareas grupales."
      )

    }

    if(name.includes("comunic")){

      risks.push(
        "Riesgo de desviaciones asociadas a comunicación operacional insuficiente."
      )

    }

    if(name.includes("conduct")){

      risks.push(
        "Variabilidad conductual frente a escenarios operacionales exigentes."
      )

    }

    if(name.includes("proced")){

      risks.push(
        "Posibles desviaciones asociadas a cumplimiento procedimental."
      )

    }

  })

  if(!risks.length){

    risks.push(
      "No se observan factores críticos de exposición operacional inmediata."
    )

  }

  /* ======================================
  SEGUIMIENTO
  ====================================== */

  const followUp = isSupervisor

    ? [

        "Seguimiento en liderazgo preventivo.",

        "Refuerzo de control operacional.",

        "Acompañamiento inicial en gestión preventiva."

      ]

    : [

        "Observación conductual en terreno.",

        "Refuerzo preventivo inicial.",

        "Seguimiento operacional durante periodo de adaptación."

      ]

  /* ======================================
  EVALUATION CARDS
  ====================================== */

  const evaluationsCards =

    results.map((r:any)=>{

      const score =
        Math.round(r.score || 0)

      let color = "#ee0f0f"

      let label =
        "Aun No Recomendable"

      if(score >= 85){

        color = "#0fe22b"

        label =
          "Recomendable"

      }
      else if(score >= 55){

        color = "#f5e509"

        label =
          "Recomendable con Seguimiento"

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
  CURSOS RECOMENDADOS
  ====================================== */

  const recommendedCourses:string[] = []

  topGaps.forEach((gap:any)=>{

    const name =
      String(gap.name || "")
        .toLowerCase()

    if(name.includes("riesgo")){

      recommendedCourses.push(
        "Curso Identificación de Peligros y Control de Riesgos"
      )

    }

    if(name.includes("proced")){

      recommendedCourses.push(
        "Curso Procedimientos Críticos de Trabajo"
      )

    }

    if(name.includes("comun")){

      recommendedCourses.push(
        "Curso Comunicación Efectiva en Minería"
      )

    }

    if(name.includes("equipo")){

      recommendedCourses.push(
        "Curso Trabajo en Equipo Operacional"
      )

    }

    if(name.includes("conduct")){

      recommendedCourses.push(
        "Curso Conductas Seguras y Cultura Preventiva"
      )

    }

  })

  const uniqueCourses =
    [...new Set(recommendedCourses)]

  const coursesHTML =

    uniqueCourses.length

      ? uniqueCourses.map(course=>`

          <li>${course}</li>

        `).join("")

      : `
          <li>
            Curso Seguridad Minera Operacional
          </li>
        `

  /* ======================================
  PLAN DESARROLLO
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
              .map(item=>`
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
  RESUMEN EJECUTIVO
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

    <div class="summary-grid">

      <div class="good-box">

        <div class="summary-title green">
          Fortalezas observadas
        </div>

        <div class="text">
          ${strengthsHTML}
        </div>

      </div>

      <div class="bad-box">

        <div class="summary-title red">
          Brechas prioritarias
        </div>

        <div class="text">
          ${gapsHTML}
        </div>

      </div>

    </div>

    <div class="alert-box">

      <div class="alert-title">
        Riesgos potenciales observados
      </div>

      <div class="text">

        <ul>

          ${risks
            .map(r=>`
              <li>${r}</li>
            `)
            .join("")}

        </ul>

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
          Prevención de accidentes y pérdidas operacionales.
        </div>

      </div>

      <div class="legal-card">

        <div class="legal-title">
          Continuidad operacional
        </div>

        <div class="legal-text">
          Disminuye interrupciones y exposición operacional.
        </div>

      </div>

      <div class="legal-card">

        <div class="legal-title">
          Alineamiento preventivo
        </div>

        <div class="legal-text">
          Compatible con estándares de seguridad minera.
        </div>

      </div>

      <div class="legal-card">

        <div class="legal-title">
          Respaldo documental
        </div>

        <div class="legal-text">
          Evidencia objetiva para procesos de incorporación.
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

  employerSupport,

  operationalExposureAnalysis:
  `

    <div class="alert-box">

      <div class="alert-title">
        Factores observados
      </div>

      <div class="text">

        ${
          risks.length

            ? risks.map(r=>`
                • ${r}<br/>
              `).join("")

            : `
                No se observan factores críticos
                de exposición operacional inmediata.
              `
        }

      </div>

    </div>

  `

}

}