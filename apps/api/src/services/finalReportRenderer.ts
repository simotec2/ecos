import fs from "fs"
import path from "path"

function getColor(color:string){

  if(color === "VERDE") return "#16a34a"
  if(color === "AMARILLO") return "#f59e0b"

  return "#dc2626"

}

function clean(text:string){

  return (text || "")
    .replace(/[#*]/g,"")
    .replace(/\n/g,"<br/>")
    .replace(/Recomendaciones:/gi,"")
    .replace(/Conclusión:/gi,"")
    .trim()

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
  ANALISIS IA
  ====================================== */

  const rawAnalysis = data.analysis || ""

  /* ======================================
  EXTRAER RECOMENDACIONES
  ====================================== */

  let recommendations = ""
  let conclusion = ""

  const recRegex = /Recomendaciones:(.*?)(Conclusión:|$)/is
  const conclRegex = /Conclusión:(.*)$/is

  const recMatch = rawAnalysis.match(recRegex)
  const conclMatch = rawAnalysis.match(conclRegex)

  if(recMatch){

    recommendations = clean(recMatch[1])

  }

  if(conclMatch){

    conclusion = clean(conclMatch[1])

  }

  /* ======================================
  BLOQUE RECOMENDACIONES
  ====================================== */

  const recommendationsBlock = recommendations
    ? `
      <div class="card section-yellow">

        <h3>Recomendaciones</h3>

        <div class="analysis">
          ${recommendations}
        </div>

      </div>
    `
    : ""

  /* ======================================
  BLOQUE CONCLUSION
  ====================================== */

  const conclusionBlock = conclusion
    ? `
      <div class="card section-green">

        <h3>Conclusión Ejecutiva</h3>

        <div class="analysis">
          ${conclusion}
        </div>

      </div>
    `
    : ""

  /* ======================================
  REEMPLAZOS
  ====================================== */

  html = html

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
      today
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
      /{{radar}}/g,
      data.radar || ""
    )

    .replace(
      /{{recommendationsBlock}}/g,
      recommendationsBlock
    )

    .replace(
      /{{conclusionBlock}}/g,
      conclusionBlock
    )

  /* ======================================
  LIMPIEZA FINAL
  ====================================== */

  html = html.replace(/{{.*?}}/g,"")

  return html

}