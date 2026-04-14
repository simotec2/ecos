import prisma from "../db"
import * as XLSX from "xlsx"
import path from "path"

async function main(){

  const filePath = path.join(process.cwd(), "ICOM_questions.xlsx")

  console.log("📂 Importando ICOM desde:", filePath)

  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const data:any[] = XLSX.utils.sheet_to_json(sheet)

  const evaluation = await prisma.evaluation.findFirst({
    where:{ type:"ICOM" }
  })

  if(!evaluation){
    console.log("❌ No existe evaluación ICOM")
    return
  }

  for(const row of data){

    if(!row.Preguntas) continue

    await prisma.evaluationQuestion.create({
      data:{
        evaluationId: evaluation.id,
        text: row.Preguntas,
        type: "LIKERT",

        optionsJson: JSON.stringify([
          "Nunca",
          "Casi nunca",
          "A veces",
          "Casi siempre",
          "Siempre"
        ]),

        competency: row["Dimensiones/Criterios"] || row.Competencia || "General"
      }
    })

  }

  console.log("✅ ICOM cargado")

}

main()
  .catch(console.error)
  .finally(()=>process.exit(0))