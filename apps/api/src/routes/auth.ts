import { Router } from "express"
import prisma from "../db"
import { signToken } from "../utils/jwt"
import jwt from "jsonwebtoken"

const router = Router()

/* =====================================
NORMALIZAR RUT
===================================== */
function normalizeRut(rut: string){

  if(!rut) return ""

  let clean = rut.replace(/\./g,"").replace(/\s/g,"")

  if(clean.includes("-")){
    const [num,dv] = clean.split("-")
    return `${num}-${dv.toLowerCase()}`
  }

  const body = clean.slice(0,-1)
  const dv = clean.slice(-1)

  return `${body}-${dv.toLowerCase()}`
}

/*
=====================================
LOGIN
=====================================
*/
router.post("/login", async (req, res) => {

  try {

    const { rut, password } = req.body

    if (!rut || !password) {
      return res.status(400).json({
        error: "RUT y contraseña requeridos"
      })
    }

    const rutNormalized = normalizeRut(rut)
    const rutNoDash = rutNormalized.replace("-", "")

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { rut: rutNormalized },
          { rut: rutNoDash }
        ]
      }
    })

    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado"
      })
    }

    if (user.password !== password) {
      return res.status(401).json({
        error: "Credenciales inválidas"
      })
    }

    const token = signToken(user)

    return res.json({
      ok: true,
      token,
      forcePasswordChange: user.forcePasswordChange,
      user: {
        id: user.id,
        name: user.name,
        rut: user.rut,
        role: user.role
      }
    })

  } catch (error: any) {

    console.error("LOGIN ERROR DETALLE:", error)

    return res.status(500).json({
      error: "Error en login",
      detalle: error?.message || error
    })

  }

})

/*
=====================================
CAMBIO DE CONTRASEÑA
=====================================
*/
router.post("/change-password", async (req, res) => {

  try {

    const { password } = req.body

    if (!password) {
      return res.status(400).json({
        error: "Contraseña requerida"
      })
    }

    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        error: "No autorizado"
      })
    }

    const token = authHeader.split(" ")[1]

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string)

    const userId = decoded.id

    await prisma.user.update({
      where: { id: userId },
      data: {
        password,
        forcePasswordChange: false
      }
    })

    return res.json({
      ok: true
    })

  } catch (error: any) {

    console.error("CHANGE PASSWORD ERROR:", error)

    return res.status(500).json({
      error: "Error al cambiar contraseña"
    })

  }

})

export default router