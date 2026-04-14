import { Router } from "express"
import prisma from "../db"
import { signAccessToken } from "../utils/jwt"

const router = Router()

/* =====================================
LISTAR USUARIOS
===================================== */

router.get("/", async (req, res) => {

  try {

    const users = await prisma.user.findMany({
      include: { company: true },
      orderBy: { createdAt: "desc" }
    })

    res.json(users)

  } catch (error) {

    res.status(500).json({ error: "Error loading users" })

  }

})


/* =====================================
CREAR USUARIO
===================================== */

router.post("/", async (req, res) => {

  try {

    const { rut, name, password, role, companyId } = req.body

    const user = await prisma.user.create({

      data: {
        rut,
        name,
        password,
        role,
        companyId
      }

    })

    res.json(user)

  } catch (error) {

    res.status(500).json({ error: "Error creating user" })

  }

})


/* =====================================
ACTUALIZAR USUARIO
===================================== */

router.put("/:id", async (req, res) => {

  try {

    const { name, rut, role, password, companyId } = req.body

    const user = await prisma.user.update({

      where: { id: req.params.id },

      data: {
        name,
        rut,
        role,
        password,
        companyId
      }

    })

    res.json(user)

  } catch (error) {

    res.status(500).json({ error: "Error updating user" })

  }

})


/* =====================================
ELIMINAR USUARIO
===================================== */

router.delete("/:id", async (req, res) => {

  try {

    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    /* evitar borrar el ultimo superadmin */

    if (user.role === "SUPERADMIN") {

      const admins = await prisma.user.count({
        where: { role: "SUPERADMIN" }
      })

      if (admins <= 1) {

        return res.status(400).json({
          error: "No se puede eliminar el último SUPERADMIN"
        })

      }

    }

    await prisma.user.delete({
      where: { id: req.params.id }
    })

    res.json({ ok: true })

  } catch (error) {

    res.status(500).json({ error: "Error deleting user" })

  }

})


/* =====================================
LOGIN AS (VER COMO USUARIO)
===================================== */

router.post("/loginAs/:id", async (req, res) => {

  try {

    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    })

    if (!user) {

      return res.status(404).json({ error: "User not found" })

    }

    const token = signAccessToken({

      sub: user.id,
      rut: user.rut,
      role: user.role,
      companyId: user.companyId

    })

    res.json({ token, user })

  } catch (error) {

    res.status(500).json({ error: "LoginAs error" })

  }

})

export default router