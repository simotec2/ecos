import prisma from "../db"
import XLSX from "xlsx"

async function getEvaluation(name:string){

  const ev = await prisma.evaluation.findFirst({
    where:{ name }
  })

  if(!ev) throw new Error("Evaluación no encontrada: "+name)

  return ev

}

async function main(){

  console.log("Leyendo Excel de preguntas")

  const workbook = XLSX.readFile("security_questions.xlsx")

  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const rows:any[] = XLSX.utils.sheet_to_json(sheet)

  const segOperPuerto = await getEvaluation("Seguridad Operador Puerto")
  const segSupPuerto = await getEvaluation("Seguridad Supervisor Puerto")
  const segOperMin = await getEvaluation("Seguridad Operador Minería")
  const segSupMin = await getEvaluation("Seguridad Supervisor Minería")

  for(const row of rows){

    let evaluationId = null

    if(row.tipo === "OPERADOR_PUERTO") evaluationId = segOperPuerto.id
    if(row.tipo === "SUPERVISOR_PUERTO") evaluationId = segSupPuerto.id
    if(row.tipo === "OPERADOR_MINERIA") evaluationId = segOperMin.id
    if(row.tipo === "SUPERVISOR_MINERIA") evaluationId = segSupMin.id

    if(!evaluationId) continue

    await prisma.evaluationQuestion.create({

  data:{
    evaluationId,
    text: row.pregunta,
    type:"MCQ",

    optionsJson: JSON.stringify(
      [row.a,row.b,row.c,row.d].filter(o=>o && String(o).trim()!=="")
    ),

    correctAnswer: row.correcta
  }

})

  }

  console.log("Banco de seguridad cargado")

}

main()
.then(()=>process.exit())
.catch(e=>{
  console.error(e)
  process.exit(1)
})