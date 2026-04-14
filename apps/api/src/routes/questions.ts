import { Router } from "express"
import prisma from "../db"

const router = Router()

router.post("/", async (req,res)=>{

  const {
    evaluationId,
    text,
    type,
    optionsJson,
    correctAnswer,
    keywordsJson
  } = req.body

  const question = await prisma.evaluationQuestion.create({
    data:{
      evaluationId,
      text,
      type,
      optionsJson,
      correctAnswer,
      keywordsJson
    }
  })

  res.json(question)

})

export default router