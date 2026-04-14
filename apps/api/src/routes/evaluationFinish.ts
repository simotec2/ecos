import { Router } from "express"
import prisma from "../db"
import { generateEvaluationReport } from "../services/reportEngine"

const router = Router()

router.post("/:sessionId", async (req,res)=>{

  try{

    const { sessionId } = req.params

    console.log("🔵 FINALIZANDO:", sessionId)

    const session = await prisma.evaluationSession.findUnique({
      where:{ id: sessionId }
    })

    if(!session){
      return res.status(404).json({ error:"Sesión no encontrada" })
    }

    /* =========================
    GENERAR REPORTE
    ========================= */
    await generateEvaluationReport(sessionId)

    /* =========================
    MARCAR SESIÓN COMPLETA
    ========================= */
    await prisma.evaluationSession.update({
      where:{ id: sessionId },
      data:{
        completedAt: new Date(),
        status:"COMPLETED"
      }
    })

    /* =========================
    MARCAR ASSIGNMENT COMPLETADO
    ========================= */
    await prisma.assignment.update({
      where:{
        participantId_evaluationId:{
          participantId: session.participantId,
          evaluationId: session.evaluationId
        }
      },
      data:{
        status:"COMPLETED"
      }
    })

    /* =========================
    CONTAR PENDIENTES
    ========================= */
    const pending = await prisma.assignment.count({
      where:{
        participantId: session.participantId,
        status:{ not:"COMPLETED" }
      }
    })

    console.log("🟡 PENDIENTES:", pending)

    return res.json({
      ok:true,
      pending
    })

  }catch(e){

    console.error("❌ FINISH ERROR:", e)

    return res.status(500).json({
      error:"Error al finalizar evaluación"
    })
  }

})

export default router