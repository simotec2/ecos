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

/* ======================================
UTILS
====================================== */
function clean(text:string){
  return (text || "")
    .replace(/[#*]/g,"")
    .replace(/\n/g,"<br/>")
    .trim()
}

function getColor(color:string){
  if(color==="VERDE") return "#16a34a"
  if(color==="AMARILLO") return "#f59e0b"
  return "#dc2626"
}

function getDecision(score:number){
  if(score >= 85) return { text:"RECOMENDABLE", color:"#16a34a" }
  if(score >= 55) return { text:"RECOMENDABLE CON OBSERVACIONES", color:"#f59e0b" }
  return { text:"NO RECOMENDABLE", color:"#dc2626" }
}

/* ======================================
RENDER
====================================== */
export async function renderReportHTML(data:any){

  const templatePath = path.join(__dirname,"..","templates","reportTemplate.html")
  let html = fs.readFileSync(templatePath,"utf-8")

  const participant = data.participant || {}
  const competencies = data.competencies || []

  const evaluationName =
    evaluationLabels[data.type] ||
    data.evaluationName ||
    ""

  /* LOGO */
  const logoPath = path.join(__dirname,"..","..","assets","logos","ecos.png")
  const logoBase64 = fs.readFileSync(logoPath).toString("base64")
  const logo = `<img src="data:image/png;base64,${logoBase64}" style="height:45px;" />`

  /* RADAR */
  let radarHTML = ""
  if(competencies.length > 0){
    const radar = await generateRadarImage(competencies)
    radarHTML = `<img src="${radar}" style="width:280px;margin:auto;display:block;" />`
  }

  /* ORDEN */
  const sorted = [...competencies].sort((a,b)=>b.score - a.score)
  let top = sorted.slice(0,3)
let bottom = sorted.slice(-3).reverse()

// 🔥 evitar duplicados cuando hay pocas competencias
if(sorted.length <= 3){
  bottom = sorted.filter(c => !top.includes(c))
}
  const topHTML = top.map(c=>`
    <div style="color:#16a34a;">${c.name} (${Math.round(c.score)}%)</div>
  `).join("")

  const bottomHTML = bottom.map(c=>`
    <div style="color:#dc2626;">${c.name} (${Math.round(c.score)}%)</div>
  `).join("")

  /* KPI */
  const score = Math.round(data.score || 0)
  const result = data.traffic?.result || ""
  const decision = getDecision(score)

  const kpiHTML = `
    <div style="display:flex;gap:12px;">

      <div style="flex:1;background:#f3f4f6;padding:10px;border-radius:6px;text-align:center;">
        <div style="font-size:12px;">Puntaje</div>
        <div style="font-size:20px;font-weight:bold;">${score}%</div>
      </div>

      <div style="flex:1;background:#f3f4f6;padding:10px;border-radius:6px;text-align:center;">
        <div style="font-size:12px;">Resultado</div>
        <div style="font-weight:bold;color:${getColor(data.traffic?.color)};">
          ${result}
        </div>
      </div>

    </div>

    <div style="
      margin-top:10px;
      padding:8px;
      border-radius:6px;
      text-align:center;
      font-weight:bold;
      font-size:13px;
      color:white;
      background:${decision.color};
    ">
      DECISIÓN: ${decision.text}
    </div>
  `

  /* PERFIL */
  const perfilHTML = `
    <div style="font-size:13px;">
      <b>${participant.nombre || ""} ${participant.apellido || ""}</b><br/>
      ${evaluationName}<br/>
      ${participant.company?.name || ""}
    </div>
  `

  /* RESUMEN */
  const resumenHTML = `
    <div style="margin-bottom:5px;">
      <b>Desempeño general:</b> ${score}%
    </div>

    <div style="margin-bottom:3px;">
      <b>Fortalezas clave:</b> ${top.map(t=>t.name).join(", ")}
    </div>

    <div>
      <b>Principales brechas:</b> ${bottom.map(b=>b.name).join(", ")}
    </div>
  `

  const analysis = clean(data.analysis || data.aiText || "")

  html = html
    .replace(/{{logo}}/g, logo)
    .replace(/{{perfil}}/g, perfilHTML)
    .replace(/{{participant}}/g, `${participant.nombre || ""} ${participant.apellido || ""}`)
    .replace(/{{company}}/g, participant.company?.name || "")
    .replace(/{{evaluation}}/g, evaluationName)
    .replace(/{{kpi}}/g, kpiHTML)
    .replace(/{{resumen}}/g, resumenHTML)
    .replace(/{{radar}}/g, radarHTML)
    .replace(/{{top}}/g, topHTML)
    .replace(/{{bottom}}/g, bottomHTML)
    .replace(/{{analysis}}/g, `<div style="line-height:1.5;">${analysis}</div>`)

  return html
}