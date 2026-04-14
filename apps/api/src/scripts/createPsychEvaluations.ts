import prisma from "../db"

async function run(){

  console.log("Creando evaluaciones psicolaborales...")

  const existing = await prisma.evaluation.findMany()

  const existsICOM = existing.find(e => e.code === "ICOM")
  const existsPETS = existing.find(e => e.code === "PETS")

  if(!existsICOM){
    await prisma.evaluation.create({
      data:{
        code: "ICOM",
        name: "Evaluación ICOM",
        type: "ICOM"
      }
    })
    console.log("✔ ICOM creada")
  } else {
    console.log("⚠ ICOM ya existe")
  }

  if(!existsPETS){
    await prisma.evaluation.create({
      data:{
        code: "PETS",
        name: "Evaluación PETS",
        type: "PETS"
      }
    })
    console.log("✔ PETS creada")
  } else {
    console.log("⚠ PETS ya existe")
  }

  console.log("Proceso terminado")
  process.exit()
}

run()