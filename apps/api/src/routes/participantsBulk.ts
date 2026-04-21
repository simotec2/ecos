import { Router } from "express"
import prisma from "../db"
import { randomUUID } from "crypto"
import * as XLSX from "xlsx"
import { sendEvaluationEmail } from "../utils/email"

const router = Router()

/* ======================================
UTILS
====================================== */
function normalize(text:any){
  return String(text || "")
    .toLowerCase()
    .trim()
}

function isSelected(value:any){
  return value === 1 || value === "1" || value === "X" || value === "x"
}

/* ======================================
MAPA VISUAL → SISTEMA
====================================== */
const evaluationMap:any = {

  // visibles
  "evaluacion conductual": "PETS",
  "evaluacion psicolaboral": "ICOM",

  // seguridad
  "seguridad supervisor puerto": "Seguridad Supervisor Puerto",
  "seguridad operador puerto": "Seguridad Operador Puerto",
  "seguridad supervisor minería": "Seguridad Supervisor Minería",
  "seguridad operador minería": "Seguridad Operador Minería"
}

router.post("/", async (req,res)=>{

  try{

    const { file } = req.body

    if(!file){
      return res.status(400).json({ error:"Archivo requerido" })
    }

    const buffer = Buffer.from(file, "base64")
    const workbook = XLSX.read(buffer, { type:"buffer" })

    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows:any[] = XLSX.utils.sheet_to_json(sheet)

    const evaluationsDB = await prisma.evaluation.findMany()

    const results:any[] = []

    for(const row of rows){

      const nombre = row.nombre
      const apellido = row.apellido
      const rut = row.rut
      const email = row.email
      const empresa = row.empresa
      const perfil = row.perfil

      if(!nombre || !apellido || !rut) continue

      const token = randomUUID()

      /* ======================
      EMPRESA
      ====================== */
      let companyId = null

      if(empresa){
        const company = await prisma.company.findFirst({
          where:{ name: empresa }
        })
        if(company) companyId = company.id
      }

      /* ======================
      PARTICIPANTE
      ====================== */
      const participant = await prisma.participant.create({
        data:{
          nombre,
          apellido,
          rut,
          email,
          accessToken: token,
          companyId,
          perfil: perfil || null
        }
      })

      /* ======================
      ASIGNAR EVALUACIONES
      ====================== */
      for(const column in row){

        const normalizedColumn = normalize(column)

        const mappedValue = evaluationMap[normalizedColumn]

        if(!mappedValue) continue

        const value = row[column]

        if(isSelected(value)){

          const evaluation = evaluationsDB.find(ev =>
            ev.type === mappedValue || ev.name === mappedValue
          )

          if(evaluation){
            await prisma.assignment.create({
              data:{
                participantId: participant.id,
                evaluationId: evaluation.id,
                status: "PENDING"
              }
            })
          }

        }

      }

      /* ======================
      EMAIL
      ====================== */
      if(email){
        try{
          await sendEvaluationEmail(
            email,
            `${nombre} ${apellido}`,
            token
          )
        }catch(e){
          console.error("Error enviando email:", email)
        }
      }

      results.push(participant)

    }

    res.json({
      success:true,
      total: results.length
    })

  }catch(error:any){

    console.error(error)

    res.status(500).json({
      error:"Error carga masiva",
      detail: error.message
    })

  }

})

export default router