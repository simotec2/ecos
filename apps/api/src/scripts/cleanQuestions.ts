import prisma from "../db"

async function main(){

  await prisma.evaluationAnswer.deleteMany()
  await prisma.evaluationSession.deleteMany()
  await prisma.evaluationQuestion.deleteMany()

  console.log("Banco de preguntas limpiado")

}

main()
.then(()=>process.exit())
.catch(e=>{
  console.error(e)
  process.exit(1)
})