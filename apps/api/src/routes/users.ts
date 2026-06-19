import { Router } from "express"
import prisma from "../db"
import { signAccessToken } from "../utils/jwt"
import { authMiddleware } from "../auth"
import {
  getUserPermissions,
  normalizePermissions
} from "../permissions"

const router = Router()

function requireSuperAdmin(req:any, res:any){

  if(!req.user || req.user.role !== "SUPERADMIN"){

    res.status(403).json({
      error:"Solo el SUPERADMIN puede administrar usuarios"
    })

    return false

  }

  return true

}

function publicUser(user:any){

  const { password, ...safeUser } = user

  return {
    ...safeUser,
    permissions: getUserPermissions(user)
  }

}

/* =====================================
LISTAR USUARIOS
===================================== */

router.get("/", authMiddleware, async (req:any, res) => {

  try {

    if(!requireSuperAdmin(req,res)) return

    const users = await prisma.user.findMany({
      include: { company: true },
      orderBy: { createdAt: "desc" }
    })

    res.json(
      users.map(publicUser)
    )

  } catch (error) {

    console.error("USERS LIST ERROR:", error)

    res.status(500).json({
      error: "Error loading users"
    })

  }

})

/* =====================================
CREAR USUARIO
===================================== */

router.post("/", authMiddleware, async (req:any, res) => {

  try {

    if(!requireSuperAdmin(req,res)) return

    const {
      rut,
      name,
      password,
      role,
      companyId,
      permissions
    } = req.body

    if(!rut || !name || !password || !role){

      return res.status(400).json({
        error:"Faltan datos obligatorios"
      })

    }

    if(role === "COMPANY_ADMIN" && !companyId){

      return res.status(400).json({
        error:"Debe seleccionar una empresa"
      })

    }

    const cleanPermissions =
      Array.isArray(permissions)
        ? normalizePermissions(permissions)
        : null

    const user = await prisma.user.create({

      data: {
        rut,
        name,
        password,
        role,
        companyId:
          role === "COMPANY_ADMIN"
            ? companyId
            : null,
        permissionsJson:
          cleanPermissions
            ? JSON.stringify(cleanPermissions)
            : null
      },

      include:{
        company:true
      }

    })

    res.json(
      publicUser(user)
    )

  } catch (error:any) {

    console.error("CREATE USER ERROR:", error)

    res.status(500).json({
      error: error?.message || "Error creating user"
    })

  }

})

/* =====================================
ACTUALIZAR USUARIO
===================================== */

router.put("/:id", authMiddleware, async (req:any, res) => {

  try {

    if(!requireSuperAdmin(req,res)) return

    const {
      name,
      rut,
      role,
      password,
      companyId,
      permissions
    } = req.body

    const existing = await prisma.user.findUnique({
      where:{
        id:req.params.id
      }
    })

    if(!existing){

      return res.status(404).json({
        error:"Usuario no encontrado"
      })

    }

    if(role === "COMPANY_ADMIN" && !companyId){

      return res.status(400).json({
        error:"Debe seleccionar una empresa"
      })

    }

    const cleanPermissions =
      Array.isArray(permissions)
        ? normalizePermissions(permissions)
        : []

    const data:any = {
      name,
      rut,
      role,
      companyId:
        role === "COMPANY_ADMIN"
          ? companyId
          : null,
      permissionsJson:
        JSON.stringify(cleanPermissions)
    }

    if(password){
      data.password = password
    }

    const user = await prisma.user.update({

      where: {
        id: req.params.id
      },

      data,

      include:{
        company:true
      }

    })

    res.json(
      publicUser(user)
    )

  } catch (error:any) {

    console.error("UPDATE USER ERROR:", error)

    res.status(500).json({
      error: error?.message || "Error updating user"
    })

  }

})

/* =====================================
ELIMINAR USUARIO
===================================== */

router.delete("/:id", authMiddleware, async (req:any, res) => {

  try {

    if(!requireSuperAdmin(req,res)) return

    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    })

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      })
    }

    if (user.role === "SUPERADMIN") {

      const admins = await prisma.user.count({
        where: {
          role: "SUPERADMIN"
        }
      })

      if (admins <= 1) {

        return res.status(400).json({
          error: "No se puede eliminar el último SUPERADMIN"
        })

      }

    }

    await prisma.user.delete({
      where: {
        id: req.params.id
      }
    })

    res.json({
      ok: true
    })

  } catch (error:any) {

    console.error("DELETE USER ERROR:", error)

    res.status(500).json({
      error: error?.message || "Error deleting user"
    })

  }

})

/* =====================================
LOGIN AS
===================================== */

router.post("/loginAs/:id", authMiddleware, async (req:any, res) => {

  try {

    if(!requireSuperAdmin(req,res)) return

    const { companyId } = req.body || {}

    const user = await prisma.user.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        company: true
      }
    })

    if (!user) {

      return res.status(404).json({
        error: "User not found"
      })

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

    const userForPermissions = {
      ...user,
      companyId: effectiveCompanyId
    }

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        rut: user.rut,
        role: user.role,
        companyId: effectiveCompanyId,
        company: effectiveCompany,
        permissions: getUserPermissions(userForPermissions)
      }
    })

  } catch (error:any) {

    console.error("LOGIN AS ERROR:", error)

    res.status(500).json({
      error: error?.message || "LoginAs error"
    })

  }

})

/* =====================================
RESET PASSWORD
===================================== */

router.put("/:id/reset-password", authMiddleware, async (req:any, res) => {

  try {

    if(!requireSuperAdmin(req,res)) return

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
      },

      include:{
        company:true
      }

    })

    res.json({
      ok:true,
      user: publicUser(user)
    })

  } catch (error:any) {

    console.error("RESET PASSWORD ERROR:", error)

    res.status(500).json({
      error: error?.message || "Error resetting password"
    })

  }

})

export default router