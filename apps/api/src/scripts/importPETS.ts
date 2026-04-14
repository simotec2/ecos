import prisma from "../db"
import * as XLSX from "xlsx"
import path from "path"

async function main(){

  const filePath = path.join(process.cwd(), "psyc_questions.xlsx")

  console.log("📂 Importando PETS desde:", filePath)

  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const data:any[] = XLSX.utils.sheet_to_json(sheet)

  const evaluation = await prisma.evaluation.findFirst({
    where:{ type:"PETS" }
  })

  if(!evaluation){
    console.log("❌ No existe evaluación PETS")
    return
  }

  for(const row of data){

    if(row.tipo !== "PETS") continue

    const keywords = row.keywords
      ? row.keywords.split(",").map((k:string)=>k.trim())
      : []

    await prisma.evaluationQuestion.create({
      data:{
        evaluationId: evaluation.id,
        text: row.pregunta,
        type: "OPEN",
        competency: row.competencia || "General",
        keywordsJson: JSON.stringify(keywords)
      }
    })

  }

  console.log("✅ PETS cargado")

}

main()
  .catch(console.error)
  .finally(()=>process.exit(0))