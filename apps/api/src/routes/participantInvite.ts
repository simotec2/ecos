import { Router } from "express"
import prisma from "../db"
import { randomUUID } from "crypto"
import { sendEvaluationEmail } from "../utils/email"

const router = Router()

/* ======================================
INVITAR PARTICIPANTE (CON ENVÍO DE EMAIL)
====================================== */
router.get("/:id/invite", async (req,res)=>{

  try{

    const { id } = req.params

    const token = randomUUID()

    const participant = await prisma.participant.update({
      where:{ id },
      data:{ accessToken: token }
    })

    if(!participant.email){
      return res.status(400).json({
        error:"El participante no tiene email"
      })
    }

    await sendEvaluationEmail(
      participant.email,
      `${participant.nombre} ${participant.apellido}`,
      token
    )

    const link = `http://localhost:5173/participant/${token}`

    res.json({
      success:true,
      participant,
      link
    })

  }catch(error){

    console.error("❌ ERROR INVITE:", error)

    res.status(500).json({
      error:"Error enviando invitación"
    })

  }

})

export default router