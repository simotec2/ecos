import puppeteer from "puppeteer"
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