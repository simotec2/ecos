import prisma from "../db"

async function main(){

const questions = await prisma.evaluationQuestion.findMany({
where:{
type:"MCQ"
}
})

for(const q of questions){

if(!q.optionsJson) continue

const options = JSON.parse(q.optionsJson)

if(options.length === 3){

options.push("Opción no definida")

await prisma.evaluationQuestion.update({

where:{ id:q.id },

data:{
optionsJson: JSON.stringify(options)
}

})

}

}

console.log("Preguntas de seguridad corregidas")

}

main()
.then(()=>process.exit())
.catch(e=>{
console.error(e)
process.exit(1)
})