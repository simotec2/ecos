import fs from "fs"
import path from "path"

/* ======================================
NOMBRE EVALUACION
====================================== */
function getEvaluationName(type:string){

  if(type === "PETS"){
    return "Evaluación Conductual"
  }

  if(type === "ICOM"){
    return "Perfil Psicolaboral"
  }

  if(type === "SECURITY"){
    return "Seguridad Operacional"
  }

  return type

}

/* ======================================
SECCIONES IA
====================================== */
function extractSection(
  text:string,
  start:string,
  end?:string
){

  if(!text) return ""

  const startIndex =
    text.indexOf(start)

  if(startIndex === -1){
    return ""
  }

  const contentStart =
    startIndex + start.length

  let contentEnd = text.length

  if(end){

    const endIndex =
      text.indexOf(
        end,
        contentStart
      )

    if(endIndex !== -1){
      contentEnd = endIndex
    }

  }

  return text
    .substring(contentStart, contentEnd)
    .trim()
    .replace(/\*\*/g,"")
    .replace(/##/g,"")
    .replace(/###/g,"")
    .replace(/\n/g,"<br/>")
    .replace(/- /g,"• ")

}

/* ======================================
CARDS EVALUACIONES
====================================== */
function buildEvaluationCards(
  evaluations:any[]
){

  return evaluations.map(e=>{

    const score =
      Math.round(e.score)

    let color = "green"

    if(
      e.traffic?.color === "AMARILLO"
    ){
      color = "orange"
    }

    if(
      e.traffic?.color === "ROJO"
    ){
      color = "red"
    }

    return `

      <div class="kpi">

        <div class="kpi-title">
          ${getEvaluationName(e.type)}
        </div>

        <div class="kpi-score ${color}">
          ${score}%
        </div>

        <div class="kpi-result ${color}">
          ${e.traffic?.result || ""}
        </div>

      </div>

    `

  }).join("")

}

/* ======================================
RENDER
====================================== */
export async function renderOperationalFinalReport(
  data:any
){

  /* ======================================
  TEMPLATE
  ====================================== */

  const templatePath = path.join(

    __dirname,
    "..",
    "templates",
    "finalOperationalReportTemplate.html"

  )

  let html = fs.readFileSync(
    templatePath,
    "utf-8"
  )

  /* ======================================
  PARTICIPANTE
  ====================================== */

  const participant =
    data.participant || {}

  const participantProfile =
    participant.perfil ||
    participant.profile ||
    ""

  /* ======================================
  LOGO
  ====================================== */

  const logoPath = path.join(

    __dirname,
    "..",
    "..",
    "assets",
    "logos",
    "ecos.png"

  )

  const logoBase64 = fs
    .readFileSync(logoPath)
    .toString("base64")

  const logo = `

    <img
      src="data:image/png;base64,${logoBase64}"
      style="height:60px;"
    />

  `

  /* ======================================
  IA
  ====================================== */

  const analysis =
    (data.analysis || "")
      .replace(/\*\*/g,"")
      .replace(/##/g,"")
      .replace(/###/g,"")

  const strengths = extractSection(
    analysis,
    "FORTALEZAS OPERACIONALES:",
    "BRECHAS PRIORITARIAS:"
  )

  const gaps = extractSection(
    analysis,
    "BRECHAS PRIORITARIAS:",
    "IMPACTO OPERACIONAL:"
  )

  /* ======================================
  RADAR
  ====================================== */

  const radar =
    data.radar || ""

  /* ======================================
  RISK POSITION
  ====================================== */

  let riskArrowClass = "green"

  if(
    data.traffic?.color === "AMARILLO"
  ){
    riskArrowClass = "orange"
  }

  if(
    data.traffic?.color === "ROJO"
  ){
    riskArrowClass = "red"
  }

  /* ======================================
  EVALUATIONS
  ====================================== */

  const evaluationsCards =
    buildEvaluationCards(
      data.evaluations || []
    )

  /* ======================================
  REEMPLAZOS
  ====================================== */

  html = html

  .replace(
    /{{logo}}/gi,
    logo
  )

  .replace(
    /{{participant}}/gi,
    `${participant.nombre || ""} ${participant.apellido || ""}`
  )

  .replace(
    /{{profile}}/gi,
    participantProfile
  )

  .replace(
    /{{company}}/gi,
    participant.company?.name || ""
  )

  .replace(
    /{{date}}/gi,
    String(data.date || "")
  )

  .replace(
    /{{score}}/gi,
    String(data.score || 0)
  )

  .replace(
    /{{result}}/gi,
    data.traffic?.result || ""
  )

  .replace(
    /{{trafficClass}}/gi,
    data.trafficClass || ""
  )

  .replace(
    /{{resultClass}}/gi,
    data.resultClass || ""
  )

  .replace(
    /{{radar}}/gi,
    radar
  )

  .replace(
    /{{strengths}}/gi,
    strengths
  )

  .replace(
    /{{gaps}}/gi,
    gaps
  )

  .replace(
    /{{evaluationsCards}}/gi,
    evaluationsCards
  )

  .replace(
    /{{riskArrowClass}}/gi,
    riskArrowClass
  )

  /* ======================================
  LIMPIEZA
  ====================================== */

  html = html.replace(
    /{{.*?}}/g,
    ""
  )

  return html

}