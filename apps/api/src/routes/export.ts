import { Router } from "express"
import prisma from "../db"
import * as XLSX from "xlsx"
import { verifyAccessToken } from "../utils/jwt"

const router = Router()

/* =====================================
AUTH
===================================== */

function getUser(req:any){

  try{

    const auth =
      req.headers.authorization || ""

    if(!auth.startsWith("Bearer ")){
      return null
    }

    const token =
      auth.replace("Bearer ","")

    return verifyAccessToken(token)

  }catch{

    return null

  }

}

/* =====================================
EXPORTAR RESULTADOS
===================================== */

router.get("/results", async (req,res)=>{

  try{

    const user:any = getUser(req)

    if(!user){

      return res.status(401).json({
        error:"No autorizado"
      })

    }

    /* =========================
    FILTRO EMPRESA
    ========================= */

    const participantWhere:any = {}

    if(user.role === "COMPANY_ADMIN"){

      participantWhere.companyId =
        user.companyId

    }

    /* =========================
    RESULTADOS
    ========================= */

    const results =
      await prisma.evaluationResult.findMany({

      where:{

        participant:{
          ...participantWhere
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

    /* =========================
    EXCEL ROWS
    ========================= */

    const rows = results.map((r:any)=>{

      let parsed:any = {}

      try{

        parsed =
          typeof r.resultJson === "string"
            ? JSON.parse(r.resultJson)
            : r.resultJson || {}

      }catch{

        parsed = {}

      }

      return {

        Fecha:
          new Date(r.createdAt)
            .toLocaleDateString("es-CL"),

        Empresa:
          r.participant?.company?.name || "",

        Participante:
          `${r.participant?.nombre || ""} ${r.participant?.apellido || ""}`,

        Perfil:
          r.participant?.perfil || "",

        Evaluacion:
          r.evaluation?.name || "",

        Tipo:
          r.evaluation?.type || "",

        Puntaje:
          r.score || 0,

        Resultado:
          parsed?.traffic?.result || "",

        Semaforo:
          parsed?.traffic?.color || ""

      }

    })

    /* =========================
    WORKBOOK
    ========================= */

    const workbook =
      XLSX.utils.book_new()

    const worksheet =
      XLSX.utils.json_to_sheet(rows)

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Resultados"
    )

    const buffer =
      XLSX.write(workbook, {

      type:"buffer",

      bookType:"xlsx"

    })

    /* =========================
    RESPONSE
    ========================= */

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=resultados_ecos.xlsx"
    )

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    return res.send(buffer)

  }catch(error){

    console.error(error)

    return res.status(500).json({
      error:"Error exportando Excel"
    })

  }

})

export default router