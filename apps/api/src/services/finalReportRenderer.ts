import fs from "fs"
import path from "path"

function getColor(color:string){

  if(color === "VERDE") return "#16a34a"

  if(color === "AMARILLO") return "#f59e0b"

  return "#dc2626"

}

export async function renderFinalReportHTML(data:any){

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

  const participant = data.participant || {}

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

  const logoBase64 = fs.readFileSync(
    logoPath
  ).toString("base64")

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
  FECHA REAL
  ====================================== */

  const reportDate =
    data.date || ""

  /* ======================================
  RADAR
  ====================================== */

  const radar =
    data.radar || ""

  /* ======================================
  REEMPLAZOS
  ====================================== */

  html = html

    .replace(/{{logo}}/g, logo)

    .replace(
      /{{participant}}/g,
      `${participant.nombre || ""} ${participant.apellido || ""}`
    )

    .replace(
      /{{company}}/g,
      participant.company?.name || ""
    )

    .replace(
      /{{date}}/g,
      reportDate
    )

    .replace(
      /{{score}}/g,
      String(data.score || 0)
    )

    .replace(
      /{{result}}/g,
      data.traffic?.result || ""
    )

    .replace(
      /{{color}}/g,
      getColor(data.traffic?.color)
    )

    .replace(
      /{{analysis}}/g,
      analysis
    )

    .replace(
      /{{radar}}/g,
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