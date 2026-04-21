import { Router } from "express"
import prisma from "../db"
import { sendEvaluationEmail } from "../services/emailService"

const router = Router()

/* ======================================
ENVÍO INDIVIDUAL (YA EXISTENTE)
====================================== */
router.post("/:participantId", async (req, res) => {

  try {

    const { participantId } = req.params

    const participant = await prisma.participant.findUnique({
      where: { id: participantId }
    })

    if (!participant) {
      return res.status(404).json({ error: "Participante no encontrado" })
    }

    if (!participant.email || !participant.accessToken) {
      return res.status(400).json({
        error: "Participante sin email o token"
      })
    }

    await sendEvaluationEmail(
      participant.email,
      participant.nombre,
      participant.accessToken
    )

    /* marcar enviado */
    await prisma.assignment.updateMany({
      where: { participantId },
      data: { invitationSent: true }
    })

    res.json({ success: true })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error enviando invitación"
    })

  }

})

/* ======================================
ENVÍO MASIVO POR EMPRESA
====================================== */
router.post("/", async (req, res) => {

  try {

    const { companyId } = req.body

    if (!companyId) {
      return res.status(400).json({
        error: "companyId requerido"
      })
    }

    const participants = await prisma.participant.findMany({
      where: { companyId }
    })

    let sent = 0
    let skipped = 0

    for (const p of participants) {

      if (!p.email || !p.accessToken) {
        skipped++
        continue
      }

      /* solo pendientes */
      const pending = await prisma.assignment.findFirst({
        where: {
          participantId: p.id,
          status: "PENDING"
        }
      })

      if (!pending) {
        skipped++
        continue
      }

      /* evitar duplicados */
      const alreadySent = await prisma.assignment.findFirst({
        where: {
          participantId: p.id,
          invitationSent: true
        }
      })

      if (alreadySent) {
        skipped++
        continue
      }

      await sendEvaluationEmail(
        p.email,
        p.nombre,
        p.accessToken
      )

      await prisma.assignment.updateMany({
        where: { participantId: p.id },
        data: { invitationSent: true }
      })

      sent++

    }

    res.json({
      success: true,
      sent,
      skipped
    })

  } catch (error:any) {

    console.error(error)

    res.status(500).json({
      error: "Error envío masivo",
      detail: error.message
    })

  }

})

export default router