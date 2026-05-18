import fs from "fs"
import path from "path"

function getColor(color:string){

  if(color === "VERDE"){
    return "#16a34a"
  }

  if(color === "AMARILLO"){
    return "#f59e0b"
  }

  return "#dc2626"

}

function getTrafficClass(color:string){

  if(color === "VERDE"){
    return "green"
  }

  if(color === "AMARILLO"){
    return "orange"
  }

  return "red"

}

/* ======================================
EXTRAER SECCIONES IA
====================================== */
function extractSection(
  text:string,
  start:string,
  end?:string
){

  if(!text) return ""

  const startIndex = text.indexOf(start)

  if(startIndex === -1){
    return ""
  }

  const contentStart =
    startIndex + start.length

  let contentEnd = text.length

  if(end){

    const endIndex =
      text.indexOf(end, contentStart)

    if(endIndex !== -1){
      contentEnd = endIndex
    }

  }

  return text
    .substring(contentStart, contentEnd)
    .trim()
    .replace(/\n/g,"<br/>")

}

/* ======================================
TABLA EVALUACIONES
====================================== */
function buildEvaluationsTable(
  evaluations:any[]
){

  return `
    <table>

      <tr>
        <th>Evaluación</th>
        <th>Puntaje</th>
        <th>Resultado</th>
      </tr>

      ${evaluations.map(e=>`

        <tr>

          <td>
            ${e.type}
          </td>

          <td>
            ${e.score}%
          </td>

          <td>
            ${e.traffic?.result || ""}
          </td>

        </tr>

      `).join("")}

    </table>
  `

}

/* ======================================
RENDER HTML
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
      style="height:55px;"
    />
  `

  /* ======================================
  ANALISIS IA
  ====================================== */

  const analysis =
    data.analysis || ""

  const diagnostic = extractSection(
    analysis,
    "DIAGNÓSTICO GENERAL:",
    "FORTALEZAS OPERACIONALES:"
  )

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

  const impact = extractSection(
    analysis,
    "IMPACTO OPERACIONAL:",
    "PLAN DE DESARROLLO SUGERIDO:"
  )

  const development = extractSection(
    analysis,
    "PLAN DE DESARROLLO SUGERIDO:",
    "CURSOS RECOMENDADOS:"
  )

  const courses = extractSection(
    analysis,
    "CURSOS RECOMENDADOS:",
    "RECOMENDACIÓN PARA SUPERVISOR:"
  )

  const supervisor = extractSection(
    analysis,
    "RECOMENDACIÓN PARA SUPERVISOR:",
    "CONCLUSIÓN FINAL:"
  )

  const conclusion = extractSection(
    analysis,
    "CONCLUSIÓN FINAL:"
  )

  /* ======================================
  RADAR
  ====================================== */

  const radar =
    data.radar || ""

  /* ======================================
  TABLA EVALUACIONES
  ====================================== */

  const evaluationsTable =
    buildEvaluationsTable(
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
    /{{color}}/gi,
    getColor(data.traffic?.color)
  )

  .replace(
    /{{trafficClass}}/gi,
    getTrafficClass(data.traffic?.color)
  )

  .replace(
    /{{radar}}/gi,
    radar
  )

  .replace(
    /{{diagnostic}}/gi,
    diagnostic
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
    /{{impact}}/gi,
    impact
  )

  .replace(
    /{{development}}/gi,
    development
  )

  .replace(
    /{{courses}}/gi,
    courses
  )

  .replace(
    /{{supervisor}}/gi,
    supervisor
  )

  .replace(
    /{{conclusion}}/gi,
    conclusion
  )

  .replace(
    /{{evaluationsTable}}/gi,
    evaluationsTable
  )

  /* ======================================
  LIMPIEZA FINAL
  ====================================== */

  html = html.replace(
    /{{.*?}}/g,
    ""
  )

  return html

}