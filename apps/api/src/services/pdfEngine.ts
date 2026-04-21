import chromium from "@sparticuz/chromium"
import puppeteer from "puppeteer-core"
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

  const executablePath = await chromium.executablePath()

  if(!executablePath){
    throw new Error("Chromium no disponible")
  }

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: true
  })

  const page = await browser.newPage()

  await page.setContent(html, {
    waitUntil: "networkidle0"
  })

  await page.pdf({
    path: filePath,
    format: "Letter",
    printBackground: true,
    timeout: 0,
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