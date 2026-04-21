import { Router } from "express"
import prisma from "../db"
import chromium from "@sparticuz/chromium"
import puppeteer from "puppeteer-core"
import fs from "fs"
import path from "path"
import { generateRadarImage } from "../services/radarGenerator"
import { generateAIReport } from "../services/aiEngine"

const router = Router()
function formatAnalysisHTML(text:string){

  if(!text) return ""

  let html = text

  /* TITULOS EN NEGRITA */
  html = html
    .replace(/Diagnóstico General:/gi, "<b>Diagnóstico General:</b><br/>")
    .replace(/Impacto en Desempeño y Riesgos:/gi, "<br/><b>Impacto en Desempeño y Riesgos:</b><br/>")
    .replace(/Recomendaciones:/gi, "<br/><b>Recomendaciones:</b><br/>")
    .replace(/Conclusión:/gi, "<br/><b>Conclusión:</b><br/>")
    .replace(/Resultados:/gi, "<br/><b>Resultados:</b><br/>")

  /* LISTAS */
  html = html.replace(/- (.*?)(\n|$)/g, "<li>$1</li>")

  /* ENVOLVER LISTA */
  html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")

  /* SALTOS DE LINEA */
  html = html.replace(/\n/g, "<br/>")

  return html
}

/* ======================================
UTILS
====================================== */
function calculateTraffic(score:number){
  if(score >= 85) return { color:"VERDE", label:"RECOMENDABLE" }
  if(score >= 55) return { color:"AMARILLO", label:"RECOMENDABLE CON OBSERVACIONES" }
  return { color:"ROJO", label:"NO RECOMENDABLE" }
}

function getColorHex(color:string){
  if(color==="VERDE") return "#16a34a"
  if(color==="AMARILLO") return "#f59e0b"
  return "#dc2626"
}

/* ======================================
IA FINAL PROFESIONAL
====================================== */
async function buildFinalAnalysisIA(evaluations:any[], finalScore:number){

  const prompt = `
Eres un psicólogo laboral senior experto en evaluación de competencias en minería.

Redacta un INFORME EJECUTIVO PROFESIONAL.

REGLAS:
- NO saludar
- NO hacer preguntas
- NO lenguaje conversacional
- NO markdown
- tono formal, técnico, ejecutivo
- máximo 2 párrafos + 3 recomendaciones

CONTEXTO:
Evaluaciones:
${evaluations.map(e=>`${e.name}: ${e.score}%`).join("\n")}

Puntaje final: ${finalScore}%

OBJETIVO:
- integrar resultados en un diagnóstico único
- explicar impacto en desempeño y seguridad
- identificar brechas de forma integrada
- entregar recomendaciones accionables

FORMATO:
Párrafo 1: Diagnóstico  
Párrafo 2: Impacto  
Recomendaciones:
- ...
- ...
- ...
`

  let text = await generateAIReport(prompt)

  /* LIMPIEZA */
  text = text
    .replace(/hola.*\n?/gi,"")
    .replace(/¿.*\?/gi,"")
    .replace(/\*\*/g,"")
    .trim()

  return text
}

/* ======================================
RENDER HTML
====================================== */
async function renderHTML(data:any){

  const templatePath = path.join(__dirname,"..","templates","finalReportTemplate.html")
  let html = fs.readFileSync(templatePath,"utf-8")

  const participant = data.participant

  const logoPath = path.join(__dirname,"..","..","assets","logos","ecos.png")
  const logoBase64 = fs.readFileSync(logoPath).toString("base64")
  const logo = `<img src="data:image/png;base64,${logoBase64}" style="height:55px;" />`

  let radarHTML = ""
  if(data.competencies.length){
    const radar = await generateRadarImage(data.competencies)
    radarHTML = `<img src="${radar}" style="width:500px;margin:auto;display:block;" />`
  }

  html = html
    .replace(/{{logo}}/g, logo)
    .replace(/{{participant}}/g, `${participant.nombre} ${participant.apellido}`)
    .replace(/{{perfil}}/g, participant.perfil || "")
    .replace(/{{company}}/g, participant.company?.name || "")
    .replace(/{{score}}/g, data.score)
    .replace(/{{result}}/g, data.traffic.label)
    .replace(/{{color}}/g, getColorHex(data.traffic.color))
    .replace(/{{radar}}/g, radarHTML)
    .replace(/{{analysis}}/g, formatAnalysisHTML(data.analysis))

  return html
}

/* ======================================
PDF FINAL
====================================== */
router.get("/:participantId/pdf", async (req,res)=>{

  try{

    const { participantId } = req.params

    const participant = await prisma.participant.findUnique({
      where:{ id:participantId },
      include:{ company:true }
    })

    if(!participant){
      return res.status(404).json({ error:"Participante no encontrado" })
    }

    const results = await prisma.evaluationResult.findMany({
      where:{ participantId },
      include:{ evaluation:true },
      orderBy:{ createdAt:"desc" }
    })

    if(!results.length){
      return res.status(404).json({ error:"Sin resultados" })
    }

    /* SOLO ÚLTIMO POR TIPO */
    const map:any = {}
    for(const r of results){
      const type = r.evaluation.type
      if(!map[type]) map[type] = r
    }

    const finalResults:any[] = Object.values(map)

    const evaluations = finalResults.map((r:any)=>{
      const data = JSON.parse(r.resultJson || "{}")
      return{
        name:r.evaluation.name,
        score: Math.round(data.score || 0),
        competencies: data.competencies || data.competenciasDetalle || []
      }
    })

    const scores = evaluations.map(e=>e.score)
    const finalScore = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)

    const traffic = calculateTraffic(finalScore)

    /* CONSOLIDAR COMPETENCIAS */
    const compMap:any = {}

    evaluations.forEach(e=>{
      (e.competencies || []).forEach((c:any)=>{
        if(!c?.name) return
        if(!compMap[c.name]) compMap[c.name] = []
        compMap[c.name].push(Number(c.score || 0))
      })
    })

    const competencies = Object.entries(compMap).map(([name,values]:any)=>({
      name,
      score: Math.round(values.reduce((a:number,b:number)=>a+b,0)/values.length)
    }))

    /* IA */
    const analysis = await buildFinalAnalysisIA(evaluations, finalScore)

    const html = await renderHTML({
      participant,
      score: finalScore,
      traffic,
      competencies,
      analysis
    })

    const browser = await puppeteer.launch({ headless:true })
    const page = await browser.newPage()

    await page.setContent(html,{ waitUntil:"networkidle0" })

    const pdf = await page.pdf({
      format:"letter",
      printBackground:true,
      margin:{ top:"20px", bottom:"20px", left:"20px", right:"20px" }
    })

    await browser.close()

    res.set({
      "Content-Type":"application/pdf",
      "Content-Disposition":"inline; filename=informe_final_ecos.pdf"
    })

    res.send(pdf)

  }catch(e){
    console.error(e)
    res.status(500).json({ error:"Error generando informe final" })
  }

})

export default router