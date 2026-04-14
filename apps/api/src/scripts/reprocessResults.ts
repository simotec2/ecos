import prisma from "../db"
import { generateEvaluationReport } from "../services/reportEngine"

async function reprocess(){

  console.log("🚀 REPROCESANDO RESULTADOS...")

  const sessions = await prisma.evaluationSession.findMany()

  console.log(`Total sesiones: ${sessions.length}`)

  let ok = 0
  let fail = 0

  for(const s of sessions){

    try{

      await generateEvaluationReport(s.id)

      console.log(`✔ OK: ${s.id}`)
      ok++

    }catch(err){

      console.log(`❌ ERROR: ${s.id}`)
      fail++

    }

  }

  console.log("=================================")
  console.log(`✔ Procesadas: ${ok}`)
  console.log(`❌ Errores: ${fail}`)
  console.log("=================================")

}

reprocess()