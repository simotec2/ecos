import { Router } from "express"
import prisma from "../db"
import { signToken } from "../utils/jwt"

const router = Router()

/* =====================================
NORMALIZAR RUT
===================================== */
function normalizeRut(rut: string){

  if(!rut) return ""

  // quitar puntos y espacios
  let clean = rut.replace(/\./g,"").replace(/\s/g,"")

  // si ya tiene guión
  if(clean.includes("-")){
    const [num,dv] = clean.split("-")
    return `${num}-${dv.toLowerCase()}`
  }

  // si NO tiene guión
  const body = clean.slice(0,-1)
  const dv = clean.slice(-1)

  return `${body}-${dv.toLowerCase()}`
}

/*
=====================================
LOGIN SOLO PARA USUARIOS (ADMIN)
=====================================
*/
router.post("/login", async (req, res) => {

  try {

    const { rut, password } = req.body

    /* =========================
    VALIDACIONES
    ========================= */

    if (!rut || !password) {
      return res.status(400).json({
        error: "RUT y contraseña requeridos"
      })
    }

    /* =========================
    NORMALIZAR RUT
    ========================= */

    const rutNormalized = normalizeRut(rut)
    const rutNoDash = rutNormalized.replace("-", "")

    /* =========================
    BUSCAR USUARIO (ROBUSTO)
    ========================= */

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

    /* =========================
    VALIDAR PASSWORD
    ========================= */

    if (user.password !== password) {
      return res.status(401).json({
        error: "Credenciales inválidas"
      })
    }

    /* =========================
    GENERAR TOKEN
    ========================= */

    const token = signToken(user)

    /* =========================
    RESPUESTA
    ========================= */

    return res.json({
      ok: true,
      token,
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

export default router