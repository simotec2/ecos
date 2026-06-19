import { Router } from "express"
import prisma from "../db"
import { authMiddleware } from "../auth"
import {
  requireAnyPermission,
  requirePermission
} from "../permissions"

const router = Router()

/* ======================================================
GET COMPANIES
====================================================== */

router.get(
  "/",
  authMiddleware,
  requireAnyPermission([
    "COMPANIES_VIEW",
    "USERS_VIEW",
    "PARTICIPANTS_VIEW",
    "ASSIGNMENTS_VIEW",
    "RESULTS_VIEW",
    "REPORTS_VIEW",
    "DASHBOARD_VIEW"
  ]),
  async (req:any, res) => {

  try {

    const user = req.user

    if(
      user.role === "SUPERADMIN" ||
      user.role === "PSYCHOLOGIST"
    ){

      const companies = await prisma.company.findMany({

        orderBy:{
          createdAt:"desc"
        }

      })

      return res.json(companies)

    }

    if(user.role === "COMPANY_ADMIN"){

      if(!user.companyId){
        return res.json([])
      }

      const companies = await prisma.company.findMany({

        where:{
          id:user.companyId
        },

        orderBy:{
          createdAt:"desc"
        }

      })

      return res.json(companies)

    }

    return res.json([])

  } catch (error) {

    console.error(
      "Error companies:",
      error
    )

    res.status(500).json({
      error:"Error obteniendo empresas"
    })

  }

})

/* ======================================================
CREATE COMPANY
====================================================== */

router.post(
  "/",
  authMiddleware,
  requirePermission("COMPANIES_CREATE"),
  async (req:any, res) => {

  try {

    const {

      name,
      razonSocial,
      rut,
      direccion,
      giro,
      contactoNombre,
      contactoTelefono,
      contactoEmail

    } = req.body

    if (!name) {

      return res.status(400).json({
        error:"Nombre requerido"
      })

    }

    const company = await prisma.company.create({

      data:{

        name,
        razonSocial,
        rut,
        direccion,
        giro,
        contactoNombre,
        contactoTelefono,
        contactoEmail

      }

    })

    res.json(company)

  } catch (error) {

    console.error(
      "Error creando empresa:",
      error
    )

    res.status(500).json({
      error:"Error creando empresa"
    })

  }

})

/* ======================================================
DELETE COMPANY
====================================================== */

router.delete(
  "/:id",
  authMiddleware,
  requirePermission("COMPANIES_DELETE"),
  async (req:any, res) => {

  try {

    const { id } = req.params

    await prisma.company.delete({

      where:{ id }

    })

    res.json({
      success:true
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error:"Error eliminando empresa"
    })

  }

})

export default router