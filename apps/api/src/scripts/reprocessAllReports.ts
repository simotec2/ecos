import prisma from "../db"
import { generateEvaluationReport } from "../services/reportEngine"

async function main() {

  console.log("====================================")
  console.log("REPROCESO GLOBAL ECOS")
  console.log("====================================")

  /* ======================================
  BUSCAR TODAS LAS SESIONES
  ====================================== */

  const sessions =
    await prisma.evaluationSession.findMany()

  console.log(
    `Sesiones encontradas: ${sessions.length}`
  )

  /* ======================================
  REPROCESAR
  ====================================== */

  for(const session of sessions){

    try {

      console.log("------------------------------------")

      console.log(
        `Sesión: ${session.id}`
      )

      /* ======================================
      BORRAR RESULTADOS ANTIGUOS
      ====================================== */

      await prisma.evaluationResult.deleteMany({

        where: {
          sessionId: session.id
        }

      })

      console.log(
        "Resultado anterior eliminado"
      )

      /* ======================================
      REGENERAR
      ====================================== */

      const result =
        await generateEvaluationReport(
          session.id
        )

      console.log(
        `Nuevo score: ${result.score}%`
      )

    } catch(error){

      console.error(
        `ERROR EN SESIÓN ${session.id}`
      )

      console.error(error)

    }

  }

  console.log("====================================")
  console.log("REPROCESO FINALIZADO")
  console.log("====================================")

}

main()

  .then(async () => {

    await prisma.$disconnect()

    process.exit(0)

  })

  .catch(async (error) => {

    console.error(error)

    await prisma.$disconnect()

    process.exit(1)

  })