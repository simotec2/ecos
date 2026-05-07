import { Router } from "express"
import prisma from "../db"
import { authMiddleware } from "../auth"

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
  }
  else if(finalScore < 85){
    estado = "AMARILLO"
  }

  return {
    score: Math.round(finalScore),
    estado
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

/* ================= ROUTE ================= */
router.get("/", authMiddleware, async (req:any,res)=>{

  try{

    const user = req.user

    if(!user){

      return res.status(401).json({
        error:"No autorizado"
      })

    }

    /* ======================================
    FILTRO COMPANY ADMIN
    ====================================== */

    let companyFilter:any = {}

    if(user.role === "COMPANY_ADMIN"){

      companyFilter = {
        companyId: user.companyId
      }

    }

    /* ======================================
    PARTICIPANTES
    ====================================== */

    const participants = await prisma.participant.findMany({

      where: companyFilter,

      include:{
        company:true
      }

    })

    const participantIds = participants.map(p=>p.id)

    /* ======================================
    RESULTADOS
    ====================================== */

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

    /* ======================================
    AGRUPAR
    ====================================== */

    const grouped:any = {}

    allResults.forEach(r=>{

      if(!grouped[r.participantId]){
        grouped[r.participantId] = []
      }

      grouped[r.participantId].push(r)

    })

    /* ======================================
    CONSOLIDADO
    ====================================== */

    const consolidated:any[] = []

    Object.entries(grouped).forEach(
      ([participantId, results]:any)=>{

      const final = consolidateResults(results)

      if(!final) return

      const participant = participants.find(
        p=>p.id === participantId
      )

      consolidated.push({

        participantId,

        companyId: participant?.companyId,

        companyName: participant?.company?.name,

        ...final

      })

    })

    /* ======================================
    DASHBOARD GLOBAL
    ====================================== */

    let verde = 0
    let amarillo = 0
    let rojo = 0

    consolidated.forEach(r=>{

      if(r.estado === "VERDE"){
        verde++
      }
      else if(r.estado === "AMARILLO"){
        amarillo++
      }
      else{
        rojo++
      }

    })

    /* ======================================
    DASHBOARD EMPRESA
    ====================================== */

    const companyMap:any = {}

    consolidated.forEach(r=>{

      if(!r.companyId) return

      if(!companyMap[r.companyId]){

        companyMap[r.companyId] = {

          id: r.companyId,

          name: r.companyName,

          total: 0,

          verde: 0,

          amarillo: 0,

          rojo: 0

        }

      }

      companyMap[r.companyId].total++

      if(r.estado === "VERDE"){
        companyMap[r.companyId].verde++
      }
      else if(r.estado === "AMARILLO"){
        companyMap[r.companyId].amarillo++
      }
      else{
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

    /* ======================================
    RESPONSE
    ====================================== */

    return res.json({

      ok:true,

      data:{

        participantes: consolidated.length,

        semaforo:{
          verde,
          amarillo,
          rojo
        },

        companies

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