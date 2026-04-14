import prisma from "../db"
import bcrypt from "bcrypt"

async function main(){

  const password = "admin123"

  const hash = await bcrypt.hash(password,10)

  const user = await prisma.user.upsert({

    where:{ rut:"admin" },

    update:{
      name:"Administrador",
      password:hash,
      role:"SUPERADMIN"
    },

    create:{
      rut:"admin",
      name:"Administrador",
      password:hash,
      role:"SUPERADMIN"
    }

  })

  console.log("SUPERADMIN CREADO")

  console.log("usuario: admin")
  console.log("password: admin123")

}

main()
.then(()=>process.exit())
.catch(e=>{
  console.error(e)
  process.exit(1)
})