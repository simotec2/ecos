import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function clean(){

  console.log("Borrando resultados...")

  await prisma.evaluationResult.deleteMany()

  console.log("Resultados eliminados")

  await prisma.$disconnect()

}

clean()