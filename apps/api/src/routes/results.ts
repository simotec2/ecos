import { Router } from "express"
import prisma from "../db"
import { authMiddleware } from "../auth"
import {
  requireAnyPermission,
  requirePermission
} from "../permissions"

const router = Router()

/* ======================================
PUBLIC VIEW
====================================== */

router.get("/public/:id", async (req, res) => {

  try {

    const { id } = req.params

    const result =
      await prisma.evaluationResult.findUnique({

      where:{ id },

      include:{
        participant:{
          include:{ company:true }
        },
        evaluation:true
      }

    })

    if(!result){

      return res.status(404).json({
        error:"Resultado no encontrado"
      })

    }

    return res.json(result)

  } catch (error) {

    console.error(error)

    return res.status(500).json({
      error:"Error obteniendo resultado"
    })

  }

})

/* ======================================
LISTAR RESULTADOS
====================================== */

router.get(
  "/",
  authMiddleware,
  requireAnyPermission([
    "RESULTS_VIEW",
    "REPORTS_VIEW"
  ]),
  async (req:any, res) => {

  try {

    const user = req.user

    let where:any = {}

    if(user.role === "COMPANY_ADMIN"){

      where = {
        participant:{
          companyId:user.companyId
        }
      }

    }

    const results =
      await prisma.evaluationResult.findMany({

      where,

      include:{
        participant:{
          include:{ company:true }
        },
        evaluation:true
      },

      orderBy:{
        createdAt:"desc"
      }

    })

    const map = new Map()

    for(const r of results){

      const key =
        `${r.participantId}-${r.evaluationId}`

      if(!map.has(key)){
        map.set(key, r)
      }

    }

    return res.json(
      Array.from(map.values())
    )

  } catch (error) {

    console.error(
      "RESULTS LIST ERROR:",
      error
    )

    return res.status(500).json({
      error:"Error obteniendo resultados"
    })

  }

})

/* ======================================
GROUPED
====================================== */

router.get(
  "/grouped",
  authMiddleware,
  requireAnyPermission([
    "RESULTS_VIEW",
    "REPORTS_VIEW"
  ]),
  async (req:any,res)=>{

  try{

    const user = req.user

    const page =
      parseInt(req.query.page as string) || 1

    const limit =
      parseInt(req.query.limit as string) || 20

    const search =
      ((req.query.search as string) || "")
      .toLowerCase()

    const company =
      ((req.query.company as string) || "")
      .toLowerCase()

    let where:any = {}

    if(user.role === "COMPANY_ADMIN"){

      where = {
        participant:{
          companyId:user.companyId
        }
      }

    }

    const results =
      await prisma.evaluationResult.findMany({

      where,

      include:{
        participant:{
          include:{ company:true }
        },
        evaluation:true
      },

      orderBy:{
        createdAt:"desc"
      }

    })

    const map = new Map()

    for(const r of results){

      const key =
        `${r.participantId}-${r.evaluationId}`

      if(!map.has(key)){
        map.set(key, r)
      }

    }

    const filtered =
      Array.from(map.values())

    const grouped:any = {}

    filtered.forEach((r:any)=>{

      const pid = r.participantId

      if(!grouped[pid]){

        grouped[pid] = {

          participantId: pid,

          name:
            `${r.participant?.nombre || ""} ${r.participant?.apellido || ""}`,

          company:
            r.participant?.company?.name ||
            "Sin empresa",

          evaluations: []

        }

      }

      const data =
        JSON.parse(r.resultJson || "{}")

      grouped[pid].evaluations.push({

        id:r.id,

        type:r.evaluation?.type,

        name:r.evaluation?.name,

        score:data.score || 0,

        pdf:
          `${process.env.BASE_URL}/api/reports/${r.id}/pdf`

      })

    })

    let list = Object.values(grouped)

    list = list.filter((g:any)=>{

      const name =
        (g.name || "").toLowerCase()

      const comp =
        (g.company || "").toLowerCase()

      if(
        search &&
        !name.includes(search)
      ){
        return false
      }

      if(
        user.role !== "COMPANY_ADMIN" &&
        company &&
        !comp.includes(company)
      ){
        return false
      }

      return true

    })

    list = list.map((g:any)=>{

      const scores =
        g.evaluations.map(
          (e:any)=>e.score
        )

      const finalScore =
        scores.length
          ? Math.round(
              scores.reduce(
                (a:number,b:number)=>a+b,
                0
              ) / scores.length
            )
          : 0

      return{

        ...g,

        finalScore,

        finalPdf:
          `${process.env.BASE_URL}/api/final/${g.participantId}/pdf`

      }

    })

    list.sort(
      (a:any,b:any)=>
        a.finalScore - b.finalScore
    )

    const start =
      (page-1)*limit

    const end =
      start + limit

    return res.json(
      list.slice(start,end)
    )

  }catch(e){

    console.error(
      "GROUPED ERROR:",
      e
    )

    res.status(500).json({
      error:"Error agrupando resultados"
    })

  }

})

/* ======================================
DELETE
====================================== */

router.delete(
  "/:id",
  authMiddleware,
  requirePermission("RESULTS_DELETE"),
  async (req:any,res)=>{

  try{

    await prisma.evaluationResult.delete({

      where:{
        id:req.params.id
      }

    })

    res.json({
      ok:true
    })

  }catch(e){

    console.error(
      "DELETE ERROR:",
      e
    )

    res.status(500).json({
      error:"Error eliminando"
    })

  }

})

export default router