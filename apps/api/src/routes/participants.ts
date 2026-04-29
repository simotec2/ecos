import { Router } from "express"
import prisma from "../db"
import { randomUUID } from "crypto"
import { sendEvaluationEmail } from "../utils/email"

const router = Router()

/* ======================================
UTIL: NORMALIZAR RUT
====================================== */
function normalizeRut(rut: string){

  if(!rut) return ""

  let clean = rut
    .replace(/\./g,"")
    .replace(/\s/g,"")
    .toLowerCase()

  if(clean.includes("-")){
    const [num,dv] = clean.split("-")
    return `${num}-${dv}`
  }

  const body = clean.slice(0,-1)
  const dv = clean.slice(-1)

  return `${body}-${dv}`
}

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

  } catch (error:any) {

    console.error("GET PARTICIPANTS ERROR:", error?.message, error)

    res.status(500).json({
      error:"Error obteniendo participantes"
    })

  }

})

/* ======================================
CREAR PARTICIPANTE
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

    const cleanRut = normalizeRut(rut)

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

    res.json(participant)

    if(email){
      sendEvaluationEmail(
        email,
        `${nombre} ${apellido}`,
        token
      )
    }

  } catch (error:any) {

    console.error("CREATE PARTICIPANT ERROR:", error?.message, error)

    return res.status(500).json({
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

    if(!nombre || !apellido || !rut){
      return res.status(400).json({
        error:"Nombre, apellido y rut requeridos"
      })
    }

    const cleanRut = normalizeRut(rut)

    const existing = await prisma.participant.findFirst({
      where:{
        rut: cleanRut,
        companyId: companyId || null,
        NOT:{ id }
      }
    })

    if(existing){
      return res.status(400).json({
        error:"Este RUT ya existe en esta empresa"
      })
    }

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

  } catch (error:any) {

    console.error("UPDATE PARTICIPANT ERROR:", error?.message, error)

    res.status(500).json({
      error:"Error actualizando participante"
    })

  }

})

/* ======================================
REENVIAR INVITACIÓN
====================================== */
router.post("/:id/resend", async (req, res) => {

  try {

    const id = req.params.id

    const participant = await prisma.participant.findUnique({
      where:{ id }
    })

    if(!participant){
      return res.status(404).json({
        error:"Participante no encontrado"
      })
    }

    if(!participant.email){
      return res.status(400).json({
        error:"El participante no tiene email"
      })
    }

    let token = participant.accessToken

    if(!token){

      token = randomUUID()

      await prisma.participant.update({
        where:{ id },
        data:{ accessToken: token }
      })

    }

    await sendEvaluationEmail(
      participant.email,
      `${participant.nombre} ${participant.apellido}`,
      token
    )

    res.json({ success:true })

  } catch (error:any) {

    console.error("RESEND ERROR:", error?.message, error)

    res.status(500).json({
      error:"Error reenviando invitación"
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

  } catch (error:any) {

    console.error("DELETE PARTICIPANT ERROR:", error?.message, error)

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

  }catch(err:any){

    console.error("ERROR ACCESS:", err?.message, err)

    return res.status(500).json({
      error:"Error obteniendo acceso"
    })

  }

})

export default router