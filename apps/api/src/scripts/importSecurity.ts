import prisma from "../db"
import * as XLSX from "xlsx"
import path from "path"

async function main(){

  const filePath = path.join(process.cwd(), "security_questions.xlsx")

  console.log("📂 Importando SECURITY desde:", filePath)

  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const data:any[] = XLSX.utils.sheet_to_json(sheet)

  /*
  =====================================
  BUSCAR EVALUACIONES (NOMBRES EXACTOS)
  =====================================
  */

  const evalOperadorPuerto = await prisma.evaluation.findFirst({
    where: { name: "SEGURIDAD_OPERADOR_PUERTO" }
  })

  const evalSupervisorPuerto = await prisma.evaluation.findFirst({
    where: { name: "SEGURIDAD_SUPERVISOR_PUERTO" }
  })

  const evalOperadorMineria = await prisma.evaluation.findFirst({
    where: { name: "SEGURIDAD_OPERADOR_MINERIA" }
  })

  const evalSupervisorMineria = await prisma.evaluation.findFirst({
    where: { name: "SEGURIDAD_SUPERVISOR_MINERIA" }
  })

  if(!evalOperadorPuerto || !evalSupervisorPuerto || !evalOperadorMineria || !evalSupervisorMineria){
    console.log("❌ Faltan evaluaciones SECURITY en la BD")
    return
  }

  /*
  =====================================
  MAPEO DIRECTO (EXCEL → DB)
  =====================================
  */

  const map:any = {
    "SEGURIDAD_OPERADOR_PUERTO": evalOperadorPuerto.id,
    "SEGURIDAD_SUPERVISOR_PUERTO": evalSupervisorPuerto.id,
    "SEGURIDAD_OPERADOR_MINERIA": evalOperadorMineria.id,
    "SEGURIDAD_SUPERVISOR_MINERIA": evalSupervisorMineria.id
  }

  let count = 0
  let skipped = 0

  for(const row of data){

    const tipo = (row.tipo || "").toString().trim().toUpperCase()

    const evaluationId = map[tipo]

    if(!evaluationId){
      console.log("⚠️ Tipo no reconocido:", tipo)
      skipped++
      continue
    }

    /*
    =====================================
    NORMALIZAR RESPUESTA CORRECTA
    =====================================
    */
    let correct = null

    if(row.correcta){
      correct = row.correcta.toString().trim().toLowerCase()
    }

    /*
    =====================================
    CREAR PREGUNTA
    =====================================
    */
    await prisma.evaluationQuestion.create({
      data:{
        evaluationId,
        text: row.pregunta,

        type: "MCQ",

        optionsJson: JSON.stringify([
          row.a,
          row.b,
          row.c
        ]),

        correctAnswer: correct
      }
    })

    count++
  }

  console.log("=====================================")
  console.log(`✅ SECURITY cargado: ${count} preguntas`)
  console.log(`⚠️ Omitidas: ${skipped}`)
  console.log("=====================================")

}

main()
  .catch(err=>{
    console.error("❌ ERROR:", err)
  })
  .finally(()=>process.exit(0))