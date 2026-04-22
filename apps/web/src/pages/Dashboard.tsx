import { Router } from "express"
import prisma from "../db"
import { verifyAccessToken } from "../utils/jwt"

const router = Router()

function getUser(req:any){
  try{
    const auth = req.headers.authorization || ""
    if(!auth.startsWith("Bearer ")) return null
    const token = auth.replace("Bearer ","")
    return verifyAccessToken(token)
  }catch{
    return null
  }
}

router.get("/", async (req,res)=>{

  try{

    const user:any = getUser(req)

    if(!user){
      return res.status(401).json({ error:"No autorizado" })
    }

    const companyFilter = user.role === "COMPANY_ADMIN"
      ? { companyId: user.companyId }
      : {}

    /* ================= PARTICIPANTES ================= */

    const participants = await prisma.participant.findMany({
      where: companyFilter
    })

    const participantIds = participants.map(p=>p.id)

    /* ================= EMPRESAS ================= */

    let empresas:any[] = []
    try{
      empresas = await prisma.company.findMany({
        select:{ id:true, name:true }
      })
    }catch(e){
      console.error("Error empresas:", e)
    }

    /* ================= ASIGNACIONES ================= */

    const assignments = await prisma.assignment.findMany({
      where:{
        participantId:{ in: participantIds }
      }
    })

    const totalEvaluaciones = assignments.length
    const pendientes = assignments.filter(a=>a.status !== "COMPLETED").length

    /* ================= RESULTADOS ================= */

    const results = await prisma.evaluationResult.findMany({
      where:{
        participantId:{ in: participantIds }
      }
    })

    let verde = 0
    let amarillo = 0
    let rojo = 0

    results.forEach(r=>{
      if(r.score >= 85) verde++
      else if(r.score >= 55) amarillo++
      else rojo++
    })

    /* ================= COMPETENCIAS SEGURAS ================= */

    const competencias:any = {}
    const competenciasMap:any = {}

    results.forEach(r=>{

      try{

        const json = typeof r.resultJson === "string"
          ? JSON.parse(r.resultJson)
          : r.resultJson

        if(!json) return

        const fuente =
          json.competencies ||
          json.competencias ||
          null

        if(fuente && typeof fuente === "object"){

          Object.entries(fuente).forEach(([name,value]:any)=>{

            if(!name) return
            if(typeof value !== "number") return

            if(!competenciasMap[name]){
              competenciasMap[name] = { total:0, count:0 }
            }

            competenciasMap[name].total += value
            competenciasMap[name].count++

          })
        }

        if(Array.isArray(json.competenciasDetalle)){

          json.competenciasDetalle.forEach((c:any)=>{

            if(!c?.name) return
            if(typeof c.score !== "number") return

            if(!competenciasMap[c.name]){
              competenciasMap[c.name] = { total:0, count:0 }
            }

            competenciasMap[c.name].total += c.score
            competenciasMap[c.name].count++

          })
        }

      }catch(e){
        console.error("Error parsing resultJson:", e)
      }

    })

    Object.entries(competenciasMap).forEach(([k,v]:any)=>{
      if(v.count > 0){
        const avg = v.total / v.count
        if(!isNaN(avg)){
          competencias[k] = Math.round(avg)
        }
      }
    })

    const entries = Object.entries(competencias)

    const sorted = entries.sort((a:any,b:any)=> b[1] - a[1])

    const mejores = sorted.slice(0,5)
    const criticas = sorted.slice(-5).reverse()

    /* ================= RESPUESTA ================= */

    return res.json({
      ok:true,
      data:{
        participantes: participants.length,
        evaluaciones: totalEvaluaciones,
        pendientes,
        semaforo:{ verde, amarillo, rojo },
        competencias,
        mejores,
        criticas,
        empresas
      }
    })

  }catch(err){
    console.error("ERROR DASHBOARD:", err)
    return res.status(500).json({
      error:"Error dashboard",
      detail:String(err)
    })
  }

})

export default router