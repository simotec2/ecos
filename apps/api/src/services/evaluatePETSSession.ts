import prisma from "../db"

import {
  evaluateCompetencyAI,
  generateAIReport,
  enrichCompetencies
} from "./aiEngine"

/* ======================================
SEMÁFORO
====================================== */
function calculateTraffic(score:number){

  if(score >= 80){

    return {
      color:"VERDE",
      result:"RECOMENDABLE"
    }

  }

  if(score >= 55){

    return {
      color:"AMARILLO",
      result:"RECOMENDABLE CON OBSERVACIONES"
    }

  }

  return {
    color:"ROJO",
    result:"NO RECOMENDABLE"
  }

}

/* ======================================
PETS ENGINE COMPLETO
====================================== */
export async function evaluatePETSSession(
  sessionId: string
){

  /* =========================
  RESPUESTAS
  ========================= */
  const answers =
    await prisma.evaluationAnswer.findMany({

      where:{ sessionId },

      include:{
        question:true
      }

    })

  if(!answers.length){

    throw new Error("No answers found")

  }

  /* =========================
  SESIÓN
  ========================= */
  const session =
    await prisma.evaluationSession.findUnique({

      where:{ id: sessionId }

    })

  if(!session){

    throw new Error("Session not found")

  }

  /* =========================
  MAPA DE COMPETENCIAS
  ========================= */
  const competencyMap:any = {}

  for(const ans of answers){

    const question:any = ans.question

    const competency =
      question?.competency || "General"

    const keywords =
      question?.keywordsJson
        ? JSON.parse(question.keywordsJson)
        : []

    const result =
      await evaluateCompetencyAI(

        question?.text || "",

        ans.answer || "",

        keywords

      )

    if(!competencyMap[competency]){

      competencyMap[competency] = []

    }

    competencyMap[competency].push(
      result.score
    )

  }

  /* =========================
  COMPETENCIAS
  ========================= */
  let competencies = Object.keys(
    competencyMap
  ).map(name=>{

    const scores =
      competencyMap[name]

    const avg =
      scores.reduce(
        (a:number,b:number)=>a+b,
        0
      ) / scores.length

    return {

      name,

      score: Math.round(avg)

    }

  })

  /* =========================
  ENRIQUECER
  ========================= */
  competencies =
    enrichCompetencies(
      competencies
    )

  /* =========================
  SCORE GLOBAL
  ========================= */
  const score = Math.round(

    competencies.reduce(

      (a:number,c:any)=>a+c.score,

      0

    ) / competencies.length

  )

  /* =========================
  SEMÁFORO
  ========================= */
  const traffic =
    calculateTraffic(score)

  /* =========================
  IA
  ========================= */
  const aiText =
    await generateAIReport({

      type:"PETS",

      score,

      traffic,

      competencies,

      answers: answers.map(a=>({

        question:
          a.question?.text || "",

        answer:
          a.answer || ""

      }))

    })

  /* =========================
  LIMPIAR RESULTADO PREVIO
  ========================= */
  await prisma.evaluationResult.deleteMany({

    where:{ sessionId }

  })

  /* =========================
  GUARDAR RESULTADO
  ========================= */
  return await prisma.evaluationResult.create({

    data:{

      sessionId,

      evaluationId:
        session.evaluationId,

      participantId:
        session.participantId!,

      score,

      resultJson: JSON.stringify({

        score,

        traffic,

        competencies,

        analysis: aiText,

        answersCount:
          answers.length

      })

    }

  })

}