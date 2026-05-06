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

  let html = fs.readFileSync(templatePath,"utf-8")

  const participant = data.participant || {}

  const today = new Date().toLocaleDateString("es-CL")

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

  const logoBase64 = fs.readFileSync(logoPath).toString("base64")

  const logo = `
    <img
      src="data:image/png;base64,${logoBase64}"
      style="height:55px;"
    />
  `

  /* ======================================
  ANALISIS
  ====================================== */

  const analysis = (data.analysis || "")
    .replace(/\n/g,"<br/>")

  /* ======================================
  REEMPLAZOS
  ====================================== */

      /* ======================================
  REEMPLAZOS
  ====================================== */

  html = html

    .replace(/{{\s*logo\s*}}/g, logo)

    .replace(
      /{{\s*participant\s*}}/g,
      `${participant.nombre || ""} ${participant.apellido || ""}`
    )

    .replace(
      /{{\s*company\s*}}/g,
      participant.company?.name || ""
    )

    .replace(
      /__DATE__/g,
      today
    )

    .replace(
      /{{\s*score\s*}}/g,
      String(data.score || 0)
    )

    .replace(
      /{{\s*result\s*}}/g,
      data.traffic?.result || ""
    )

    .replace(
      /{{\s*color\s*}}/g,
      getColor(data.traffic?.color)
    )

    .replace(
      /{{\s*analysis\s*}}/g,
      analysis
    )

    .replace(
      /{{\s*radar\s*}}/g,
      data.radar || ""
    )

  /* ======================================
  LIMPIEZA FINAL
  ====================================== */

  html = html.replace(/{{.*?}}/g,"")

  return html

}