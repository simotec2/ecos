import chromium from "@sparticuz/chromium"
import puppeteer from "puppeteer-core"
import path from "path"
import fs from "fs"

export async function generateFinalPDF(html:string){

  const reportsDir = path.join(process.cwd(),"reports")

  if(!fs.existsSync(reportsDir)){
    fs.mkdirSync(reportsDir)
  }

  const filePath = path.join(
    reportsDir,
    `Informe_Final_${Date.now()}.pdf`
  )

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
    path:filePath,
    format:"Letter",
    printBackground:true,
    margin:{
      top:"20mm",
      bottom:"20mm",
      left:"15mm",
      right:"15mm"
    }
  })

  await browser.close()

  return filePath
}