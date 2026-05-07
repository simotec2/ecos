import { Router } from "express"
import prisma from "../db"
import { randomUUID } from "crypto"
import { sendEvaluationEmail } from "../utils/email"
import { authMiddleware } from "../auth"

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
router.get("/", authMiddleware, async (req:any, res) => {

  try {

    let where:any = {}

    /* ======================================
    COMPANY ADMIN SOLO SU EMPRESA
    ====================================== */

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
router.post("/", authMiddleware, async (req:any, res) => {

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

    /* ======================================
    COMPANY ADMIN SOLO SU EMPRESA
    ====================================== */

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

    /* ======================================
    ENVIAR EMAIL
    ====================================== */

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
router.put("/:id", authMiddleware, async (req:any, res) => {

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

    const current =
      await prisma.participant.findUnique({
        where:{ id }
      })

    if(!current){

      return res.status(404).json({
        error:"Participante no encontrado"
      })

    }

    /* ======================================
    COMPANY ADMIN SOLO SU EMPRESA
    ====================================== */

    if(
      req.user?.role === "COMPANY_ADMIN" &&
      current.companyId !== req.user.companyId
    ){

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
router.post("/:id/resend", authMiddleware, async (req:any, res) => {

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

    /* ======================================
    COMPANY ADMIN SOLO SU EMPRESA
    ====================================== */

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
router.delete("/:id", authMiddleware, async (req:any, res) => {

  try {

    if(req.user?.role !== "SUPERADMIN"){

      return res.status(403).json({
        error:"No autorizado"
      })

    }

    const id = req.params.id

    /* ======================================
    ELIMINAR RESULTADOS
    ====================================== */

    await prisma.evaluationResult.deleteMany({
      where:{ participantId:id }
    })

    /* ======================================
    ELIMINAR ASIGNACIONES
    ====================================== */

    await prisma.assignment.deleteMany({
      where:{ participantId:id }
    })

    /* ======================================
    ELIMINAR PARTICIPANTE
    ====================================== */

    await prisma.participant.delete({
      where:{ id }
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