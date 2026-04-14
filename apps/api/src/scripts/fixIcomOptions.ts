import prisma from "../db"

async function main(){

const likert = [
"Nunca",
"Casi nunca",
"A veces",
"Frecuentemente",
"Siempre"
]

const questions = await prisma.evaluationQuestion.findMany({
where:{
type:"LIKERT"
}
})

for(const q of questions){

await prisma.evaluationQuestion.update({

where:{id:q.id},

data:{
optionsJson: JSON.stringify(likert)
}

})

}

console.log("ICOM opciones corregidas")

}

main()