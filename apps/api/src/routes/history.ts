import { Router } from "express"
import prisma from "../db"

const router = Router()

/*
=====================================
HISTORIAL POR PARTICIPANTE
=====================================
*/
router.get("/:participantId", async (req,res)=>{

  try{

    const participantId = String(req.params.participantId)

    const history = await prisma.evaluationResult.findMany({
      where:{ participantId },
      include:{
        evaluation:true
      },
      orderBy:{
        createdAt:"desc"
      }
    })

    return res.json(history)

  }catch(err){

    console.error("HISTORY ERROR:", err)

    res.status(500).json({
      error:"Error obteniendo historial"
    })

  }

})

export default router