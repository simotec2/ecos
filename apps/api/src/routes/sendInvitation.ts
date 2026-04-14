import { Router } from "express"
import prisma from "../db"
import { sendEvaluationEmail } from "../services/emailService"

const router = Router()

router.post("/:participantId", async (req, res) => {

  try {

    const { participantId } = req.params

    const participant = await prisma.participant.findUnique({
      where: { id: participantId }
    })

    if (!participant) {
      return res.status(404).json({
        error: "Participante no encontrado"
      })
    }

    if (!participant.email) {
      return res.status(400).json({
        error: "El participante no tiene correo"
      })
    }

    if (!participant.accessToken) {
      return res.status(400).json({
        error: "Participante sin token de acceso"
      })
    }

    await sendEvaluationEmail(
      participant.email,
      participant.nombre,
      participant.accessToken
    )

    res.json({
      success: true
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error enviando invitación"
    })

  }

})

export default router