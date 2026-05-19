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
      result:"APTA CON PLAN DE DESARROLLO"
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
PLAN DESARROLLO MINERÍA
====================================== */
function buildMiningDevelopmentPlan(
  competencies:any[]
){

  const plans:string[] = []

  for(const c of competencies){

    const score =
      Number(c.score || 0)

    const name =
      String(c.name || "")
        .toLowerCase()

    if(score >= 70){
      continue
    }

    /* =========================
    SEGURIDAD
    ========================= */

    if(
      name.includes("riesgo") ||
      name.includes("seguridad")
    ){

      plans.push(`
      • Curso Hombre Nuevo Minería
      • Identificación de peligros y control de riesgos críticos
      • Procedimientos operacionales y estándares DAS
      `)

    }

    /* =========================
    TECNICO
    ========================= */

    if(
      name.includes("técnico") ||
      name.includes("tecnico")
    ){

      plans.push(`
      • Refuerzo técnico operacional del rol
      • Inducción específica de proceso productivo
      • Capacitación práctica en terreno
      `)

    }

    /* =========================
    COMUNICACION
    ========================= */

    if(
      name.includes("comunicación") ||
      name.includes("comunicacion")
    ){

      plans.push(`
      • Taller comunicación efectiva operacional
      • Reportabilidad e instrucciones críticas
      • Coordinación segura entre áreas
      `)

    }

    /* =========================
    EQUIPO
    ========================= */

    if(
      name.includes("equipo")
    ){

      plans.push(`
      • Taller trabajo en equipo minería
      • Integración operacional y liderazgo colaborativo
      • Resolución de conflictos en terreno
      `)

    }

    /* =========================
    CONDUCTUAL
    ========================= */

    if(
      name.includes("conductual") ||
      name.includes("consistencia")
    ){

      plans.push(`
      • Taller conductas seguras y autocuidado
      • Mentoría con supervisor senior
      • Seguimiento conductual primeros 90 días
      `)

    }

  }

  return [...new Set(plans)].join("<br/><br/>")

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
  PLAN MINERÍA
  ====================================== */

  const miningPlan =
    buildMiningDevelopmentPlan(
      bottomCompetencies
    )

  /* ======================================
  IA EJECUTIVA
  ====================================== */

  let aiText = ""

  try{

    aiText =
      await generateAIReport({

        type:"FINAL",

        score:globalScore,

        traffic,

        competencies,

        evaluations:selected,

        prompt:`

Eres un psicólogo laboral senior especialista en minería.

Debes generar un informe ejecutivo tipo consultora minera.

NO uses markdown.
NO uses asteriscos.
NO uses títulos repetidos.

Debes redactar:

DIAGNÓSTICO GENERAL:
FORTALEZAS OPERACIONALES:
BRECHAS PRIORITARIAS:
IMPACTO OPERACIONAL:
PLAN DE DESARROLLO SUGERIDO:
RECOMENDACIÓN PARA SUPERVISOR:
CONCLUSIÓN FINAL:

Debes sonar:
- ejecutivo
- corporativo
- minería
- RRHH industrial
- continuidad operacional
- seguridad
- debida diligencia

NO sonar como ChatGPT.

`

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

    miningPlan,

    analysis:aiText,

    evaluations:selected,

    radar:""

  }

}