import { Router } from "express"
import prisma from "../db"
import { verifyAccessToken } from "../utils/jwt"

const router = Router()

/* ===============================
USER AUTH
=============================== */
function getUser(req:any){
  const auth = req.headers.authorization || ""
  if(!auth.startsWith("Bearer ")) return null
  const token = auth.replace("Bearer ","")
  return verifyAccessToken(token)
}

function isAdmin(user:any){
  return user?.role === "SUPERADMIN" || user?.role === "PSYCHOLOGIST"
}

/* ===============================
UTIL
=============================== */
function shuffle(arr:any[]){
  const a = [...arr]
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1))
    const temp=a[i]
    a[i]=a[j]
    a[j]=temp
  }
  return a
}

/* ======================================
LISTAR EVALUACIONES (TODOS PUEDEN)
====================================== */
router.get("/", async (req,res)=>{

  const data = await prisma.evaluation.findMany()
  res.json(data)

})

/* ======================================
OBTENER EVALUACIÓN (VER / EDITOR)
====================================== */
router.get("/:id", async (req,res)=>{

  const id = String(req.params.id)

  const evaluation = await prisma.evaluation.findUnique({
    where:{ id },
    include:{ questions:true }
  })

  res.json(evaluation)

})

/* ======================================
🔥 EDITAR EVALUACIÓN (PROTEGIDO)
====================================== */
router.put("/:id", async (req,res)=>{

  const user = getUser(req)

  if(!user){
    return res.status(401).json({ error:"No autorizado" })
  }

  if(!isAdmin(user)){
    return res.status(403).json({
      error:"No tienes permisos para editar evaluaciones"
    })
  }

  const id = String(req.params.id)
  const { name, type } = req.body

  const updated = await prisma.evaluation.update({
    where:{ id },
    data:{
      name,
      type
    }
  })

  res.json(updated)

})

/* ======================================
🔥 CREAR EVALUACIÓN (PROTEGIDO)
====================================== */
router.post("/", async (req,res)=>{

  const user = getUser(req)

  if(!user){
    return res.status(401).json({ error:"No autorizado" })
  }

  if(!isAdmin(user)){
    return res.status(403).json({
      error:"No tienes permisos para crear evaluaciones"
    })
  }

  const { name, type } = req.body

  const created = await prisma.evaluation.create({
    data:{
      name,
      type
    }
  })

  res.json(created)

})

/* ======================================
🔥 ELIMINAR EVALUACIÓN (SUPERADMIN / PSYCHOLOGIST)
====================================== */
router.delete("/:id", async (req,res)=>{

  const user = getUser(req)

  if(!user){
    return res.status(401).json({
      error:"No autorizado"
    })
  }

  if(!isAdmin(user)){
    return res.status(403).json({
      error:"No tienes permisos para eliminar evaluaciones"
    })
  }

  try{

    const id = String(req.params.id)

    const evaluation = await prisma.evaluation.findUnique({
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

    console.error("DELETE EVALUATION ERROR:", err)

    return res.status(500).json({
      error:"Error eliminando evaluación"
    })

  }

})
/* ======================================
🔥 TEST (SOLO ADMIN)
====================================== */
router.get("/:id/test", async (req,res)=>{

  const user = getUser(req)

  if(!user){
    return res.status(401).json({ error:"No autorizado" })
  }

  if(!isAdmin(user)){
    return res.status(403).json({
      error:"No tienes permisos para probar evaluaciones"
    })
  }

  try{

    const id = String(req.params.id)

    const evaluation = await prisma.evaluation.findUnique({
      where:{ id },
      include:{ questions:true }
    })

    if(!evaluation){
      return res.status(404).json({
        error:"Evaluación no existe"
      })
    }

    let questions = evaluation.questions

    if(evaluation.type === "SECURITY"){
      questions = shuffle(questions).slice(0,20)
    }

    res.json({
      evaluation:{
        id: evaluation.id,
        name: evaluation.name,
        type: evaluation.type
      },
      questions: questions.map(q=>({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.optionsJson ? JSON.parse(q.optionsJson) : null
      }))
    })

  }catch(err){

    console.error("ERROR TEST:", err)

    res.status(500).json({
      error:"Error cargando test"
    })

  }

})

export default router