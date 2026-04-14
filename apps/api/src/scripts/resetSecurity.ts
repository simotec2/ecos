import prisma from "../db"

async function main(){

  console.log("Buscando evaluaciones de seguridad...")

  const securityEvaluations = await prisma.evaluation.findMany({
    where:{
      type:"SECURITY"
    }
  })

  for(const ev of securityEvaluations){

    console.log("Eliminando preguntas de:",ev.name)

    await prisma.evaluationQuestion.deleteMany({
      where:{
        evaluationId:ev.id
      }
    })

  }

  console.log("Preguntas eliminadas")

}

main()
.then(()=>process.exit())
.catch(e=>{
  console.error(e)
  process.exit(1)
})