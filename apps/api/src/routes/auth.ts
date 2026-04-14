import { Router } from "express"
import prisma from "../db"
import { signAccessToken } from "../utils/jwt"

const router = Router()

/*
=====================================
LOGIN SOLO PARA USUARIOS (ADMIN)
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

    const user = await prisma.user.findUnique({
      where: { rut }
    })

    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado"
      })
    }

    // ⚠️ Comparación simple (después podemos meter bcrypt)
    if (user.password !== password) {
      return res.status(401).json({
        error: "Credenciales inválidas"
      })
    }

    const token = signAccessToken({
      sub: user.id,
      rut: user.rut,
      role: user.role,
      companyId: user.companyId
    })

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

  } catch (error) {

    console.error("LOGIN ERROR:", error)

    return res.status(500).json({
      error: "Error en login"
    })

  }

})

export default router