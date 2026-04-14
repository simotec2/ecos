const { PrismaClient } = require("@prisma/client")
const XLSX = require("xlsx")
const path = require("path")

const prisma = new PrismaClient()

/* =========================
HELPERS
========================= */

function normalize(text){
  return String(text || "").toLowerCase()
}

function mapICOMCompetency(text){
  const t = normalize(text)

  if(t.includes("seguridad")) return "Seguridad"
  if(t.includes("equipo")) return "Trabajo en equipo"
  if(t.includes("norma")) return "Cumplimiento de normas"
  if(t.includes("riesgo")) return "Gestión del riesgo"
  if(t.includes("presión") || t.includes("presion")) return "Manejo de presión"

  return "Competencias conductuales"
}

function mapPETSCompetency(text){
  const t = normalize(text)

  if(t.includes("analiza")) return "Análisis"
  if(t.includes("decisión") || t.includes("decision")) return "Toma de decisiones"
  if(t.includes("criterio")) return "Criterio operacional"

  return "Análisis"
}

function mapSECURITYCompetency(text){
  const t = normalize(text)

  if(t.includes("riesgo")) return "Identificación de riesgos"
  if(t.includes("procedimiento")) return "Cumplimiento de procedimientos"
  if(t.includes("seguridad")) return "Seguridad operacional"

  return "Conocimiento técnico"
}

function loadExcel(file){
  const filePath = path.join(__dirname, file)
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet)
}

function groupByTipo(data){
  const groups = {}

  for(const row of data){
    const tipo = String(row.tipo || "").trim()
    if(!tipo) continue

    if(!groups[tipo]){
      groups[tipo] = []
    }

    groups[tipo].push(row)
  }

  return groups
}

/* =========================
MAIN
========================= */

async function main(){

  console.log("🧹 LIMPIANDO BD...")

  await prisma.evaluationAnswer.deleteMany()
  await prisma.evaluationResult.deleteMany()
  await prisma.evaluationSession.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.evaluationQuestion.deleteMany()
  await prisma.evaluation.deleteMany()

  await prisma.user.deleteMany()
  await prisma.company.deleteMany()

  console.log("✅ BD LIMPIA")

  /* =========================
  EMPRESA + USUARIOS
  ========================= */

  const company = await prisma.company.create({
    data:{
      name: "ECOS DEMO",
      razonSocial: "ECOS SPA",
      rut: "76.123.456-7",
      perfil: "Operaciones mineras"
    }
  })

  await prisma.user.create({
    data:{
      name: "Super Admin",
      rut: "11111111-1",
      password: "1234",
      role: "SUPERADMIN"
    }
  })

  await prisma.user.create({
    data:{
      name: "Admin Empresa",
      rut: "22222222-2",
      password: "1234",
      role: "COMPANY_ADMIN",
      companyId: company.id
    }
  })

  console.log("👤 Usuarios creados")

  /* =========================
  ICOM + PETS
  ========================= */

  console.log("🧠 Cargando ICOM y PETS...")

  const psyData = loadExcel("../psyc_questions.xlsx")
  const psyGroups = groupByTipo(psyData)

  const icom = await prisma.evaluation.create({
    data:{
      code:"ICOM",
      name:"Evaluación ICOM",
      type:"ICOM"
    }
  })

  const seenICOM = new Set()
  let icomCount = 0

  for(const row of psyGroups["ICOM"] || []){

    const text = String(row.pregunta || "").trim()
    if(!text) continue

    if(seenICOM.has(text)) continue
    seenICOM.add(text)

    await prisma.evaluationQuestion.create({
      data:{
        text,
        type:"LIKERT",
        competency: row.competency || mapICOMCompetency(text),
        optionsJson: JSON.stringify([
          "Nunca","Casi nunca","A veces","Casi siempre","Siempre"
        ]),
        evaluationId: icom.id
      }
    })

    icomCount++
  }

  console.log(`✅ ICOM únicas: ${icomCount}`)

  const pets = await prisma.evaluation.create({
    data:{
      code:"PETS",
      name:"Evaluación PETS",
      type:"PETS"
    }
  })

  const seenPETS = new Set()
  let petsCount = 0

  for(const row of psyGroups["PETS"] || []){

    const text = String(row.pregunta || "").trim()
    if(!text) continue

    if(seenPETS.has(text)) continue
    seenPETS.add(text)

    await prisma.evaluationQuestion.create({
      data:{
        text,
        type:"OPEN",
        competency: row.competency || mapPETSCompetency(text),
        evaluationId: pets.id
      }
    })

    petsCount++
  }

  console.log(`✅ PETS únicas: ${petsCount}`)

  /* =========================
  SECURITY
  ========================= */

  console.log("🛡️ Cargando SECURITY...")

  const securityData = loadExcel("../security_questions.xlsx")
  const securityGroups = groupByTipo(securityData)

  for(const tipo in securityGroups){

    const evaluation = await prisma.evaluation.create({
      data:{
        code: tipo,
        name: `Seguridad ${tipo}`,
        type:"SECURITY"
      }
    })

    const seenSEC = new Set()
    let secCount = 0

    for(const row of securityGroups[tipo]){

      const text = String(row.pregunta || "").trim()
      if(!text) continue

      if(seenSEC.has(text)) continue
      seenSEC.add(text)

      const options = [
        String(row.a || ""),
        String(row.b || ""),
        String(row.c || ""),
        String(row.d || "")
      ].filter(Boolean)

      await prisma.evaluationQuestion.create({
        data:{
          text,
          type:"MCQ",
          competency: row.competency || mapSECURITYCompetency(text),
          optionsJson: JSON.stringify(options),
          correctAnswer: String(row.correcta || ""),
          evaluationId: evaluation.id
        }
      })

      secCount++
    }

    console.log(`✅ ${tipo} únicas: ${secCount}`)
  }

  console.log("🎉 TODO LISTO (SIN DUPLICADOS)")
}

main()
  .catch(e=>{
    console.error(e)
    process.exit(1)
  })
  .finally(()=>prisma.$disconnect())