import prisma from "../../src/db"
import { generateEvaluationReport } from "../../src/services/reportEngine"

async function main(){

  console.log("🔄 Regenerando informes...")

  const sessions = await prisma.evaluationSession.findMany({
    where:{
      completedAt:{
        not:null
      }
    }
  })

  console.log(`📊 Sesiones encontradas: ${sessions.length}`)

  for(const s of sessions){

    try{

      console.log(`➡️ Procesando sesión: ${s.id}`)

      await generateEvaluationReport(s.id)

    }catch(err){

      console.error(`❌ Error en sesión ${s.id}`, err)

    }

  }

  console.log("✅ Informes regenerados")

}

main().then(()=>{
  process.exit(0)
})