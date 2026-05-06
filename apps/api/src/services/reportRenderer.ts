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

  if(color === "VERDE") return "#16a34a"

  if(color === "AMARILLO") return "#f59e0b"

  return "#dc2626"

}

function getDecision(score:number){

  if(score >= 85){

    return {
      text:"RECOMENDABLE",
      color:"#16a34a"
    }

  }

  if(score >= 55){

    return {
      text:"RECOMENDABLE CON OBSERVACIONES",
      color:"#f59e0b"
    }

  }

  return {
    text:"NO RECOMENDABLE",
    color:"#dc2626"
  }

}

/* ======================================
RENDER
====================================== */
export async function renderReportHTML(data:any){

  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "reportTemplate.html"
  )

  let html = fs.readFileSync(
    templatePath,
    "utf-8"
  )

  const participant = data.participant || {}

  const competencies = data.competencies || []

  const evaluationName =
    evaluationLabels[data.type] ||
    data.evaluationName ||
    ""

  /* ======================================
  FECHA REAL
  ====================================== */

  const reportDate = data.createdAt
    ? new Date(data.createdAt)
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

  const logoBase64 = fs.readFileSync(
    logoPath
  ).toString("base64")

  const logo = `
    <img
      src="data:image/png;base64,${logoBase64}"
      style="height:45px;"
    />
  `

  /* ======================================
  RADAR
  ====================================== */

  let radarHTML = ""

  if(competencies.length > 0){

    const radar = await generateRadarImage(
      competencies
    )

    radarHTML = `
      <img
        src="${radar}"
        style="width:450px;margin:auto;display:block;"
      />
    `

  }

  /* ======================================
  ORDEN COMPETENCIAS
  ====================================== */

  const sorted = [...competencies]
    .sort((a,b)=>b.score - a.score)

  const top = sorted.slice(0,3)

  const bottom = sorted
    .slice()
    .reverse()
    .filter(
      b => !top.some(
        t => t.name === b.name
      )
    )
    .slice(0,3)

  const topHTML = top.map(c=>`
    <div style="color:#16a34a;">
      • ${c.name} (${Math.round(c.score)}%)
    </div>
  `).join("")

  const bottomHTML = bottom.map(c=>`
    <div style="color:#dc2626;">
      • ${c.name} (${Math.round(c.score)}%)
    </div>
  `).join("")

  /* ======================================
  KPI
  ====================================== */

  const score = Math.round(
    data.score || 0
  )

  const result =
    data.traffic?.result || ""

  const decision = getDecision(score)

  const kpiHTML = `
    <div style="display:flex;gap:10px;">

      <div style="
        flex:1;
        background:#f3f4f6;
        padding:8px;
        border-radius:6px;
        text-align:center;
      ">
        <div style="font-size:11px;">
          Puntaje
        </div>

        <div style="
          font-size:18px;
          font-weight:bold;
        ">
          ${score}%
        </div>
      </div>

      <div style="
        flex:1;
        background:#f3f4f6;
        padding:8px;
        border-radius:6px;
        text-align:center;
      ">
        <div style="font-size:11px;">
          Resultado
        </div>

        <div style="
          font-weight:bold;
          color:${getColor(data.traffic?.color)};
        ">
          ${result}
        </div>
      </div>

    </div>

    <div style="
      margin-top:8px;
      padding:6px;
      border-radius:6px;
      text-align:center;
      font-weight:bold;
      font-size:12px;
      color:white;
      background:${decision.color};
    ">
      ${decision.text}
    </div>
  `

  /* ======================================
  RESUMEN
  ====================================== */

  const resumenHTML = `
    <div style="margin-bottom:4px;">
      <b>Desempeño general:</b>
      ${score}%
    </div>

    <div style="margin-bottom:3px;">
      <b>Fortalezas:</b>
      ${top.map(t=>t.name).join(", ")}
    </div>

    <div>
      <b>Brechas:</b>
      ${bottom.map(b=>b.name).join(", ")}
    </div>
  `

  /* ======================================
  ANALISIS
  ====================================== */

  const analysis = clean(
    data.analysis ||
    data.aiText ||
    ""
  )

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
      /{{evaluation}}/g,
      evaluationName
    )

    .replace(
      /{{date}}/g,
      reportDate
    )

    .replace(
      /{{result}}/g,
      result
    )

    .replace(
      /{{color}}/g,
      getColor(data.traffic?.color)
    )

    .replace(
      /{{kpi}}/g,
      kpiHTML
    )

    .replace(
      /{{resumen}}/g,
      resumenHTML
    )

    .replace(
      /{{radar}}/g,
      radarHTML
    )

    .replace(
      /{{top}}/g,
      topHTML
    )

    .replace(
      /{{bottom}}/g,
      bottomHTML
    )

    .replace(
      /{{analysis}}/g,
      `
      <div style="
        line-height:1.6;
        font-size:11.5px;
        text-align:justify;
      ">
        ${analysis}
      </div>
      `
    )

  /* ======================================
  LIMPIEZA FINAL
  ====================================== */

  html = html.replace(/{{.*?}}/g,"")

  return html

}