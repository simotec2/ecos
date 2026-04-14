import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main(){

  console.log("🚀 Creando datos demo...")

  /*
  =====================================
  SUPERADMIN
  =====================================
  */
  const superadmin = await prisma.user.upsert({
    where:{ rut:"12222412-0" },
    update:{},
    create:{
      name:"Hernan Figueroa Casas",
      rut:"12222412-0",
      password:"123456",
      role:"SUPERADMIN"
    }
  })

  console.log("✅ Superadmin listo")

  /*
  =====================================
  EMPRESA DEMO
  =====================================
  */
  const company = await prisma.company.upsert({
    where:{ rut:"76000000-0" },
    update:{},
    create:{
      name:"Empresa Demo ECOS",
      razonSocial:"Empresa Demo ECOS SPA",
      rut:"76000000-0",
      direccion:"Antofagasta",
      giro:"Servicios Mineros",
      contactoNombre:"Contacto Demo",
      contactoTelefono:"999999999",
      contactoEmail:"demo@ecos.cl"
    }
  })

  console.log("✅ Empresa creada")

  /*
  =====================================
  ADMIN EMPRESA
  =====================================
  */
  const companyAdmin = await prisma.user.upsert({
    where:{ rut:"11111111-1" },
    update:{},
    create:{
      name:"Admin Empresa Demo",
      rut:"11111111-1",
      password:"123456",
      role:"COMPANY_ADMIN",
      companyId: company.id
    }
  })

  console.log("✅ Admin empresa creado")

  /*
  =====================================
  PARTICIPANTE DEMO
  =====================================
  */
  const participant = await prisma.participant.upsert({
    where:{ rut:"99999999-9" },
    update:{},
    create:{
      rut:"99999999-9",
      nombre:"Juan",
      apellido:"Pérez",
      perfil:"Operador Mina",
      email:"juan@demo.cl",
      accessToken:"demo123",
      companyId: company.id
    }
  })

  console.log("✅ Participante creado")

  /*
  =====================================
  ASIGNAR EVALUACIONES (TODAS)
  =====================================
  */
  const evaluations = await prisma.evaluation.findMany()

  for(const evalItem of evaluations){

    await prisma.assignment.upsert({
      where:{
        participantId_evaluationId:{
          participantId: participant.id,
          evaluationId: evalItem.id
        }
      },
      update:{},
      create:{
        participantId: participant.id,
        evaluationId: evalItem.id,
        status:"PENDING"
      }
    })
  }

  console.log("✅ Evaluaciones asignadas")

  console.log("🎯 DEMO LISTA")
}

main()
  .catch(e=>{
    console.error(e)
  })
  .finally(async ()=>{
    await prisma.$disconnect()
  })