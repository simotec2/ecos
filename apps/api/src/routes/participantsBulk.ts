import { Router } from "express"
import prisma from "../db"
import { randomUUID } from "crypto"
import * as XLSX from "xlsx"
import { sendEvaluationEmail } from "../utils/email"

const router = Router()

router.post("/", async (req,res)=>{

  try{

    const { file } = req.body

    if(!file){
      return res.status(400).json({ error:"Archivo requerido" })
    }

    const buffer = Buffer.from(file, "base64")
    const workbook = XLSX.read(buffer, { type:"buffer" })

    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data:any[] = XLSX.utils.sheet_to_json(sheet)

    const allEvaluations = await prisma.evaluation.findMany()

    const results:any[] = []

    for(const row of data){

      const nombre = row.nombre
      const apellido = row.apellido
      const rut = row.rut
      const email = row.email
      const empresa = row.empresa
      const perfil = row.perfil

      if(!nombre || !apellido || !rut) continue

      const token = randomUUID()

      // empresa
      let companyId = null

      if(empresa){
        const company = await prisma.company.findFirst({
          where:{ name: empresa }
        })
        if(company) companyId = company.id
      }

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

      // 🔥 evaluar columnas dinámicas
      for(const ev of allEvaluations){

        const value = row[ev.name]

        if(value === 1 || value === "1" || value === "X" || value === "x"){

          await prisma.assignment.create({
            data:{
              participantId: participant.id,
              evaluationId: ev.id
            }
          })

        }

      }

      // email
      if(email){
        try{
          await sendEvaluationEmail(
            email,
            `${nombre} ${apellido}`,
            token
          )
        }catch(e){
          console.error("Error email:", email)
        }
      }

      results.push(participant)

    }

    res.json({
      success:true,
      total: results.length
    })

  }catch(error){

    console.error(error)

    res.status(500).json({
      error:"Error carga masiva"
    })

  }

})

export default router