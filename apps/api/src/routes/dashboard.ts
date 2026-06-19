import { Router } from "express"
import prisma from "../db"
import { authMiddleware } from "../auth"
import { requirePermission } from "../permissions"

const router = Router()

/* ================= CONSOLIDADOR ================= */
function consolidateResults(results:any[]){

  const byType:Record<string, number> = {}

  results.forEach(r=>{

    const type = r.evaluation?.type
    const score = Number(r.score)

    if(!type || isNaN(score)) return

    if(byType[type] === undefined){
      byType[type] = score
    }

  })

  const scores = Object.values(byType)

  if(scores.length === 0){
    return null
  }

  const sum = scores.reduce((a,b)=>a+b,0)
  const finalScore = sum / scores.length

  let estado:"VERDE" | "AMARILLO" | "ROJO" = "VERDE"

  if(finalScore < 55){
    estado = "ROJO"
  }else if(finalScore < 85){
    estado = "AMARILLO"
  }

  return {
    score: Math.round(finalScore),
    estado
  }

}

/* ================= PARSE RESULT JSON ================= */
function parseResultJson(r:any){

  try{

    if(!r?.resultJson){
      return {}
    }

    return typeof r.resultJson === "string"
      ? JSON.parse(r.resultJson)
      : r.resultJson

  }catch{

    return {}

  }

}

/* ================= COMPETENCIAS ================= */
function getCompetencias(results:any[]){

  const map:any = {}

  results.forEach(r=>{

    const raw = parseResultJson(r)

    const comps =
      raw?.competencies ||
      raw?.competencias ||
      []

    comps.forEach((c:any)=>{

      const name =
        c?.name ||
        c?.nombre ||
        c?.competency ||
        c?.competencia

      const score = Number(
        c?.score ??
        c?.puntaje ??
        0
      )

      if(!name || isNaN(score)){
        return
      }

      if(!map[name]){
        map[name] = []
      }

      map[name].push(score)

    })

  })

  const avg = Object.entries(map).map(([name,arr]:any)=>({

    name,

    score:
      arr.reduce((a:number,b:number)=>a+b,0)
      / arr.length

  }))

  const sorted =
    avg.sort((a,b)=>b.score-a.score)

  return {

    top:
      sorted.slice(0,5),

    bottom:
      sorted.slice(-5).reverse()

  }

}

/* ================= RECOMENDACIÓN EMPRESA ================= */
function getCompanyRecommendation(rojoPct:number){

  if(rojoPct > 50){

    return "Nivel crítico. Se recomienda intervención inmediata, reentrenamiento y supervisión operativa."

  }

  if(rojoPct > 25){

    return "Riesgo moderado. Implementar refuerzo en competencias críticas."

  }

  return "Nivel controlado. Mantener estándar operacional y monitoreo."

}

/* ================= DASHBOARD ================= */
router.get(
  "/",
  authMiddleware,
  requirePermission("DASHBOARD_VIEW"),
  async (req:any,res)=>{

  try{

    const user = req.user

    if(!user){

      return res.status(401).json({
        error:"No autorizado"
      })

    }

    let participantWhere:any = {}

    if(user.role === "COMPANY_ADMIN"){

      if(!user.companyId){

        return res.status(403).json({
          error:"Usuario empresa sin empresa asignada"
        })

      }

      participantWhere.companyId = user.companyId

    }

    const participants = await prisma.participant.findMany({

      where: participantWhere,

      include:{
        company:true
      },

      orderBy:{
        createdAt:"desc"
      }

    })

    const participantIds =
      participants.map(p=>p.id)

    const participantMap:any = {}

    participants.forEach(p=>{
      participantMap[p.id] = p
    })

    const allResults = await prisma.evaluationResult.findMany({

      where:{
        participantId:{
          in: participantIds
        }
      },

      include:{
        evaluation:true
      },

      orderBy:{
        createdAt:"desc"
      }

    })

    const grouped:any = {}

    allResults.forEach(r=>{

      if(!grouped[r.participantId]){
        grouped[r.participantId] = []
      }

      grouped[r.participantId].push(r)

    })

    const consolidated:any[] = []

    Object.entries(grouped).forEach(
      ([participantId, results]:any)=>{

      const final = consolidateResults(results)

      if(!final) return

      const participant = participantMap[participantId]

      consolidated.push({

        participantId,

        participantName:
          `${participant?.nombre || ""} ${participant?.apellido || ""}`.trim(),

        companyId: participant?.companyId,

        companyName: participant?.company?.name,

        ...final

      })

    })

    let verde = 0
    let amarillo = 0
    let rojo = 0

    consolidated.forEach(r=>{

      if(r.estado === "VERDE"){
        verde++
      }else if(r.estado === "AMARILLO"){
        amarillo++
      }else{
        rojo++
      }

    })

    const total = participants.length
    const rendidos = consolidated.length
    const pendientes = Math.max(0,total - rendidos)

    const companyMap:any = {}

    consolidated.forEach(r=>{

      if(!r.companyId) return

      if(!companyMap[r.companyId]){

        companyMap[r.companyId] = {

          id: r.companyId,

          name: r.companyName || "Sin empresa",

          total: 0,

          verde: 0,

          amarillo: 0,

          rojo: 0

        }

      }

      companyMap[r.companyId].total++

      if(r.estado === "VERDE"){
        companyMap[r.companyId].verde++
      }else if(r.estado === "AMARILLO"){
        companyMap[r.companyId].amarillo++
      }else{
        companyMap[r.companyId].rojo++
      }

    })

    const companies = Object.values(companyMap).map((c:any)=>{

      const rojoPct = c.total > 0
        ? Math.round((c.rojo / c.total) * 100)
        : 0

      return {

        ...c,

        riesgo: rojoPct,

        recomendacion:
          getCompanyRecommendation(rojoPct)

      }

    })

    let currentCompany:any = null

    if(user.companyId){

      currentCompany = await prisma.company.findUnique({
        where:{
          id:user.companyId
        }
      })

    }

    return res.json({

      ok:true,

      data:{

        scope:
          user.role === "COMPANY_ADMIN"
            ? "COMPANY"
            : "GLOBAL",

        company: currentCompany
          ? {
              id: currentCompany.id,
              name: currentCompany.name
            }
          : null,

        kpis:{
          total,
          rendidos,
          pendientes,
          verde,
          amarillo,
          rojo
        },

        semaforo:{
          verde,
          amarillo,
          rojo
        },

        competencias:
          getCompetencias(allResults),

        companies,

        participantes: consolidated

      }

    })

  }catch(err){

    console.error("DASHBOARD ERROR:", err)

    return res.status(500).json({
      error:"Error dashboard"
    })

  }

})

export default router