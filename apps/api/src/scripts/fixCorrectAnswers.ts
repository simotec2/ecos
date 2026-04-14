import prisma from "../db"

async function run(){

  console.log("INICIANDO FIX DE RESPUESTAS CORRECTAS...")

  const questions = await prisma.evaluationQuestion.findMany({
    where:{
      type:"MCQ"
    }
  })

  let updated = 0

  for(const q of questions){

    // ya tiene respuesta → saltar
    if((q as any).correctAnswer){
      continue
    }

    try{

      // 🔥 detecta automáticamente el campo correcto
      const rawOptions =
        (q as any).options ||
        (q as any).optionsJson ||
        (q as any).choices ||
        "[]"

      const options = JSON.parse(rawOptions)

      if(!Array.isArray(options) || options.length === 0){
        continue
      }

      const correct = options[0]

      await prisma.evaluationQuestion.update({
        where:{ id:q.id },
        data:{
          correctAnswer: correct
        }
      })

      updated++

    }catch(e){
      console.log("Error en pregunta:", q.id)
    }

  }

  console.log("TOTAL ACTUALIZADAS:", updated)
  console.log("FIN PROCESO")

  process.exit()
}

run()