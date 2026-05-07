import { Router } from "express"
import prisma from "../db"
import { authMiddleware } from "../auth"

const router = Router()

/* ======================================================
GET COMPANIES
====================================================== */

router.get("/", authMiddleware, async (req:any, res) => {

  try {

    const user = req.user

    /* ======================================
    SUPERADMIN Y PSYCHOLOGIST
    ====================================== */

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

    /* ======================================
    COMPANY ADMIN
    ====================================== */

    if(user.role === "COMPANY_ADMIN"){

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

    /* ======================================
    OTROS ROLES
    ====================================== */

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

router.post("/", authMiddleware, async (req:any, res) => {

  try {

    /* ======================================
    SOLO SUPERADMIN
    ====================================== */

    if(req.user.role !== "SUPERADMIN"){

      return res.status(403).json({
        error:"Sin permisos"
      })

    }

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

router.delete("/:id", authMiddleware, async (req:any, res) => {

  try {

    /* ======================================
    SOLO SUPERADMIN
    ====================================== */

    if(req.user.role !== "SUPERADMIN"){

      return res.status(403).json({
        error:"Sin permisos"
      })

    }

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