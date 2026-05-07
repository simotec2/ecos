import { Router } from "express"
import prisma from "../db"

const router = Router()

function shuffle(array:any[]){
  return [...array].sort(() => Math.random() - 0.5)
}

/* ======================================
CREAR SESIÓN (FINAL CORRECTO)
====================================== */
router.post("/", async (req,res)=>{

  try{

    const { participantId, evaluationId } = req.body

    if(!participantId || !evaluationId){
      return res.status(400).json({ error:"Datos incompletos" })
    }

    /* =========================
    🔥 BUSCAR ÚLTIMA ASIGNACIÓN ACTIVA
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
        createdAt:"desc"   // 🔥 CLAVE
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
      where:{ id:evaluationId },
      include:{ questions:true }
    })

    if(!evaluation){
      return res.status(404).json({ error:"Evaluación no encontrada" })
    }

    if(!evaluation.questions.length){
      return res.status(400).json({ error:"Evaluación sin preguntas" })
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

    /* =========================
    CREAR SESIÓN NUEVA
    ========================= */
    const session = await prisma.evaluationSession.create({
      data:{
        participantId,
        evaluationId,
        status:"IN_PROGRESS"
      }
    })

    console.log("✅ SESSION CREATED:", session.id)

    /* =========================
    CREAR RESPUESTAS
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
    MARCAR COMO STARTED
    ========================= */
    if(assignment.status === "PENDING"){
      await prisma.assignment.update({
        where:{ id: assignment.id },
        data:{ status:"STARTED" }
      })
    }

    return res.json(session)

  }catch(e){
    console.error("❌ ERROR CREANDO SESIÓN:", e)
    res.status(500).json({ error:"Error creando sesión" })
  }

})

/* ======================================
GET SESIÓN
====================================== */
router.get("/:id", async (req,res)=>{

  try{

    const session = await prisma.evaluationSession.findUnique({
      where:{ id:req.params.id },
      include:{
        answers:{
          include:{ question:true }
        }
      }
    })

    if(!session){
      return res.status(404).json({ error:"Sesión no encontrada" })
    }

    const questions = session.answers.map(a => a.question)

    return res.json({
      id: session.id,
      questions
    })

  }catch(e){
    console.error("❌ ERROR GET SESSION:", e)
    res.status(500).json({ error:"Error obteniendo sesión" })
  }

})

export default router