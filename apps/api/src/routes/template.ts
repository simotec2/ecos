import { Router } from "express"
import fs from "fs"
import path from "path"

const router = Router()

const templatePath = path.join(
  process.cwd(),
  "apps/api/src/templates/reportTemplate.html"
)

/* GET TEMPLATE */
router.get("/", (req,res)=>{
  const html = fs.readFileSync(templatePath,"utf-8")
  res.send(html)
})

/* SAVE TEMPLATE */
router.post("/", (req,res)=>{

  const { html } = req.body

  fs.writeFileSync(templatePath, html)

  res.json({ ok:true })

})

export default router