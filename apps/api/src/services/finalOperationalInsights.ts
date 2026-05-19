type Competency = {
  name:string
  score:number
}

type Params = {
  profile?:string
  score:number
  traffic:any
  strengths:Competency[]
  gaps:Competency[]
}

export function generateOperationalInsights({
  profile,
  score,
  traffic,
  strengths,
  gaps
}:Params){

  const isSupervisor =

    String(profile || "")
      .toLowerCase()
      .includes("supervisor")

  const strengthsText =

    strengths
      .map(s=>s.name.toLowerCase())
      .join(", ")

  const gapsText =

    gaps
      .map(g=>g.name.toLowerCase())
      .join(", ")

  /* ======================================
  SINTESIS EJECUTIVA
  ====================================== */

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

  gaps.forEach(g=>{

    const name =
      g.name.toLowerCase()

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

  return {

    executiveSummary,

    risks,

    followUp

  }

}