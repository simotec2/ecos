import { Router } from "express"
import prisma from "../db"
import { authMiddleware } from "../auth"

const router = Router()

/* ======================================
LISTAR ASIGNACIONES
====================================== */

router.get("/", authMiddleware, async (req:any,res)=>{

  try{

    const user = req.user

    /* ======================================
    SUPERADMIN Y PSYCHOLOGIST
    ====================================== */

    if(
      user.role === "SUPERADMIN" ||
      user.role === "PSYCHOLOGIST"
    ){

      const data = await prisma.assignment.findMany({

        include:{
          participant:{
            include:{
              company:true
            }
          },

          evaluation:true
        },

        orderBy:{
          createdAt:"desc"
        }

      })

      return res.json(data)

    }

    /* ======================================
    COMPANY ADMIN
    ====================================== */

    if(user.role === "COMPANY_ADMIN"){

      const data = await prisma.assignment.findMany({

        where:{
          participant:{
            companyId:user.companyId
          }
        },

        include:{
          participant:{
            include:{
              company:true
            }
          },

          evaluation:true
        },

        orderBy:{
          createdAt:"desc"
        }

      })

      return res.json(data)

    }

    /* ======================================
    OTROS ROLES
    ====================================== */

    return res.json([])

  }catch(err){

    console.error(
      "❌ ERROR LISTANDO:",
      err
    )

    res.status(500).json({
      error:"Error obteniendo asignaciones"
    })

  }

})

/* ======================================
ASIGNAR / REASIGNAR
====================================== */

router.post("/", authMiddleware, async (req:any,res)=>{

  try{

    const user = req.user

    const participantId = String(
      req.body.participantId || ""
    )

    const evaluationId = String(
      req.body.evaluationId || ""
    )

    if(!participantId || !evaluationId){

      return res.status(400).json({
        error:"Datos requeridos"
      })

    }

    /* ======================================
    VALIDAR EMPRESA
    ====================================== */

    if(user.role === "COMPANY_ADMIN"){

      const participant =
        await prisma.participant.findUnique({

          where:{
            id:participantId
          }

        })

      if(
        !participant ||
        participant.companyId !== user.companyId
      ){

        return res.status(403).json({
          error:"Sin permisos"
        })

      }

    }

    /* ======================================
    BUSCAR EXISTENTE
    ====================================== */

    const existing =
      await prisma.assignment.findFirst({

        where:{
          participantId,
          evaluationId
        }

      })

    /* ======================================
    REASIGNAR
    ====================================== */

    if(existing){

      const updated =
        await prisma.assignment.update({

        where:{
          id: existing.id
        },

        data:{
          status:"PENDING"
        }

      })

      console.log(
        "♻️ REASIGNANDO:",
        updated.id
      )

      return res.json({

        message:"Asignación reiniciada",

        assignment: updated

      })

    }

    /* ======================================
    CREAR
    ====================================== */

    const created =
      await prisma.assignment.create({

      data:{
        participantId,
        evaluationId,
        status:"PENDING"
      }

    })

    console.log(
      "✅ NUEVA ASIGNACIÓN:",
      created.id
    )

    return res.json({

      message:"Asignación creada",

      assignment: created

    })

  }catch(err:any){

    console.error(
      "❌ ERROR ASIGNANDO:",
      err
    )

    if(err.code === "P2002"){

      return res.status(200).json({

        message:
          "Asignación ya existente"

      })

    }

    res.status(500).json({
      error:"Error asignando evaluación"
    })

  }

})

export default router