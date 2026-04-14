import prisma from "../db"
import crypto from "crypto"

async function main(){

 const participants = await prisma.participant.findMany({
  where:{
   accessToken:null
  }
 })

 console.log("Participantes sin token:", participants.length)

 for(const p of participants){

  const token = crypto.randomBytes(32).toString("hex")

  await prisma.participant.update({
   where:{ id:p.id },
   data:{ accessToken:token }
  })

 }

 console.log("Tokens generados correctamente")

}

main()
.then(()=>process.exit())
.catch(e=>{
 console.error(e)
 process.exit(1)
})