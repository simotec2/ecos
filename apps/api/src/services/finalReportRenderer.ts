import fs from "fs"
import path from "path"
import { generateRadarImage } from "./radarGenerator"

/* ======================================
MAPA NOMBRES
====================================== */
const evaluationLabels:any = {
  PETS: "Evaluación Conductual",
  ICOM: "Perfil Psicolaboral",
  SECURITY: "Evaluación de Seguridad Operacional"
}

export async function renderFinalReportHTML(data:any){

  const templatePath = path.join(__dirname,"..","templates","finalReportTemplate.html")
  let html = fs.readFileSync(templatePath,"utf-8")

  const participant = data.participant || {}
  const competencies = data.competencies || []

  /* LOGO */
  const logoPath = path.join(__dirname,"..","..","assets","logos","ecos.png")
  const logoBase64 = fs.readFileSync(logoPath).toString("base64")
  const logo = `<img src="data:image/png;base64,${logoBase64}" style="height:50px;" />`

  /* RADAR */
  let radarHTML = ""
  if(competencies.length > 0){
    const radar = await generateRadarImage(competencies)
    radarHTML = `<img src="${radar}" style="width:350px;margin:auto;display:block;" />`
  }

  /* EVALUACIONES */
  const evaluationsHTML = (data.evaluations || []).map((e:any)=>`
    <div style="margin-bottom:8px;">
      ${evaluationLabels[e.type] || e.type}: <b>${Math.round(e.score)}%</b>
    </div>
  `).join("")

  /* COLOR */
  function getColor(c:string){
    if(c==="VERDE") return "#16a34a"
    if(c==="AMARILLO") return "#f59e0b"
    return "#dc2626"
  }

  html = html
    .replace(/{{logo}}/g, logo)
    .replace(/{{participant}}/g, `${participant.nombre} ${participant.apellido}`)
    .replace(/{{company}}/g, participant.company?.name || "")
    .replace(/{{score}}/g, data.score)
    .replace(/{{color}}/g, getColor(data.traffic.color))
    .replace(/{{result}}/g, data.traffic.result)
    .replace(/{{evaluations}}/g, evaluationsHTML)
    .replace(/{{radar}}/g, radarHTML)
    .replace(/{{analysis}}/g, `
  <div style="line-height:1.6; font-size:14px;">
    ${ (data.analysis || "")
      .replace(/Metodología[\s\S]*?Recomendaciones/gi,"")
      .replace(/Introducción[\s\S]*?Conclusiones/gi,"")
      .replace(/empresa/gi,"participante")
    }
  </div>
`)

  return html
}