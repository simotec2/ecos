import { Router } from "express"
import prisma from "../db"
import { signAccessToken } from "../utils/jwt"
import { authMiddleware } from "../auth"

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

    console.error(error)

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

    console.error(error)

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

    console.error(error)

    res.status(500).json({ error: "Error deleting user" })

  }

})

/* =====================================
LOGIN AS
===================================== */

router.post("/loginAs/:id", authMiddleware, async (req:any, res) => {

  try {

    const currentUser = req.user

    if(!currentUser || currentUser.role !== "SUPERADMIN"){

      return res.status(403).json({
        error:"Solo el SUPERADMIN puede usar Ver como"
      })

    }

    const { companyId } = req.body || {}

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        company: true
      }
    })

    if (!user) {

      return res.status(404).json({ error: "User not found" })

    }

    let effectiveCompanyId = user.companyId
    let effectiveCompany = user.company

    if(user.role === "COMPANY_ADMIN"){

      if(!companyId){

        return res.status(400).json({
          error:"Debe seleccionar una empresa para ver como COMPANY_ADMIN"
        })

      }

      const selectedCompany = await prisma.company.findUnique({
        where:{
          id: companyId
        }
      })

      if(!selectedCompany){

        return res.status(404).json({
          error:"Empresa seleccionada no encontrada"
        })

      }

      effectiveCompanyId = selectedCompany.id
      effectiveCompany = selectedCompany

    }

    const token = signAccessToken({
      id: user.id,
      role: user.role,
      companyId: effectiveCompanyId
    })

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        rut: user.rut,
        role: user.role,
        companyId: effectiveCompanyId,
        company: effectiveCompany
      }
    })

  } catch (error) {

    console.error("LOGIN AS ERROR:", error)

    res.status(500).json({ error: "LoginAs error" })

  }

})
/* =====================================
RESET PASSWORD
===================================== */

router.put("/:id/reset-password", async (req, res) => {

  try {

    const { password } = req.body

    if(!password){

      return res.status(400).json({
        error:"Password requerida"
      })

    }

    const user = await prisma.user.update({

      where:{
        id:req.params.id
      },

      data:{
        password
      }

    })

    res.json({
      ok:true,
      user
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error:"Error resetting password"
    })

  }

})

export default router