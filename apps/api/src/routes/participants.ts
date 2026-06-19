import { Router } from "express"
import prisma from "../db"
import { randomUUID } from "crypto"
import { sendEvaluationEmail } from "../utils/email"
import { authMiddleware } from "../auth"
import { requirePermission } from "../permissions"

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
VALIDAR PROPIEDAD EMPRESA
====================================== */
async function ensureParticipantAccess(req:any, participantId:string){

  if(req.user?.role !== "COMPANY_ADMIN"){
    return true
  }

  const participant =
    await prisma.participant.findUnique({
      where:{ id:participantId }
    })

  if(
    !participant ||
    participant.companyId !== req.user.companyId
  ){
    return false
  }

  return true

}

/* ======================================
OBTENER PARTICIPANTES
====================================== */
router.get(
  "/",
  authMiddleware,
  requirePermission("PARTICIPANTS_VIEW"),
  async (req:any, res) => {

  try {

    let where:any = {}

    if(req.user?.role === "COMPANY_ADMIN"){

      where.companyId = req.user.companyId

    }

    const participants =
      await prisma.participant.findMany({

      where,

      include:{
        company:true
      },

      orderBy:{
        createdAt:"desc"
      }

    })

    return res.json(participants)

  } catch (error:any) {

    console.error(
      "GET PARTICIPANTS ERROR:",
      error?.message,
      error
    )

    return res.status(500).json({
      error:"Error obteniendo participantes"
    })

  }

})

/* ======================================
CREAR PARTICIPANTE
====================================== */
router.post(
  "/",
  authMiddleware,
  requirePermission("PARTICIPANTS_CREATE"),
  async (req:any, res) => {

  try {

    const {

      nombre,
      apellido,
      rut,
      perfil,
      email,
      companyId

    } = req.body

    if(!nombre || !apellido || !rut){

      return res.status(400).json({
        error:"Nombre, apellido y rut requeridos"
      })

    }

    let finalCompanyId = companyId || null

    if(req.user?.role === "COMPANY_ADMIN"){

      finalCompanyId = req.user.companyId

    }

    const cleanRut = normalizeRut(rut)

    const existing =
      await prisma.participant.findFirst({

      where:{
        rut: cleanRut,
        companyId: finalCompanyId
      }

    })

    if(existing){

      return res.status(400).json({
        error:"Este RUT ya existe en esta empresa"
      })

    }

    const token = randomUUID()

    const participant =
      await prisma.participant.create({

      data:{

        nombre,
        apellido,

        rut: cleanRut,

        perfil,

        email,

        accessToken: token,

        companyId: finalCompanyId

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

    console.error(
      "CREATE PARTICIPANT ERROR:",
      error?.message,
      error
    )

    return res.status(500).json({
      error:"Error creando participante"
    })

  }

})

/* ======================================
ACTUALIZAR PARTICIPANTE
====================================== */
router.put(
  "/:id",
  authMiddleware,
  requirePermission("PARTICIPANTS_EDIT"),
  async (req:any, res) => {

  try {

    const id = req.params.id

    const {

      nombre,
      apellido,
      rut,
      perfil,
      email,
      companyId

    } = req.body

    if(!nombre || !apellido || !rut){

      return res.status(400).json({
        error:"Nombre, apellido y rut requeridos"
      })

    }

    const allowed =
      await ensureParticipantAccess(req,id)

    if(!allowed){

      return res.status(403).json({
        error:"No autorizado"
      })

    }

    let finalCompanyId = companyId || null

    if(req.user?.role === "COMPANY_ADMIN"){

      finalCompanyId = req.user.companyId

    }

    const cleanRut = normalizeRut(rut)

    const existing =
      await prisma.participant.findFirst({

      where:{

        rut: cleanRut,

        companyId: finalCompanyId,

        NOT:{ id }

      }

    })

    if(existing){

      return res.status(400).json({
        error:"Este RUT ya existe en esta empresa"
      })

    }

    const participant =
      await prisma.participant.update({

      where:{ id },

      data:{

        nombre,
        apellido,

        rut: cleanRut,

        perfil,

        email,

        companyId: finalCompanyId

      }

    })

    res.json(participant)

  } catch (error:any) {

    console.error(
      "UPDATE PARTICIPANT ERROR:",
      error?.message,
      error
    )

    res.status(500).json({
      error:"Error actualizando participante"
    })

  }

})

/* ======================================
REENVIAR INVITACIÓN
====================================== */
router.post(
  "/:id/resend",
  authMiddleware,
  requirePermission("PARTICIPANTS_INVITE"),
  async (req:any, res) => {

  try {

    const id = req.params.id

    const participant =
      await prisma.participant.findUnique({

      where:{ id }

    })

    if(!participant){

      return res.status(404).json({
        error:"Participante no encontrado"
      })

    }

    if(
      req.user?.role === "COMPANY_ADMIN" &&
      participant.companyId !== req.user.companyId
    ){

      return res.status(403).json({
        error:"No autorizado"
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

        data:{
          accessToken: token
        }

      })

    }

    await sendEvaluationEmail(

      participant.email,

      `${participant.nombre} ${participant.apellido}`,

      token

    )

    res.json({
      success:true
    })

  } catch (error:any) {

    console.error(
      "RESEND ERROR:",
      error?.message,
      error
    )

    res.status(500).json({
      error:"Error reenviando invitación"
    })

  }

})

/* ======================================
ELIMINAR PARTICIPANTE
====================================== */
router.delete(
  "/:id",
  authMiddleware,
  requirePermission("PARTICIPANTS_DELETE"),
  async (req:any, res) => {

  try {

    const id = req.params.id

    const allowed =
      await ensureParticipantAccess(req,id)

    if(!allowed){

      return res.status(403).json({
        error:"No autorizado"
      })

    }

    const participant =
      await prisma.participant.findUnique({
        where:{ id }
      })

    if(!participant){

      return res.status(404).json({
        error:"Participante no encontrado"
      })

    }

    const sessions =
      await prisma.evaluationSession.findMany({
        where:{
          participantId:id
        },
        select:{
          id:true
        }
      })

    const sessionIds =
      sessions.map(s=>s.id)

    await prisma.$transaction(async(tx)=>{

      await tx.evaluationAnswer.deleteMany({
        where:{
          sessionId:{
            in: sessionIds
          }
        }
      })

      await tx.evaluationResult.deleteMany({
        where:{
          participantId:id
        }
      })

      await tx.assignment.deleteMany({
        where:{
          participantId:id
        }
      })

      await tx.evaluationSession.deleteMany({
        where:{
          participantId:id
        }
      })

      await tx.participant.delete({
        where:{ id }
      })

    })

    return res.json({
      success:true
    })

  } catch (error:any) {

    console.error(
      "DELETE PARTICIPANT ERROR:",
      error?.message,
      error
    )

    return res.status(500).json({
      error:"Error eliminando participante"
    })

  }

})

export default router