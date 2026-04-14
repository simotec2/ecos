import puppeteer from "puppeteer"
import path from "path"
import fs from "fs"
import { renderReportHTML } from "./reportRenderer"

export async function generateReportPDF(report:any){

  const reportsDir = path.join(process.cwd(), "reports")

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir)
  }

  const filePath = path.join(
    reportsDir,
    `Informe_ECOS_${Date.now()}.pdf`
  )

  const html = await renderReportHTML(report)

  const browser = await puppeteer.launch({
    headless:true,
    args:["--no-sandbox"]
  })

  const page = await browser.newPage()

  await page.setContent(html)

  await page.pdf({
    path:filePath,
    format:"Letter",
    printBackground:true,
    timeout:0,
    margin:{
      top:"25mm",
      bottom:"25mm",
      left:"20mm",
      right:"20mm"
    }
  })

  await browser.close()

  return filePath
}