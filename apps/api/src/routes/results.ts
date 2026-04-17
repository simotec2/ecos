import { Router } from "express"
import prisma from "../db"

const router = Router()

/* ======================================
PUBLIC VIEW (SIN TOKEN - SOLO DEV)
====================================== */
router.get("/public/:id", async (req, res) => {

  try {

    const { id } = req.params

    const result = await prisma.evaluationResult.findUnique({
      where: { id },
      include: {
        participant: {
          include: { company: true }
        },
        evaluation: true
      }
    })

    if (!result) {
      return res.status(404).json({ error: "Resultado no encontrado" })
    }

    return res.json(result)

  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Error obteniendo resultado" })
  }
})
/*
=====================================
LISTAR RESULTADOS (SOLO ÚLTIMOS)
=====================================
*/
router.get("/", async (req, res) => {

  try {

    const results = await prisma.evaluationResult.findMany({
      include:{
        participant:{
          include:{ company:true }
        },
        evaluation:true
      },
      orderBy:{ createdAt:"desc" }
    })

    const map = new Map()

    for(const r of results){

      const key = `${r.participantId}-${r.evaluationId}`

      if(!map.has(key)){
        map.set(key, r)
      }

    }

    return res.json(Array.from(map.values()))

  } catch (error) {

    console.error("RESULTS LIST ERROR:", error)

    return res.status(500).json({
      error:"Error obteniendo resultados"
    })

  }

})

/*
=====================================
RESULTADOS AGRUPADOS (ESTABLE)
=====================================
*/
router.get("/grouped", async (req,res)=>{

  try{

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const search = ((req.query.search as string) || "").toLowerCase()
    const company = ((req.query.company as string) || "").toLowerCase()

    /* 🔥 TRAEMOS SIN FILTRO (SIN ERRORES) */
    const results = await prisma.evaluationResult.findMany({
      include:{
        participant:{
          include:{ company:true }
        },
        evaluation:true
      },
      orderBy:{ createdAt:"desc" }
    })

    /* 🔥 SOLO ÚLTIMO */
    const map = new Map()

    for(const r of results){

      const key = `${r.participantId}-${r.evaluationId}`

      if(!map.has(key)){
        map.set(key, r)
      }

    }

    const filtered = Array.from(map.values())

    /* 🔥 AGRUPAR */
    const grouped:any = {}

    filtered.forEach((r:any)=>{

      const pid = r.participantId

      if(!grouped[pid]){
        grouped[pid] = {
          participantId: pid,
          name: `${r.participant?.nombre} ${r.participant?.apellido}`,
          company: r.participant?.company?.name || "Sin empresa",
          evaluations: []
        }
      }

      const data = JSON.parse(r.resultJson || "{}")

      grouped[pid].evaluations.push({
        id: r.id,
        name: r.evaluation?.name,
        score: data.score || 0,
        pdf: `${process.env.BASE_URL}/api/reports/${r.id}/pdf`
      })
    })

    let list = Object.values(grouped)

    /* 🔥 FILTRO EN BACKEND (100% SEGURO) */
    list = list.filter((g:any)=>{

      const name = (g.name || "").toLowerCase()
      const comp = (g.company || "").toLowerCase()

      if(search && !name.includes(search)) return false
      if(company && !comp.includes(company)) return false

      return true
    })

    /* 🔥 FINAL */
    list = list.map((g:any)=>{

      const scores = g.evaluations.map((e:any)=>e.score)

      const finalScore = scores.length
        ? Math.round(scores.reduce((a:number,b:number)=>a+b,0)/scores.length)
        : 0

      return{
        ...g,
        finalScore,
        finalPdf:`${process.env.BASE_URL}/api/final/${g.participantId}/pdf`
      }
    })

    /* 🔥 ORDEN */
    list.sort((a:any,b:any)=>a.finalScore - b.finalScore)

    /* 🔥 PAGINACIÓN */
    const start = (page-1)*limit
    const end = start + limit

    return res.json(list.slice(start,end))

  }catch(e){

    console.error("GROUPED ERROR:", e)

    res.status(500).json({
      error:"Error agrupando resultados"
    })

  }

})

/*
=====================================
ELIMINAR
=====================================
*/
router.delete("/:id", async (req,res)=>{

  try{

    await prisma.evaluationResult.delete({
      where:{ id:req.params.id }
    })

    res.json({ ok:true })

  }catch(e){

    console.error("DELETE ERROR:", e)

    res.status(500).json({
      error:"Error eliminando"
    })

  }

})
import fs from "fs"
import path from "path"
import { generateRadarImage } from "../services/radarGenerator"

export async function renderFinalReportHTML(data:any){

  const templatePath = path.join(__dirname,"..","templates","finalReportTemplate.html")
  let html = fs.readFileSync(templatePath,"utf-8")

  const participant = data.participant || {}
  const competencies = data.competencies || []

  /* =========================
  LOGO
  ========================= */
  const logoPath = path.join(__dirname,"..","..","assets","logos","ecos.png")
  const logoBase64 = fs.readFileSync(logoPath).toString("base64")
  const logo = `<img src="data:image/png;base64,${logoBase64}" style="height:50px;" />`

  /* =========================
  RADAR
  ========================= */
  let radarHTML = ""
  if(competencies.length > 0){
    const radar = await generateRadarImage(competencies)
    radarHTML = `<img src="${radar}" style="width:350px;margin:auto;display:block;" />`
  }

  /* =========================
  EVALUACIONES
  ========================= */
  const evaluationsHTML = (data.evaluations || []).map((e:any)=>`
    <div style="margin-bottom:8px;">
      ${e.type}: <b>${Math.round(e.score)}%</b>
    </div>
  `).join("")

  /* =========================
  COLOR
  ========================= */
  function getColor(c:string){
    if(c==="VERDE") return "#16a34a"
    if(c==="AMARILLO") return "#f59e0b"
    return "#dc2626"
  }

  /* =========================
  REEMPLAZOS
  ========================= */
  html = html
    .replace(/{{logo}}/g, logo)
    .replace(/{{participant}}/g, `${participant.nombre} ${participant.apellido}`)
    .replace(/{{company}}/g, participant.company?.name || "")
    .replace(/{{score}}/g, data.score)
    .replace(/{{color}}/g, getColor(data.traffic.color))
    .replace(/{{result}}/g, data.traffic.result)
    .replace(/{{evaluations}}/g, evaluationsHTML)
    .replace(/{{radar}}/g, radarHTML)
    .replace(/{{analysis}}/g, data.analysis || "")

  return html
}
export default router