import prisma from "../db"
import { generateAIReport } from "./aiEngine"

/* ======================================
SEMÁFORO FINAL
====================================== */
function calculateFinalTraffic(
  evaluations:any[]
){

  let hasRed = false
  let hasYellow = false

  for(const e of evaluations){

    const color = e.traffic?.color

    if(color === "ROJO"){
      hasRed = true
    }

    else if(color === "AMARILLO"){
      hasYellow = true
    }

  }

  if(hasRed){

    return {
      color:"ROJO",
      result:"NO RECOMENDABLE"
    }

  }

  if(hasYellow){

    return {
      color:"AMARILLO",
      result:"RECOMENDABLE CON OBSERVACIONES"
    }

  }

  return {
    color:"VERDE",
    result:"RECOMENDABLE"
  }

}

/* ======================================
CSS
====================================== */
function getTrafficClass(color:string){

  if(color === "VERDE"){
    return "green"
  }

  if(color === "AMARILLO"){
    return "orange"
  }

  return "red"

}

function getResultClass(color:string){

  if(color === "VERDE"){
    return "green"
  }

  if(color === "AMARILLO"){
    return "orange"
  }

  return "red"

}

/* ======================================
TOP / BOTTOM
====================================== */
function buildTopCompetencies(
  competencies:any[]
){

  return [...competencies]
    .sort((a,b)=>b.score-a.score)
    .slice(0,5)

}

function buildBottomCompetencies(
  competencies:any[]
){

  return [...competencies]
    .sort((a,b)=>a.score-b.score)
    .slice(0,5)

}

/* ======================================
ENGINE
====================================== */
export async function generateOperationalFinalReport(
  participantId:string
){

  const results =
    await prisma.evaluationResult.findMany({

      where:{ participantId },

      include:{
        evaluation:true,
        participant:{
          include:{ company:true }
        }
      },

      orderBy:{
        createdAt:"desc"
      }

    })

  if(!results.length){

    throw new Error(
      "No results found"
    )

  }

  /* ======================================
  FECHA
  ====================================== */

  const reportDate =
    new Date(
      results[0].createdAt
    ).toLocaleDateString("es-CL")

  /* ======================================
  ÚLTIMO POR TIPO
  ====================================== */

  const latest:any = {}

  for(const r of results){

    const type =
      r.evaluation?.type

    if(type && !latest[type]){

      latest[type] = r

    }

  }

  /* ======================================
  NORMALIZAR
  ====================================== */

  const selected =
    Object.values(latest).map((r:any)=>{

      const data =
        r.resultJson
          ? JSON.parse(r.resultJson)
          : {}

      return {

        type:r.evaluation?.type,

        score:Number(r.score || 0),

        traffic:
          data.traffic || {
            color:"ROJO"
          },

        competencies:
          data.competencies ||
          data.competenciasDetalle ||
          [],

        analysis:
          data.aiText ||
          data.analysis ||
          "Sin análisis disponible"

      }

    })

  /* ======================================
  SCORE GLOBAL
  ====================================== */

  const globalScore = Math.round(

    selected.reduce(
      (a:number,b:any)=>a + b.score,
      0
    ) / selected.length

  )

  /* ======================================
  SEMÁFORO
  ====================================== */

  const traffic =
    calculateFinalTraffic(selected)

  /* ======================================
  COMPETENCIAS
  ====================================== */

  const map:any = {}

  for(const r of selected){

    for(const c of r.competencies){

      if(!c?.name) continue

      if(!map[c.name]){

        map[c.name] = []

      }

      map[c.name].push(
        Number(c.score || 0)
      )

    }

  }

  const competencies =
    Object.keys(map).map(name=>{

      const values = map[name]

      const avg =
        values.reduce(
          (a:number,b:number)=>a+b,
          0
        ) / values.length

      return {
        name,
        score:Math.round(avg)
      }

    })

  /* ======================================
  TOP / BOTTOM
  ====================================== */

  const topCompetencies =
    buildTopCompetencies(
      competencies
    )

  const bottomCompetencies =
    buildBottomCompetencies(
      competencies
    )

  /* ======================================
  IA
  ====================================== */

  let aiText = ""

  try{

    aiText =
      await generateAIReport({

        type:"FINAL",

        score:globalScore,

        traffic,

        competencies,

        evaluations:selected

      })

  }catch(err){

    console.error(
      "ERROR IA FINAL:",
      err
    )

    aiText =
      "No fue posible generar el análisis."

  }

  /* ======================================
  PARTICIPANTE
  ====================================== */

  const participant =
    results[0].participant

  /* ======================================
  RETURN
  ====================================== */

  return {

    participant,

    date:reportDate,

    score:globalScore,

    traffic,

    trafficClass:
      getTrafficClass(
        traffic.color
      ),

    resultClass:
      getResultClass(
        traffic.color
      ),

    competencies,

    topCompetencies,

    bottomCompetencies,

    analysis:aiText,

    evaluations:selected,

    radar:""

  }

}