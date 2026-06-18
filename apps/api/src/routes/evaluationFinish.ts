import { Router } from "express"
import prisma from "../db"
import { generateEvaluationReport } from "../services/reportEngine"

const router = Router()

async function saveAnswerSnapshot(sessionId:string, answers:any){

  if(!answers || typeof answers !== "object"){
    return
  }

  const entries = Object.entries(answers)

  for(const [questionId, value] of entries){

    const answer = String(value ?? "")

    const existing =
      await prisma.evaluationAnswer.findFirst({
        where:{
          sessionId,
          questionId
        }
      })

    if(existing){

      await prisma.evaluationAnswer.update({
        where:{
          id: existing.id
        },
        data:{
          answer
        }
      })

    }else{

      await prisma.evaluationAnswer.create({
        data:{
          sessionId,
          questionId,
          answer
        }
      })

    }

  }

}

router.post("/:sessionId", async (req,res)=>{

  try{

    const { sessionId } = req.params

    console.log("🔵 FINALIZANDO:", sessionId)

    const session = await prisma.evaluationSession.findUnique({
      where:{
        id: sessionId
      },
      include:{
        evaluation:true
      }
    })

    if(!session){
      return res.status(404).json({
        error:"Sesión no encontrada"
      })
    }

    if(session.status === "COMPLETED" || session.completedAt){

      const pending = await prisma.assignment.count({
        where:{
          participantId: session.participantId,
          status:{
            not:"COMPLETED"
          }
        }
      })

      return res.json({
        ok:true,
        alreadyCompleted:true,
        pending
      })

    }

    const now = new Date()

    const isTimedOut =
      Boolean(
        session.expiresAt &&
        now > session.expiresAt
      )

    /* =========================
    GUARDAR RESPUESTAS PARCIALES
    ========================= */
    await saveAnswerSnapshot(
      sessionId,
      req.body?.answers
    )

    /* =========================
    GENERAR REPORTE
    ========================= */
    const existingResult =
      await prisma.evaluationResult.findUnique({
        where:{
          sessionId
        }
      })

    if(!existingResult){
      await generateEvaluationReport(sessionId)
    }

    /* =========================
    MARCAR SESIÓN COMPLETA
    ========================= */
    await prisma.evaluationSession.update({
      where:{
        id: sessionId
      },
      data:{
        completedAt: now,
        timedOutAt: isTimedOut ? now : null,
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
        status:{
          not:"COMPLETED"
        }
      }
    })

    console.log("🟡 PENDIENTES:", pending)

    return res.json({
      ok:true,
      timedOut: isTimedOut,
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