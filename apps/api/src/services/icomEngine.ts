import prisma from "../db"
import { generateAIReport } from "./aiEngine"
export async function evaluateICOMSession(sessionId: string) {

  const answers = await prisma.evaluationAnswer.findMany({
    where: { sessionId },
    include: {
      question: true
    }
  })

  let correct = 0
  const total = answers.length

  for (const ans of answers) {

    const selected = ans.answer || ""
    const correctAnswer = ans.question.correctAnswer || ""

    if (selected === correctAnswer) {
      correct++
    }

  }

  const score = total > 0 ? (correct / total) * 100 : 0

  const session = await prisma.evaluationSession.findUnique({
    where: { id: sessionId }
  })

  if (!session) {
    throw new Error("Session not found")
  }

  // 🔥 eliminar resultado previo
  await prisma.evaluationResult.deleteMany({
    where: { sessionId }
  })

  return await prisma.evaluationResult.create({
    data: {
      sessionId: session.id,
      evaluationId: session.evaluationId,
      participantId: session.participantId!,
      score,
      resultJson: JSON.stringify({
        correct,
        total
      })
    }
  })

}