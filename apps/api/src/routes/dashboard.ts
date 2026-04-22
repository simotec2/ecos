import { Router } from "express"
import prisma from "../db"
import { verifyAccessToken } from "../utils/jwt"

const router = Router()

function getUser(req:any){
  const auth = req.headers.authorization || ""
  if(!auth.startsWith("Bearer ")) return null
  const token = auth.replace("Bearer ","")
  return verifyAccessToken(token)
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

    /* ===============================
    🔥 PARTICIPANTES
    =============================== */

    const participants = await prisma.participant.findMany({
      where: companyFilter,
      include:{ company:true }
    })

    const participantIds = participants.map(p=>p.id)

    /* ===============================
    🔥 EMPRESAS (NUEVO)
    =============================== */

    const empresas = await prisma.company.findMany({
      select:{ id:true, name:true }
    })

    /* ===============================
    🔥 ASIGNACIONES
    =============================== */

    const assignments = await prisma.assignment.findMany({
      where:{
        participantId: { in: participantIds }
      }
    })

    const totalEvaluaciones = assignments.length
    const pendientes = assignments.filter(a=>a.status !== "COMPLETED").length

    /* ===============================
    🔥 RESULTADOS
    =============================== */

    const results = await prisma.evaluationResult.findMany({
      where:{
        participantId: { in: participantIds }
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

    /* ===============================
    🔥 COMPETENCIAS (ROBUSTO)
    =============================== */

    const competenciasMap:any = {}

    results.forEach(r=>{

      try{

        const json = typeof r.resultJson === "string"
          ? JSON.parse(r.resultJson)
          : r.resultJson

        // OBJETO
        if(json?.competencies){

          Object.entries(json.competencies).forEach(([name,value]:any)=>{

            if(!name || name.toLowerCase().includes("sumarse")) return

            if(!competenciasMap[name]){
              competenciasMap[name] = { total:0, count:0 }
            }

            competenciasMap[name].total += Number(value)
            competenciasMap[name].count++

          })
        }

        // ARRAY
        if(Array.isArray(json?.competenciasDetalle)){

          json.competenciasDetalle.forEach((c:any)=>{

            const name = c.name
            const score = Number(c.score || 0)

            if(!name || name.toLowerCase().includes("sumarse")) return

            if(!competenciasMap[name]){
              competenciasMap[name] = { total:0, count:0 }
            }

            competenciasMap[name].total += score
            competenciasMap[name].count++

          })
        }

      }catch(e){
        console.error("Error parsing resultJson:", e)
      }

    })

    const competencias:any = {}

    Object.entries(competenciasMap).forEach(([k,v]:any)=>{
      if(v.count > 0){
        competencias[k] = Math.round(v.total / v.count)
      }
    })

    const sorted = Object.entries(competencias)
      .sort((a:any,b:any)=> b[1] - a[1])

    const mejores = sorted.slice(0,5)
    const criticas = sorted.slice(-5).reverse()

    /* ===============================
    🔥 RESPUESTA FINAL
    =============================== */

    return res.json({
      ok:true,
      role:user.role,
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
    console.error(err)
    res.status(500).json({ error:"Error dashboard" })
  }

})

export default router