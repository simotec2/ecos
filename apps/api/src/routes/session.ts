import { Router } from "express"
import prisma from "../db"
import { generateEvaluationReport } from "../services/reportEngine"

const router = Router()

function shuffle(array:any[]){
  return [...array].sort(() => Math.random() - 0.5)
}

function getDefaultDurationMinutes(type:string){
  if(type === "PETS") return 75
  if(type === "ICOM") return 45
  if(type === "SECURITY") return 30
  return 30
}

async function completeTimedOutSession(sessionId:string){

  const session = await prisma.evaluationSession.findUnique({
    where:{ id: sessionId }
  })

  if(!session){
    return null
  }

  if(session.status === "COMPLETED" || session.completedAt){
    return session
  }

  const existingResult =
    await prisma.evaluationResult.findUnique({
      where:{
        sessionId
      }
    })

  if(!existingResult){
    await generateEvaluationReport(sessionId)
  }

  const now = new Date()

  const updatedSession =
    await prisma.evaluationSession.update({
      where:{
        id: sessionId
      },
      data:{
        status:"COMPLETED",
        completedAt: now,
        timedOutAt: now
      }
    })

  try{

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

  }catch(e){

    console.warn(
      "No se pudo actualizar assignment al completar por tiempo:",
      e
    )

  }

  return updatedSession

}

/* ======================================
CREAR / RETOMAR SESIÓN
====================================== */
router.post("/", async (req,res)=>{

  try{

    const { participantId, evaluationId } = req.body

    if(!participantId || !evaluationId){
      return res.status(400).json({
        error:"Datos incompletos"
      })
    }

    /* =========================
    BUSCAR ASIGNACIÓN ACTIVA
    ========================= */
    const assignment = await prisma.assignment.findFirst({
      where:{
        participantId,
        evaluationId,
        status:{
          in:["PENDING","STARTED"]
        }
      },
      orderBy:{
        createdAt:"desc"
      }
    })

    if(!assignment){
      return res.status(404).json({
        error:"Evaluación no asignada o ya finalizada"
      })
    }

    /* =========================
    TRAER EVALUACIÓN
    ========================= */
    const evaluation = await prisma.evaluation.findUnique({
      where:{
        id:evaluationId
      },
      include:{
        questions:true
      }
    })

    if(!evaluation){
      return res.status(404).json({
        error:"Evaluación no encontrada"
      })
    }

    if(!evaluation.questions.length){
      return res.status(400).json({
        error:"Evaluación sin preguntas"
      })
    }

    const durationMinutes =
      evaluation.durationMinutes ||
      getDefaultDurationMinutes(evaluation.type)

    const now = new Date()

    /* =========================
    SI YA ESTABA INICIADA, RETOMAR SIN REINICIAR TIEMPO
    ========================= */
    if(assignment.status === "STARTED"){

      const existingSession =
        await prisma.evaluationSession.findFirst({
          where:{
            participantId,
            evaluationId,
            status:{
              not:"COMPLETED"
            },
            completedAt:null
          },
          orderBy:{
            createdAt:"desc"
          }
        })

      if(existingSession){

        if(
          existingSession.expiresAt &&
          now > existingSession.expiresAt
        ){

          const completed =
            await completeTimedOutSession(existingSession.id)

          return res.json({
            ...completed,
            expired:true,
            message:"El tiempo de la evaluación terminó"
          })

        }

        return res.json(existingSession)

      }

    }

    /* =========================
    SELECCIÓN DE PREGUNTAS
    ========================= */
    let selected = evaluation.questions

    if(evaluation.type === "SECURITY"){
      selected = shuffle(evaluation.questions).slice(0,20)
    }

    if(evaluation.type === "ICOM"){
      selected = shuffle(evaluation.questions)
    }

    const startedAt = now

    const expiresAt =
      new Date(
        startedAt.getTime() +
        durationMinutes * 60 * 1000
      )

    /* =========================
    CREAR SESIÓN NUEVA
    ========================= */
    const session =
      await prisma.evaluationSession.create({
        data:{
          participantId,
          evaluationId,
          startedAt,
          expiresAt,
          status:"IN_PROGRESS"
        }
      })

    console.log("✅ SESSION CREATED:", session.id)

    /* =========================
    CREAR RESPUESTAS VACÍAS
    ========================= */
    await prisma.evaluationAnswer.createMany({
      data: selected.map(q => ({
        sessionId: session.id,
        questionId: q.id,
        answer: ""
      }))
    })

    console.log("✅ ANSWERS CREATED:", selected.length)

    /* =========================
    MARCAR ASSIGNMENT COMO STARTED
    ========================= */
    if(assignment.status === "PENDING"){

      await prisma.assignment.update({
        where:{
          id: assignment.id
        },
        data:{
          status:"STARTED"
        }
      })

    }

    return res.json(session)

  }catch(e){

    console.error("❌ ERROR CREANDO SESIÓN:", e)

    return res.status(500).json({
      error:"Error creando sesión"
    })

  }

})

/* ======================================
GET SESIÓN
====================================== */
router.get("/:id", async (req,res)=>{

  try{

    const session = await prisma.evaluationSession.findUnique({
      where:{
        id:req.params.id
      },
      include:{
        evaluation:true,
        answers:{
          include:{
            question:true
          },
          orderBy:{
            createdAt:"asc"
          }
        }
      }
    })

    if(!session){
      return res.status(404).json({
        error:"Sesión no encontrada"
      })
    }

    const now = new Date()

    if(
      session.status !== "COMPLETED" &&
      !session.completedAt &&
      session.expiresAt &&
      now > session.expiresAt
    ){

      const completed =
        await completeTimedOutSession(session.id)

      return res.json({
        id: session.id,
        status:"COMPLETED",
        completedAt: completed?.completedAt,
        expiresAt: session.expiresAt,
        expired:true,
        evaluation:{
          id: session.evaluation.id,
          name: session.evaluation.name,
          type: session.evaluation.type,
          durationMinutes:
            session.evaluation.durationMinutes ||
            getDefaultDurationMinutes(session.evaluation.type)
        },
        questions: session.answers.map(a => a.question),
        answers: session.answers.map(a => ({
          questionId: a.questionId,
          answer: a.answer
        }))
      })

    }

    return res.json({
      id: session.id,
      status: session.status,
      startedAt: session.startedAt,
      expiresAt: session.expiresAt,
      completedAt: session.completedAt,
      timedOutAt: session.timedOutAt,
      evaluation:{
        id: session.evaluation.id,
        name: session.evaluation.name,
        type: session.evaluation.type,
        durationMinutes:
          session.evaluation.durationMinutes ||
          getDefaultDurationMinutes(session.evaluation.type)
      },
      questions: session.answers.map(a => a.question),
      answers: session.answers.map(a => ({
        questionId: a.questionId,
        answer: a.answer
      }))
    })

  }catch(e){

    console.error("❌ ERROR GET SESSION:", e)

    return res.status(500).json({
      error:"Error obteniendo sesión"
    })

  }

})

export default router