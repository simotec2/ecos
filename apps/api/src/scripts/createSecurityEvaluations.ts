import prisma from "../db"

async function main(){

  console.log("Creando evaluaciones de seguridad")

  await prisma.evaluation.create({
    data:{
      code:"SEG_OPER_PUERTO",
      name:"Seguridad Operador Puerto",
      type:"SECURITY"
    }
  })

  await prisma.evaluation.create({
    data:{
      code:"SEG_SUP_PUERTO",
      name:"Seguridad Supervisor Puerto",
      type:"SECURITY"
    }
  })

  await prisma.evaluation.create({
    data:{
      code:"SEG_OPER_MIN",
      name:"Seguridad Operador Minería",
      type:"SECURITY"
    }
  })

  await prisma.evaluation.create({
    data:{
      code:"SEG_SUP_MIN",
      name:"Seguridad Supervisor Minería",
      type:"SECURITY"
    }
  })

  console.log("Evaluaciones creadas")

}

main()
.then(()=>process.exit())
.catch(e=>{
  console.error(e)
  process.exit(1)
})