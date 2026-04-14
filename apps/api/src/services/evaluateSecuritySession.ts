import prisma from "../db"

/* ======================================
NORMALIZAR RESPUESTAS (ROBUSTO)
====================================== */
function normalizeAnswer(value:string){

  let v = (value || "").toLowerCase().trim()

  // convertir números a letras
  if(v === "0") v = "a"
  if(v === "1") v = "b"
  if(v === "2") v = "c"
  if(v === "3") v = "d"

  // limpiar formatos tipo "a)", "a.", etc.
  v = v.replace(/[.)]/g,"")
  v = v.replace(/\s/g,"")

  // solo primera letra válida
  return v.charAt(0)
}

/* ======================================
SEMAFORO
====================================== */
function calculateTrafficLight(score:number){

  if(score >= 85){
    return { color:"VERDE", result:"RECOMENDABLE" }
  }

  if(score >= 55){
    return { color:"AMARILLO", result:"RECOMENDABLE CON OBSERVACIONES" }
  }

  return { color:"ROJO", result:"NO RECOMENDABLE" }
}

/* ======================================
EVALUAR SECURITY
====================================== */
export async function evaluateSecuritySession(sessionId:string){

  /* =========================
  SOLO RESPUESTAS SECURITY (MCQ)
  ========================= */
  const answers = await prisma.evaluationAnswer.findMany({
    where:{
      sessionId,
      question:{
        type: "MCQ"   // 🔥 CLAVE: solo SECURITY
      }
    },
    include:{ question:true }
  })

  if(!answers.length){
    throw new Error("No hay respuestas SECURITY")
  }

  /* =========================
  CALCULO CORRECTO
  ========================= */
  let correct = 0
  let total = 0

  for(const a of answers){

    // ignorar vacías
    if(!a.answer) continue

    total++

    const user = normalizeAnswer(a.answer)
    const correctAnswer = normalizeAnswer(a.question.correctAnswer || "")

    if(user === correctAnswer){
      correct++
    }
  }

  const score = total > 0
    ? (correct / total) * 100
    : 0

  const traffic = calculateTrafficLight(score)

  const result = {
    score: Number(score.toFixed(2)),
    correct,
    total,
    traffic,
    competencies: []
  }

  console.log("SECURITY RESULT:", result)

  /* =========================
  GUARDAR RESULTADO
  ========================= */
  const existing = await prisma.evaluationResult.findUnique({
    where:{ sessionId }
  })

  if(existing){

    await prisma.evaluationResult.update({
      where:{ sessionId },
      data:{
        score: result.score,
        resultJson: JSON.stringify(result)
      }
    })

  } else {

    const session = await prisma.evaluationSession.findUnique({
      where:{ id: sessionId }
    })

    if(!session){
      throw new Error("Sesión no encontrada")
    }

    await prisma.evaluationResult.create({
      data:{
        sessionId,
        participantId: session.participantId,
        evaluationId: session.evaluationId,
        score: result.score,
        resultJson: JSON.stringify(result)
      }
    })
  }

  return result
}