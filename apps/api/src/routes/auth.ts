import { Router } from "express"
import prisma from "../db"
import { signToken } from "../utils/jwt" // 🔥 IMPORT CORRECTO

const router = Router()

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
    BUSCAR USUARIO
    ========================= */

    const user = await prisma.user.findUnique({
      where: { rut }
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

    /* =========================
    LOG REAL (CLAVE EN RENDER)
    ========================= */

    console.error("LOGIN ERROR DETALLE:", error)

    return res.status(500).json({
      error: "Error en login",
      detalle: error?.message || error
    })

  }

})

export default router