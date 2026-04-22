import { Router } from "express"
import prisma from "../db"
import { verifyAccessToken } from "../utils/jwt"

const router = Router()

/* ================= AUTH ================= */
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

/* ================= ROUTE ================= */
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

    /* ================= COMPETENCIAS ================= */

    const competenciasMap:any = {}

    results.forEach(r=>{

      try{

        const json = typeof r.resultJson === "string"
          ? JSON.parse(r.resultJson)
          : r.resultJson

        if(!json) return

        // soporta múltiples formatos
        const fuente =
          json.competencies ||
          json.competencias ||
          null

        if(fuente && typeof fuente === "object"){

          Object.entries(fuente).forEach(([name,value]:any)=>{

            if(!name) return

            const num = Number(value)
            if(isNaN(num)) return

            if(!competenciasMap[name]){
              competenciasMap[name] = { total:0, count:0 }
            }

            competenciasMap[name].total += num
            competenciasMap[name].count++

          })
        }

        // formato array
        if(Array.isArray(json.competenciasDetalle)){

          json.competenciasDetalle.forEach((c:any)=>{

            if(!c?.name) return

            const num = Number(c.score)
            if(isNaN(num)) return

            if(!competenciasMap[c.name]){
              competenciasMap[c.name] = { total:0, count:0 }
            }

            competenciasMap[c.name].total += num
            competenciasMap[c.name].count++

          })
        }

      }catch(e){
        console.error("Error parsing resultJson:", e)
      }

    })

    /* ================= PROMEDIOS ================= */

    const competencias:any = {}

    Object.entries(competenciasMap).forEach(([k,v]:any)=>{
      if(v.count > 0){
        const avg = v.total / v.count
        if(!isNaN(avg)){
          competencias[k] = Math.round(avg)
        }
      }
    })

    /* ================= ORDEN ================= */

    const entries = Object.entries(competencias)

    const sorted = entries.sort((a:any,b:any)=> b[1] - a[1])

    const mejores = sorted.slice(0,5)
    const criticas = sorted.slice(-5).reverse()

    /* ================= RESPONSE ================= */

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