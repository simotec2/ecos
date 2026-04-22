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

/* ================= CONSOLIDADOR ================= */
function consolidateResults(results:any[]){

  const byType:Record<string, number> = {}

  results.forEach(r=>{
    const type = r.evaluation?.type
    const score = Number(r.score)

    if(!type || isNaN(score)) return

    // solo 1 por tipo (el más reciente ya viene primero)
    if(byType[type] === undefined){
      byType[type] = score
    }
  })

  const scores = Object.values(byType) as number[]

  if(scores.length === 0) return null

  const sum = scores.reduce((acc:number, val:number)=> acc + val, 0)

  const finalScore = sum / scores.length

  let estado:"VERDE" | "AMARILLO" | "ROJO" = "VERDE"

  if(finalScore < 55) estado = "ROJO"
  else if(finalScore < 85) estado = "AMARILLO"

  return {
    score: Math.round(finalScore),
    estado
  }
}

/* ================= INSIGHT ================= */
function generateInsight({semaforo, competencias, total}:any){

  if(!total) return "Sin datos suficientes."

  const rojoPct = Math.round((semaforo.rojo / total) * 100)

  const entries = Object.entries(competencias || {})
  const sorted = entries.sort((a:any,b:any)=> b[1] - a[1])

  const top = sorted.slice(0,2).map((c:any)=>c[0])
  const bottom = [...sorted].reverse().slice(0,2).map((c:any)=>c[0])

  if(rojoPct > 50){
    return `Alto nivel de riesgo (${rojoPct}%). Brechas en ${bottom.join(" y ")}.`
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

    /* ================= RESULTADOS ================= */

    const allResults = await prisma.evaluationResult.findMany({
      where:{ participantId:{ in: participantIds } },
      include:{ evaluation:true },
      orderBy:{ createdAt:"desc" }
    })

    /* ================= CONSOLIDAR POR PARTICIPANTE ================= */

    const grouped:any = {}

    allResults.forEach(r=>{
      if(!grouped[r.participantId]){
        grouped[r.participantId] = []
      }
      grouped[r.participantId].push(r)
    })

    const consolidated:any[] = []

    Object.entries(grouped).forEach(([participantId, results]:any)=>{

      const final = consolidateResults(results)
      if(!final) return

      consolidated.push({
        participantId,
        ...final
      })
    })

    /* ================= SEMÁFORO ================= */

    let verde = 0
    let amarillo = 0
    let rojo = 0

    consolidated.forEach(r=>{
      if(r.estado === "VERDE") verde++
      else if(r.estado === "AMARILLO") amarillo++
      else rojo++
    })

    /* ================= COMPETENCIAS ================= */

    const competenciasMap:any = {}

    allResults.forEach(r=>{

      try{

        const json = typeof r.resultJson === "string"
          ? JSON.parse(r.resultJson)
          : r.resultJson

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

      }catch{}
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

    const entries = Object.entries(competencias)
    const sorted = entries.sort((a:any,b:any)=> b[1] - a[1])

    const mejores = sorted.slice(0,3)
    const criticas = [...sorted].reverse().slice(0,3)

    /* ================= RANKING ================= */

    const ranking:any[] = []

    consolidated.forEach(r=>{

      const p = participants.find(x=>x.id === r.participantId)
      if(!p) return

      ranking.push({
        nombre: `${p.nombre} ${p.apellido}`,
        score: r.score,
        estado: r.estado
      })
    })

    ranking.sort((a,b)=> a.score - b.score)

    /* ================= INSIGHT ================= */

    const insight = generateInsight({
      semaforo:{ verde, amarillo, rojo },
      competencias,
      total: consolidated.length
    })

    /* ================= RESPONSE ================= */

    return res.json({
      ok:true,
      data:{
        participantes: consolidated.length,
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

    console.error(err)

    return res.status(500).json({
      error:"Error dashboard",
      detail:String(err)
    })
  }

})

export default router