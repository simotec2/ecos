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
    participant.perfil ||
    participant.profile ||
    ""

  /* ======================================
  FECHA REAL
  ====================================== */

  const reportDate = data.date
    ? new Date(data.date)
        .toLocaleDateString("es-CL")
    : ""

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

  const analysis = (
    data.analysis || ""
  ).replace(/\n/g,"<br/>")

  /* ======================================
  RADAR
  ====================================== */

  const radar = data.radar || ""

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
    reportDate
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
    /{{analysis}}/gi,
    analysis
  )

  .replace(
    /{{radar}}/gi,
    radar
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