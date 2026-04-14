import prisma from "../db"
import xlsx from "xlsx"
import path from "path"

async function createEvaluations(){

console.log("Creando evaluaciones...")

const pets = await prisma.evaluation.upsert({
where:{ code:"PETS" },
update:{},
create:{
code:"PETS",
name:"Evaluación Conductual PETS",
type:"PETS"
}
})

const icom = await prisma.evaluation.upsert({
where:{ code:"ICOM" },
update:{},
create:{
code:"ICOM",
name:"Evaluación ICOM",
type:"ICOM"
}
})

const security = await prisma.evaluation.upsert({
where:{ code:"SEC_OPE_PUERTO" },
update:{},
create:{
code:"SEC_OPE_PUERTO",
name:"Seguridad Operador Puerto",
type:"SECURITY"
}
})

return { pets, icom, security }

}

async function cleanQuestions(){

console.log("Limpiando preguntas antiguas...")

await prisma.evaluationQuestion.deleteMany({})

}

async function importPsychQuestions(evaluationId:string){

console.log("Importando preguntas psicológicas...")

const filePath = path.join(process.cwd(),"psych_questions.xlsx")

const workbook = xlsx.readFile(filePath)

const sheet = workbook.Sheets[workbook.SheetNames[0]]

const rows:any[] = xlsx.utils.sheet_to_json(sheet)

for(const row of rows){

await prisma.evaluationQuestion.create({

data:{
evaluationId,
text:String(row.text || row.question || ""),
type:"OPEN",
keywordsJson:JSON.stringify(
String(row.keywords || "")
.split(",")
.map((k:string)=>k.trim())
)
}

})

}

}

async function importSecurityQuestions(evaluationId:string){

console.log("Importando preguntas seguridad...")

const filePath = path.join(process.cwd(),"security_questions.xlsx")

const workbook = xlsx.readFile(filePath)

const sheet = workbook.Sheets[workbook.SheetNames[0]]

const rows:any[] = xlsx.utils.sheet_to_json(sheet)

for(const row of rows){

await prisma.evaluationQuestion.create({

data:{
evaluationId,
text:String(row.question || ""),
type:"MCQ",
optionsJson:JSON.stringify([
row.option1,
row.option2,
row.option3,
row.option4
]),
correctAnswer:String(row.correct || "")
}

})

}

}

async function main(){

console.log("RECUPERANDO SISTEMA ECOS")

await cleanQuestions()

const { pets, security } = await createEvaluations()

await importPsychQuestions(pets.id)

await importSecurityQuestions(security.id)

console.log("SISTEMA RECUPERADO")

}

main()
.catch(console.error)
.finally(()=>process.exit())