import { Router } from "express"
import prisma from "../db"

const router = Router()

router.post("/", async (req, res) => {

  try {

    const sessionId = String(req.body.sessionId || "")
    const questionId = String(req.body.questionId || "")
    const answer = String(req.body.answer ?? "")

    if (!sessionId || !questionId) {
      return res.status(400).json({
        error: "sessionId y questionId requeridos"
      })
    }

    const existing = await prisma.evaluationAnswer.findFirst({
      where: {
        sessionId,
        questionId
      }
    })

    if (existing) {

      const updated = await prisma.evaluationAnswer.update({
        where: { id: existing.id },
        data: { answer }
      })

      return res.json(updated)
    }

    const created = await prisma.evaluationAnswer.create({
      data: {
        sessionId,
        questionId,
        answer
      }
    })

    return res.json(created)

  } catch (err) {

    console.error("Error guardando respuesta", err)

    return res.status(500).json({
      error: "Error interno"
    })
  }

})

export default router