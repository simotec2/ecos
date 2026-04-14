import prisma from "../db"
import * as XLSX from "xlsx"
import path from "path"

async function main(){

  const filePath = path.join(process.cwd(), "psyc_questions.xlsx")

  console.log("📂 Leyendo Excel:", filePath)

  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  const data:any[] = XLSX.utils.sheet_to_json(sheet)

  const pets = await prisma.evaluation.findFirst({ where:{ type:"PETS" } })
  const icom = await prisma.evaluation.findFirst({ where:{ type:"ICOM" } })

  if(!pets || !icom){
    console.log("❌ No existen evaluaciones PETS o ICOM")
    return
  }

  for(const row of data){

    const isPETS = row.type === "PETS"

    const evaluationId = isPETS ? pets.id : icom.id

    /*
    =========================
    NORMALIZAR KEYWORDS
    =========================
    */
    let keywords:any = []

    if(row.keywords){
      if(typeof row.keywords === "string"){
        keywords = row.keywords.split(",").map((k:string)=>k.trim())
      }
    }

    /*
    =========================
    CREAR PREGUNTA
    =========================
    */
    await prisma.evaluationQuestion.create({
      data:{
        evaluationId,
        text: row.text || row.pregunta,

        type: isPETS ? "OPEN" : "LIKERT",

        optionsJson: isPETS
          ? null
          : JSON.stringify([
              "Nunca",
              "Casi nunca",
              "A veces",
              "Casi siempre",
              "Siempre"
            ]),

        correctAnswer: null,

        competency: row.competency || row.dimension || "General",

        keywordsJson: isPETS
          ? JSON.stringify(keywords)
          : null
      }
    })

  }

  console.log("✅ Preguntas cargadas desde Excel")

}

main()
  .catch(e=>console.error(e))
  .finally(()=>process.exit(0))