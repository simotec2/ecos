import { Router } from "express"
import prisma from "../db"
import { randomUUID } from "crypto"
import { sendEvaluationEmail } from "../utils/email"

const router = Router()

/* ======================================
OBTENER PARTICIPANTES
====================================== */
router.get("/", async (req, res) => {

  try {

    const participants = await prisma.participant.findMany({
      include:{ company:true },
      orderBy:{ createdAt:"desc" }
    })

    res.json(participants)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error:"Error obteniendo participantes"
    })

  }

})

/* ======================================
CREAR PARTICIPANTE (PRO)
====================================== */
router.post("/", async (req, res) => {

  try {

    const {
      nombre,
      apellido,
      rut,
      email,
      companyId
    } = req.body

    if(!nombre || !apellido || !rut){
      return res.status(400).json({
        error:"Nombre, apellido y rut requeridos"
      })
    }

    /* =========================
    NORMALIZAR RUT
    ========================= */
    const cleanRut = rut
      .replace(/\./g,"")
      .replace(/\s/g,"")
      .toLowerCase()

    /* =========================
    VALIDAR DUPLICADO POR EMPRESA
    ========================= */
    const existing = await prisma.participant.findFirst({
      where:{
        rut: cleanRut,
        companyId: companyId || null
      }
    })

    if(existing){
      return res.status(400).json({
        error:"Este RUT ya existe en esta empresa"
      })
    }

    const token = randomUUID()

    const participant = await prisma.participant.create({
      data:{
        nombre,
        apellido,
        rut: cleanRut,
        email,
        accessToken: token,
        companyId: companyId || null
      }
    })

    if(email){
      await sendEvaluationEmail(
        email,
        `${nombre} ${apellido}`,
        token
      )
    }

    res.json(participant)

  } catch (error:any) {

    console.error(error)

    if(error.code === "P2002"){
      return res.status(400).json({
        error:"Duplicado detectado"
      })
    }

    res.status(500).json({
      error:"Error creando participante"
    })

  }

})

/* ======================================
ACTUALIZAR PARTICIPANTE
====================================== */
router.put("/:id", async (req, res) => {

  try {

    const id = req.params.id

    const {
      nombre,
      apellido,
      rut,
      email,
      companyId
    } = req.body

    const cleanRut = rut
      ?.replace(/\./g,"")
      .replace(/\s/g,"")
      .toLowerCase()

    const participant = await prisma.participant.update({
      where:{ id },
      data:{
        nombre,
        apellido,
        rut: cleanRut,
        email,
        companyId: companyId || null
      }
    })

    res.json(participant)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error:"Error actualizando participante"
    })

  }

})

/* ======================================
ELIMINAR PARTICIPANTE
====================================== */
router.delete("/:id", async (req, res) => {

  try {

    const id = req.params.id

    await prisma.participant.delete({
      where:{ id }
    })

    res.json({ success:true })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error:"Error eliminando participante"
    })

  }

})

/* ======================================
ACCESS PARTICIPANTE
====================================== */
router.get("/access/:token", async (req,res)=>{

  try{

    const { token } = req.params

    const participant = await prisma.participant.findFirst({
      where:{ accessToken: token },
      include:{ company:true }
    })

    if(!participant){
      return res.status(404).json({
        error:"Participante no encontrado"
      })
    }

    const assignments = await prisma.assignment.findMany({
      where:{
        participantId: participant.id,
        status:{ in:["PENDING","STARTED"] }
      },
      include:{ evaluation:true },
      orderBy:{ createdAt:"desc" }
    })

    const evaluations = assignments.map(a=>({
      id: a.evaluation.id,
      name: a.evaluation.name,
      type: a.evaluation.type,
      status: a.status
    }))

    return res.json({
      participant,
      evaluations
    })

  }catch(err){

    console.error(err)

    return res.status(500).json({
      error:"Error obteniendo acceso"
    })

  }

})

export default router