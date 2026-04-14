import prisma from "../db"
import xlsx from "xlsx"
import path from "path"

function loadExcel(file: string) {

  const filePath = path.join(process.cwd(), file)

  const workbook = xlsx.readFile(filePath)

  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  return xlsx.utils.sheet_to_json<any>(sheet)

}

async function main() {

  console.log("=== INICIO CARGA LIMPIA ===")

  /* =========================
     LIMPIAR BD
  ========================= */

  await prisma.evaluationAnswer.deleteMany()
  await prisma.evaluationSession.deleteMany()
  await prisma.evaluationResult.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.evaluationQuestion.deleteMany()
  await prisma.evaluation.deleteMany()

  console.log("BD limpia")

  /* =========================
     CREAR EVALUACIONES
  ========================= */

  const pets = await prisma.evaluation.create({
    data: {
      code: "PETS",
      name: "PETS",
      type: "PETS"
    }
  })

  const icom = await prisma.evaluation.create({
    data: {
      code: "ICOM",
      name: "ICOM",
      type: "ICOM"
    }
  })

  const security = await prisma.evaluation.create({
    data: {
      code: "SECURITY",
      name: "SEGURIDAD",
      type: "SECURITY"
    }
  })

  /* =========================
     CARGAR EXCEL
  ========================= */

  const data = loadExcel("psych_questions.xlsx")
  const securityData = loadExcel("security_questions.xlsx")

  let petsCount = 0
  let icomCount = 0
  let secCount = 0

  console.log("TOTAL FILAS PSYCH:", data.length)

  /* =========================
     RECORRER TODAS
  ========================= */

  for (const row of data) {

    if (!row.pregunta || !row.tipo) continue

    const tipo = row.tipo.toUpperCase()

    /* ================= PETS ================= */

    if (tipo === "PETS") {

      await prisma.evaluationQuestion.create({
        data: {
          evaluationId: pets.id,
          text: row.pregunta,
          type: "OPEN",
          dimension: row.dimension || null,
          keywordsJson: row.keywords
            ? JSON.stringify(row.keywords.split(","))
            : null
        }
      })

      petsCount++
    }

    /* ================= ICOM ================= */

    if (tipo === "ICOM") {

      await prisma.evaluationQuestion.create({
        data: {
          evaluationId: icom.id,
          text: row.pregunta,
          type: "MCQ",
          optionsJson: JSON.stringify([
            row.a,
            row.b,
            row.c,
            row.d
          ]),
          correctAnswer: row.correct
        }
      })

      icomCount++
    }

  }

  /* =========================
     SECURITY
  ========================= */

  console.log("TOTAL SECURITY:", securityData.length)

  for (const row of securityData) {

    if (!row.pregunta) continue

    await prisma.evaluationQuestion.create({
      data: {
        evaluationId: security.id,
        text: row.pregunta,
        type: "MCQ",
        optionsJson: JSON.stringify([
          row.a,
          row.b,
          row.c,
          row.d
        ]),
        correctAnswer: row.correct
      }
    })

    secCount++
  }

  console.log("=== RESULTADO FINAL ===")
  console.log("PETS:", petsCount)
  console.log("ICOM:", icomCount)
  console.log("SECURITY:", secCount)

}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })