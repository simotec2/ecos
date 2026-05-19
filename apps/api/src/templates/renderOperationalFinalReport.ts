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
            ${getEvaluationName(e.type)}
          </td>

          <td>
            ${Math.round(e.score)}%
          </td>

          <td>
            ${e.traffic?.color || ""}
          </td>

        </tr>

      `).join("")}

    </table>

  `

}

/* ======================================
TOP COMPETENCIAS
====================================== */
function buildTopHTML(
  competencies:any[]
){

  return competencies.map((c:any)=>`

    <div style="
      margin-bottom:14px;
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        margin-bottom:5px;
      ">

        <span style="
          font-size:11px;
          font-weight:bold;
          color:#0f172a;
        ">
          ${c.name}
        </span>

        <span style="
          font-size:11px;
          color:#0f172a;
        ">
          ${c.score}%
        </span>

      </div>

      <div style="
        height:11px;
        background:#dcfce7;
        border-radius:20px;
        overflow:hidden;
      ">

        <div style="
          width:${c.score}%;
          background:#16a34a;
          height:100%;
        "></div>

      </div>

    </div>

  `).join("")

}

/* ======================================
BOTTOM COMPETENCIAS
====================================== */
function buildBottomHTML(
  competencies:any[]
){

  return competencies.map((c:any)=>`

    <div style="
      margin-bottom:14px;
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        margin-bottom:5px;
      ">

        <span style="
          font-size:11px;
          font-weight:bold;
          color:#0f172a;
        ">
          ${c.name}
        </span>

        <span style="
          font-size:11px;
          color:#0f172a;
        ">
          ${c.score}%
        </span>

      </div>

      <div style="
        height:11px;
        background:#fee2e2;
        border-radius:20px;
        overflow:hidden;
      ">

        <div style="
          width:${c.score}%;
          background:#dc2626;
          height:100%;
        "></div>

      </div>

    </div>

  `).join("")

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
  TABLA
  ====================================== */

  const evaluationsTable =
    buildEvaluationsTable(
      data.evaluations || []
    )

  /* ======================================
  TOP / BOTTOM
  ====================================== */

  const topHTML =
    buildTopHTML(
      data.topCompetencies || []
    )

  const bottomHTML =
    buildBottomHTML(
      data.bottomCompetencies || []
    )

  /* ======================================
  RADAR
  ====================================== */

  const radar =
    data.radar || ""

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

  .replace(
    /{{topCompetencies}}/gi,
    topHTML
  )

  .replace(
    /{{bottomCompetencies}}/gi,
    bottomHTML
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