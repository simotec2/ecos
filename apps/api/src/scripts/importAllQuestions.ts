import prisma from "../db"
import * as XLSX from "xlsx"
import path from "path"

// =========================
// RUTAS
// =========================

const psychFile = path.join(process.cwd(), "psych_questions.xlsx")
const securityFile = path.join(process.cwd(), "security_questions.xlsx")

// =========================
// LEER EXCEL
// =========================

function loadSheet(filePath: string) {
  const wb = XLSX.readFile(filePath)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json<any>(sheet)
}

// =========================
// MAIN
// =========================

async function run(){

  console.log("🧹 limpiando preguntas...")

  await prisma.question.deleteMany()
  await prisma.evaluation.deleteMany()

  console.log("✅ limpio")

  // =========================
  // CREAR EVALUACIONES BASE
  // =========================

  const pets = await prisma.evaluation.create({
    data:{ name:"PETS", type:"PETS", code:"PETS" }
  })

  const icom = await prisma.evaluation.create({
    data:{ name:"ICOM", type:"ICOM", code:"ICOM" }
  })

  // =========================
  // CREAR 4 EVALUACIONES SEGURIDAD
  // =========================

  const secSupMin = await prisma.evaluation.create({
    data:{ name:"SEGURIDAD SUPERVISOR MINERO", type:"SECURITY", code:"SEC_SUP_MIN" }
  })

  const secSupPue = await prisma.evaluation.create({
    data:{ name:"SEGURIDAD SUPERVISOR PUERTO", type:"SECURITY", code:"SEC_SUP_PUE" }
  })

  const secOpMin = await prisma.evaluation.create({
    data:{ name:"SEGURIDAD OPERADOR MINERO", type:"SECURITY", code:"SEC_OP_MIN" }
  })

  const secOpPue = await prisma.evaluation.create({
    data:{ name:"SEGURIDAD OPERADOR PUERTO", type:"SECURITY", code:"SEC_OP_PUE" }
  })

  // =========================
  // CARGAR PSYCH (PETS + ICOM)
  // =========================

  const psychRows = loadSheet(psychFile)

  let petsCount = 0
  let icomCount = 0

  for(const row of psychRows){

    const text = row.pregunta
    if(!text) continue

    const type = String(row.tipo || "").toUpperCase().trim()

    if(type === "PETS"){
      await prisma.question.create({
        data:{
          text,
          type:"OPEN",
          evaluationId: pets.id
        }
      })
      petsCount++
    }

    if(type === "ICOM"){
      await prisma.question.create({
        data:{
          text,
          type:"LIKERT",
          options: JSON.stringify(["1","2","3","4","5"]),
          evaluationId: icom.id
        }
      })
      icomCount++
    }
  }

  console.log("PETS:", petsCount)
  console.log("ICOM:", icomCount)

  // =========================
  // CARGAR SEGURIDAD (4 TIPOS)
  // =========================

  const secRows = loadSheet(securityFile)

  let count = {
    supMin:0,
    supPue:0,
    opMin:0,
    opPue:0
  }

  for(const row of secRows){

    const text = row.pregunta || row.text
    if(!text) continue

    const options = [
      row.a,
      row.b,
      row.c,
      row.d
    ].filter(Boolean)

    // =========================
    // IDENTIFICAR TIPO
    // =========================

    const tipo = String(
      row.tipo ||
      row.categoria ||
      row.area ||
      ""
    ).toUpperCase()

    let evaluationId:any = null

    if(tipo.includes("SUPERVISOR") && tipo.includes("MIN")){
      evaluationId = secSupMin.id
      count.supMin++
    }
    else if(tipo.includes("SUPERVISOR") && tipo.includes("PUE")){
      evaluationId = secSupPue.id
      count.supPue++
    }
    else if(tipo.includes("OPERADOR") && tipo.includes("MIN")){
      evaluationId = secOpMin.id
      count.opMin++
    }
    else if(tipo.includes("OPERADOR") && tipo.includes("PUE")){
      evaluationId = secOpPue.id
      count.opPue++
    }
    else{
      console.log("⚠️ tipo no reconocido:", row)
      continue
    }

    // =========================
    // RESPUESTA CORRECTA
    // =========================

    const map:any = { A:0, B:1, C:2, D:3 }

    let raw =
      row.correcta ||
      row.correct ||
      row.respuesta ||
      row.answer ||
      ""

    raw = String(raw).toUpperCase().trim()

    let correctAnswer = ""

    if(map[raw] !== undefined){
      correctAnswer = options[map[raw]]
    }
    else if(/[ABCD]/.test(raw)){
      const letters = raw.match(/[ABCD]/g)
      if(letters){
        correctAnswer = letters
          .map((l:string)=> options[map[l]])
          .filter(Boolean)
          .join(" | ")
      }
    }
    else if(raw.length > 3){
      correctAnswer = raw
    }

    if(!correctAnswer){
      console.log("⚠️ sin respuesta detectada:", row)
    }

    await prisma.question.create({
      data:{
        text,
        type:"MCQ",
        options: JSON.stringify(options),
        correctAnswer,
        evaluationId
      }
    })
  }

  // =========================
  // RESULTADO FINAL
  // =========================

  console.log("SEG SUP MIN:", count.supMin)
  console.log("SEG SUP PUE:", count.supPue)
  console.log("SEG OP MIN:", count.opMin)
  console.log("SEG OP PUE:", count.opPue)

  console.log("🎉 IMPORTACIÓN COMPLETA")
}

// =========================
// EJECUCIÓN
// =========================

run()
.then(()=>process.exit(0))
.catch(e=>{
  console.error("❌ ERROR:", e)
  process.exit(1)
})