import { Router } from "express"
import * as XLSX from "xlsx"
import prisma from "../db"

const router = Router()

router.get("/", async (req,res)=>{

  const evaluations = await prisma.evaluation.findMany()

  const baseColumns = [
    "nombre",
    "apellido",
    "rut",
    "email",
    "empresa",
    "perfil"
  ]

  const visibleMap:any = {
    PETS: "Evaluacion Conductual",
    ICOM: "Evaluacion Psicolaboral"
  }

  const dynamicColumns = evaluations.map(ev => {
    return visibleMap[ev.type] || ev.name
  })

  const columns = [...baseColumns, ...dynamicColumns]

  const worksheet = XLSX.utils.json_to_sheet([])

  XLSX.utils.sheet_add_aoa(worksheet, [columns])

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla")

  const buffer = XLSX.write(workbook, {
    type:"buffer",
    bookType:"xlsx"
  })

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=plantilla_ecos.xlsx"
  )

  res.send(buffer)

})

export default router