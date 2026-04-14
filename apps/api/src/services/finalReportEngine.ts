import prisma from "../db"
import { generateAIReport } from "./aiEngine"

/* ======================================
SEMÁFORO FINAL (USANDO COLOR REAL)
====================================== */
function calculateFinalTraffic(evaluations:any[]){

  let hasRed = false
  let hasYellow = false

  for(const e of evaluations){

    const color = e.traffic?.color

    if(color === "ROJO") hasRed = true
    else if(color === "AMARILLO") hasYellow = true
  }

  if(hasRed){
    return { color:"ROJO", result:"NO RECOMENDABLE" }
  }

  if(hasYellow){
    return { color:"AMARILLO", result:"RECOMENDABLE CON OBSERVACIONES" }
  }

  return { color:"VERDE", result:"RECOMENDABLE" }
}

/* ======================================
FINAL REPORT ENGINE
====================================== */
export async function generateFinalReport(participantId:string){

  const results = await prisma.evaluationResult.findMany({
    where:{ participantId },
    include:{
      evaluation:true,
      participant:{
        include:{ company:true }
      }
    },
    orderBy:{ createdAt:"desc" }
  })

  if(!results.length){
    throw new Error("No results found")
  }

  /* =========================
  ÚLTIMO POR TIPO
  ========================= */
  const latest:any = {}

  for(const r of results){

    const type = r.evaluation?.type

    if(type && !latest[type]){
      latest[type] = r
    }
  }

  /* =========================
  NORMALIZAR (CLAVE)
  ========================= */
  const selected = Object.values(latest).map((r:any)=>{

    const data = r.resultJson ? JSON.parse(r.resultJson) : {}

    return {
      type: r.evaluation?.type,
      score: Number(r.score || 0),
      traffic: data.traffic || { color:"ROJO" }, // 🔥 CLAVE
      competencies: data.competencies || [],
      analysis: data.aiText || "Sin análisis disponible"
    }
  })

  /* =========================
  SCORE GLOBAL (SOLO REFERENCIAL)
  ========================= */
  const globalScore = Math.round(
    selected.reduce((a:number,b:any)=>a + b.score,0) / selected.length
  )

  /* =========================
  SEMÁFORO FINAL REAL
  ========================= */
  const traffic = calculateFinalTraffic(selected)

  /* =========================
  UNIFICAR COMPETENCIAS
  ========================= */
  const map:any = {}

  for(const r of selected){
    for(const c of r.competencies){

      if(!map[c.name]) map[c.name] = []

      map[c.name].push(c.score)
    }
  }

  const competencies = Object.keys(map).map(name=>{

    const values = map[name]

    const avg = values.reduce((a:number,b:number)=>a+b,0) / values.length

    return {
      name,
      score: Math.round(avg)
    }
  })

  /* =========================
  IA FINAL (CON CONTEXTO REAL)
  ========================= */
  let aiText = ""

  try{

    aiText = await generateAIReport({
      type:"FINAL",
      score: globalScore,
      traffic,
      competencies,
      evaluations: selected.map(e=>({
        type: e.type,
        score: e.score,
        competencies: e.competencies,
        analysis: e.analysis
      }))
    })

  }catch(err){

    console.error("ERROR IA FINAL:", err)
    aiText = "No fue posible generar el análisis."
  }

  const participant = results[0].participant

  return {
    participant,
    score: globalScore,
    traffic,
    competencies,
    analysis: aiText,
    evaluations: selected
  }
}