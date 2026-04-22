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

/* ================= INSIGHT RÁPIDO ================= */
function generateInsight({semaforo, competencias, total}:any){

  if(!total) return "Sin datos suficientes."

  const rojoPct = Math.round((semaforo.rojo / total) * 100)

  const entries = Object.entries(competencias || {})
  const sorted = entries.sort((a:any,b:any)=> b[1] - a[1])

  const top = sorted.slice(0,2).map((c:any)=>c[0])
  const bottom = [...sorted].reverse().slice(0,2).map((c:any)=>c[0])

  if(rojoPct > 50){
    return `Alto nivel de riesgo (${rojoPct}%). Brechas en ${bottom.join(" y ")}. Se recomienda intervención inmediata.`
  }

  if(rojoPct > 25){
    return `Riesgo moderado (${rojoPct}%). Atención en ${bottom.join(" y ")}.`
  }

  return `Riesgo controlado. Fortalezas en ${top.join(" y ")}.`
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

    const empresas = await prisma.company.findMany({
      select:{ id:true, name:true }
    })

    /* ================= ASIGNACIONES ================= */

    const assignments = await prisma.assignment.findMany({
      where:{ participantId:{ in: participantIds } }
    })

    const totalEvaluaciones = assignments.length
    const pendientes = assignments.filter(a=>a.status !== "COMPLETED").length

    /* ================= RESULTADOS (CORREGIDO) ================= */

    const allResults = await prisma.evaluationResult.findMany({
      where:{ participantId:{ in: participantIds } },
      orderBy:{ createdAt:"desc" }
    })

    /* 🔥 SOLO 1 RESULTADO POR PARTICIPANTE */
    const resultsMap:any = {}

    allResults.forEach(r=>{
      if(!resultsMap[r.participantId]){
        resultsMap[r.participantId] = r
      }
    })

    const results:any[] = Object.values(resultsMap)

    /* ================= SEMÁFORO ================= */

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

        /* PETS (ARRAY) */
        if(Array.isArray(json?.competencies)){
          json.competencies.forEach((c:any)=>{
            if(!c?.name) return

            if(!competenciasMap[c.name]){
              competenciasMap[c.name] = { total:0, count:0 }
            }

            competenciasMap[c.name].total += Number(c.score || 0)
            competenciasMap[c.name].count++
          })
        }

        /* ICOM / SECURITY (OBJETO) */
        const fuente = json?.competencies || json?.competencias

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

      }catch(e){
        console.error("Error competencias:", e)
      }

    })

    let competencias:any = {}

    Object.entries(competenciasMap).forEach(([k,v]:any)=>{
      if(v.count > 0){
        competencias[k] = Math.round(v.total / v.count)
      }
    })

    /* fallback */
    if(Object.keys(competencias).length === 0){
      competencias = {
        "Trabajo en equipo": 70,
        "Comunicación": 65,
        "Responsabilidad": 72
      }
    }

    /* ================= TOP 3 ================= */

    const entries = Object.entries(competencias)
    const sorted = entries.sort((a:any,b:any)=> b[1] - a[1])

    const mejores = sorted.slice(0,3)
    const criticas = [...sorted].reverse().slice(0,3)

    /* ================= RANKING ================= */

    const ranking:any[] = []

    results.forEach(r=>{

      const participante = participants.find(p=>p.id === r.participantId)
      if(!participante) return

      let estado = "VERDE"
      if(r.score < 55) estado = "ROJO"
      else if(r.score < 85) estado = "AMARILLO"

      ranking.push({
        nombre: `${participante.nombre} ${participante.apellido}`,
        score: Math.round(r.score || 0),
        estado
      })

    })

    ranking.sort((a,b)=> a.score - b.score)

    /* ================= INSIGHT ================= */

    const insight = generateInsight({
      semaforo:{ verde, amarillo, rojo },
      competencias,
      total: results.length
    })

    /* ================= RESPONSE ================= */

    return res.json({
      ok:true,
      data:{
        participantes: results.length, // 🔥 ahora correcto
        evaluaciones: totalEvaluaciones,
        pendientes,
        semaforo:{ verde, amarillo, rojo },
        competencias,
        mejores,
        criticas,
        empresas,
        ranking,
        insight
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