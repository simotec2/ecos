import prisma from "../db"

import { generateEvaluationReport }
  from "../services/reportEngine"

import { evaluatePETSSession }
  from "../services/evaluatePETSSession"

async function main() {

  console.log("====================================")
  console.log("REPROCESO GLOBAL ECOS")
  console.log("====================================")

  /* ======================================
  BUSCAR TODAS LAS SESIONES
  ====================================== */

  const sessions =
    await prisma.evaluationSession.findMany({

      include:{
        evaluation:true
      }

    })

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

      console.log(
        `Tipo: ${session.evaluation?.type}`
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
      PETS → NUEVO MOTOR
      ====================================== */

      if(session.evaluation?.type === "PETS"){

        const result =
          await evaluatePETSSession(
            session.id
          )

        console.log(
          `PETS reprocesado: ${result.score}%`
        )

      }

      /* ======================================
      RESTO → MOTOR NORMAL
      ====================================== */

      else {

        const result =
          await generateEvaluationReport(
            session.id
          )

        console.log(
          `Nuevo score: ${result.score}%`
        )

      }

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