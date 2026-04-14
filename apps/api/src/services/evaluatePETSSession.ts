import prisma from "../db"
import { evaluateCompetencyAI, generateAIReport } from "./aiEngine"

/* ======================================
PETS ENGINE COMPLETO
====================================== */
export async function evaluatePETSSession(sessionId: string){

  /* =========================
  TRAER RESPUESTAS + PREGUNTAS
  ========================= */
  const answers = await prisma.evaluationAnswer.findMany({
    where:{ sessionId },
    include:{
      question:true
    }
  })

  if(!answers.length){
    throw new Error("No answers found")
  }

  /* =========================
  TRAER SESIÓN
  ========================= */
  const session = await prisma.evaluationSession.findUnique({
    where:{ id: sessionId }
  })

  if(!session){
    throw new Error("Session not found")
  }

  /* =========================
  AGRUPAR POR COMPETENCIA
  ========================= */
  const competencyMap:any = {}

  for(const ans of answers){

    const question:any = ans.question

    const competency = question?.competency || "General"

    const keywords = question?.keywordsJson
      ? JSON.parse(question.keywordsJson)
      : []

    const result = await evaluateCompetencyAI(
      question?.text || "",
      ans.answer || "",
      keywords
    )

    if(!competencyMap[competency]){
      competencyMap[competency] = []
    }

    competencyMap[competency].push(result.score)
  }

  /* =========================
  CALCULAR COMPETENCIAS
  ========================= */
  const competencies = Object.keys(competencyMap).map(name=>{

    const scores = competencyMap[name]

    const avg = scores.reduce((a:number,b:number)=>a+b,0) / scores.length

    return {
      name,
      score: Math.round(avg)
    }
  })

  /* =========================
  SCORE GLOBAL
  ========================= */
  const score = Math.round(
    competencies.reduce((a:number,c:any)=>a+c.score,0) / competencies.length
  )

  /* =========================
  IA (ANÁLISIS REAL)
  ========================= */
  const aiText = await generateAIReport({
    type:"PETS",
    score,
    competencies,
    answers: answers.map(a=>({
      question: a.question?.text || "",
      answer: a.answer || ""
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
      evaluationId: session.evaluationId,
      participantId: session.participantId!,
      score,
      resultJson: JSON.stringify({
        score,
        competencies,
        analysis: aiText,
        answersCount: answers.length
      })
    }
  })

}