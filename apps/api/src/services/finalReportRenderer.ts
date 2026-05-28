import fs from "fs"
import path from "path"
import { safeText } from "../utils/safeText"

function getColor(color:string){

  if(color === "VERDE"){
    return "#16a34a"
  }

  if(color === "AMARILLO"){
    return "#f59e0b"
  }

  return "#dc2626"

}

export async function renderFinalReportHTML(data:any){

  /* ======================================
  TEMPLATE
  ====================================== */

  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "finalReportTemplate.html"
  )

  let html = fs.readFileSync(
    templatePath,
    "utf-8"
  )

  /* ======================================
  PARTICIPANTE
  ====================================== */

  const participant = data.participant || {}

  const participantProfile =
    safeText(
      participant.perfil ||
      participant.profile ||
      ""
    )

  /* ======================================
  FECHA
  ====================================== */

  const reportDate = safeText(
    data.date || ""
  )

  console.log("FINAL REPORT:", {
    participant,
    participantProfile,
    reportDate
  })

  /* ======================================
  COLOR RESULTADO
  ====================================== */

  const resultColor = getColor(
    data.traffic?.color || ""
  )

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
  ANALISIS
  ====================================== */

  const analysis = safeText(
    data.analysis
  ).replace(/\n/g,"<br/>")

  /* ======================================
  RADAR
  ====================================== */

  const radar = safeText(
    data.radar || ""
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
      `
      ${safeText(participant.nombre)}
      ${safeText(participant.apellido)}
      `
    )

    .replace(
      /{{profile}}/gi,
      participantProfile
    )

    .replace(
      /{{company}}/gi,
      safeText(
        participant.company?.name || ""
      )
    )

    .replace(
      /{{date}}/gi,
      reportDate
    )

    .replace(
      /{{score}}/gi,
      safeText(data.score || 0)
    )

    .replace(
      /{{result}}/gi,
      safeText(
        data.traffic?.result || ""
      )
    )

    .replace(
      /{{analysis}}/gi,
      analysis
    )

    .replace(
      /{{radar}}/gi,
      radar
    )

    .replace(
      /{{resultStyle}}/g,
      `background-color:${resultColor};`
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