import fs from "fs"
import path from "path"

function getColor(color:string){
  if(color==="VERDE") return "#16a34a"
  if(color==="AMARILLO") return "#f59e0b"
  return "#dc2626"
}

export async function renderFinalReportHTML(data:any){

  const templatePath = path.join(__dirname,"..","templates","finalReportTemplate.html")
  let html = fs.readFileSync(templatePath,"utf-8")

  const participant = data.participant || {}
  const today = new Date().toLocaleDateString("es-CL")

  /* 🔥 LIMPIAR ANALISIS */
  const analysis = (data.analysis || "")
    .replace(/\n/g,"<br/>")

  /* 🔥 EXTRAER RECOMENDACIONES Y CONCLUSION */
  let recommendations = ""
  let conclusion = ""

  const recMatch = analysis.split("Recomendaciones:")
  if(recMatch.length > 1){
    const parts = recMatch[1].split("Conclusión:")
    recommendations = parts[0] || ""
    conclusion = parts[1] || ""
  }

  html = html
    .replace(/{{participant}}/g, `${participant.nombre || ""} ${participant.apellido || ""}`)
    .replace(/{{company}}/g, participant.company?.name || "")
    .replace(/{{date}}/g, today)
    .replace(/{{score}}/g, String(data.score || 0))
    .replace(/{{result}}/g, data.traffic?.result || "")
    .replace(/{{color}}/g, getColor(data.traffic?.color))
    .replace(/{{analysis}}/g, analysis)
    .replace(/{{recommendations}}/g, recommendations)
    .replace(/{{conclusion}}/g, conclusion)

  /* limpieza final */
  html = html.replace(/{{.*?}}/g, "")

  return html
}