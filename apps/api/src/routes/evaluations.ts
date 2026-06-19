import { Router } from "express"
import prisma from "../db"
import { authMiddleware } from "../auth"
import {
  requireAnyPermission,
  requirePermission
} from "../permissions"

const router = Router()

function shuffle(arr:any[]){

  const a = [...arr]

  for(let i=a.length-1;i>0;i--){

    const j =
      Math.floor(Math.random()*(i+1))

    const temp = a[i]

    a[i] = a[j]
    a[j] = temp

  }

  return a

}

function getDefaultDurationMinutes(type:string){

  if(type === "PETS"){
    return 75
  }

  if(type === "ICOM"){
    return 45
  }

  if(type === "SECURITY"){
    return 30
  }

  return 30

}

/* ======================================
LISTAR EVALUACIONES
====================================== */

router.get(
  "/",
  authMiddleware,
  requireAnyPermission([
    "EVALUATIONS_VIEW",
    "ASSIGNMENTS_VIEW",
    "ASSIGNMENTS_CREATE"
  ]),
  async (req:any,res)=>{

  try{

    const data =
      await prisma.evaluation.findMany({

      orderBy:{
        createdAt:"desc"
      }

    })

    res.json(data)

  }catch(err){

    console.error(
      "LIST EVALUATIONS ERROR:",
      err
    )

    res.status(500).json({
      error:"Error obteniendo evaluaciones"
    })

  }

})

/* ======================================
TEST EVALUACIÓN
IMPORTANTE: ANTES DE /:id
====================================== */

router.get(
  "/:id/test",
  authMiddleware,
  requirePermission("EVALUATIONS_TEST"),
  async (req:any,res)=>{

  try{

    const id =
      String(req.params.id)

    const evaluation =
      await prisma.evaluation.findUnique({

      where:{ id },

      include:{
        questions:true
      }

    })

    if(!evaluation){

      return res.status(404).json({
        error:"Evaluación no existe"
      })

    }

    let questions =
      evaluation.questions

    if(evaluation.type === "SECURITY"){
      questions = shuffle(questions).slice(0,20)
    }

    res.json({

      evaluation:{
        id: evaluation.id,
        name: evaluation.name,
        type: evaluation.type,
        durationMinutes: evaluation.durationMinutes
      },

      questions: questions.map(q=>({

        id: q.id,
        text: q.text,
        type: q.type,
        competency: q.competency,
        weight: q.weight,
        correctAnswer: q.correctAnswer,

        options:
          q.optionsJson
            ? JSON.parse(q.optionsJson)
            : null

      }))

    })

  }catch(err){

    console.error(
      "ERROR TEST:",
      err
    )

    res.status(500).json({
      error:"Error cargando test"
    })

  }

})

/* ======================================
OBTENER EVALUACIÓN
====================================== */

router.get(
  "/:id",
  authMiddleware,
  requireAnyPermission([
    "EVALUATIONS_VIEW",
    "EVALUATIONS_EDIT",
    "EVALUATIONS_TEST"
  ]),
  async (req:any,res)=>{

  try{

    const id =
      String(req.params.id)

    const evaluation =
      await prisma.evaluation.findUnique({

      where:{ id },

      include:{
        questions:true
      }

    })

    if(!evaluation){

      return res.status(404).json({
        error:"Evaluación no encontrada"
      })

    }

    res.json(evaluation)

  }catch(err){

    console.error(
      "GET EVALUATION ERROR:",
      err
    )

    res.status(500).json({
      error:"Error obteniendo evaluación"
    })

  }

})

/* ======================================
CREAR EVALUACIÓN
====================================== */

router.post(
  "/",
  authMiddleware,
  requirePermission("EVALUATIONS_CREATE"),
  async (req:any,res)=>{

  try{

    const {
      name,
      code,
      type,
      durationMinutes
    } = req.body

    if(!name || !type){

      return res.status(400).json({
        error:"Nombre y tipo requeridos"
      })

    }

    const duration =
      durationMinutes !== undefined &&
      durationMinutes !== null &&
      durationMinutes !== ""
        ? Number(durationMinutes)
        : getDefaultDurationMinutes(String(type))

    const created =
      await prisma.evaluation.create({

      data:{
        name,
        code,
        type,
        durationMinutes: duration
      }

    })

    res.json(created)

  }catch(err){

    console.error(
      "CREATE EVALUATION ERROR:",
      err
    )

    res.status(500).json({
      error:"Error creando evaluación"
    })

  }

})

/* ======================================
EDITAR EVALUACIÓN
====================================== */

router.put(
  "/:id",
  authMiddleware,
  requirePermission("EVALUATIONS_EDIT"),
  async (req:any,res)=>{

  try{

    const id =
      String(req.params.id)

    const {
      name,
      code,
      type,
      durationMinutes
    } = req.body

    const data:any = {}

    if(name !== undefined){
      data.name = name
    }

    if(code !== undefined){
      data.code = code
    }

    if(type !== undefined){
      data.type = type
    }

    if(durationMinutes !== undefined){

      data.durationMinutes =
        durationMinutes !== null &&
        durationMinutes !== ""
          ? Number(durationMinutes)
          : getDefaultDurationMinutes(String(type))

    }

    const updated =
      await prisma.evaluation.update({

      where:{ id },

      data

    })

    res.json(updated)

  }catch(err){

    console.error(
      "UPDATE EVALUATION ERROR:",
      err
    )

    res.status(500).json({
      error:"Error editando evaluación"
    })

  }

})

/* ======================================
ELIMINAR EVALUACIÓN
====================================== */

router.delete(
  "/:id",
  authMiddleware,
  requirePermission("EVALUATIONS_DELETE"),
  async (req:any,res)=>{

  try{

    const id =
      String(req.params.id)

    const evaluation =
      await prisma.evaluation.findUnique({
        where:{ id }
      })

    if(!evaluation){

      return res.status(404).json({
        error:"Evaluación no encontrada"
      })

    }

    const sessionsCount =
      await prisma.evaluationSession.count({
        where:{
          evaluationId:id
        }
      })

    const resultsCount =
      await prisma.evaluationResult.count({
        where:{
          evaluationId:id
        }
      })

    const assignmentsCount =
      await prisma.assignment.count({
        where:{
          evaluationId:id
        }
      })

    if(
      sessionsCount > 0 ||
      resultsCount > 0 ||
      assignmentsCount > 0
    ){

      return res.status(400).json({
        error:
          "No se puede eliminar esta evaluación porque ya tiene asignaciones, sesiones o resultados asociados."
      })

    }

    await prisma.$transaction(async(tx)=>{

      await tx.evaluationQuestion.deleteMany({
        where:{
          evaluationId:id
        }
      })

      await tx.evaluation.delete({
        where:{
          id
        }
      })

    })

    return res.json({
      ok:true
    })

  }catch(err){

    console.error(
      "DELETE EVALUATION ERROR:",
      err
    )

    return res.status(500).json({
      error:"Error eliminando evaluación"
    })

  }

})

export default router