import prisma from "../db"

async function main() {

  const evaluations = await prisma.evaluation.findMany()

  if (evaluations.length === 0) {
    console.log("No hay evaluaciones creadas")
    return
  }

  for (const evaluation of evaluations) {

    console.log("Evaluación:", evaluation.name)

    const questions = await prisma.Question.findMany({
      where: {
        evaluationId: evaluation.id
      }
    })

    console.log("Preguntas encontradas:", questions.length)

  }

}

main()
.then(() => {
  console.log("Script ejecutado correctamente")
  process.exit(0)
})
.catch(e => {
  console.error(e)
  process.exit(1)
})