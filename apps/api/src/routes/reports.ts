import { Router } from "express"
import prisma from "../db"

import chromium from "@sparticuz/chromium"
import puppeteer from "puppeteer-core"

import { renderReportHTML } from "../services/reportRenderer"
import { renderFinalReportHTML } from "../services/finalReportRenderer"

import { generateFinalReport } from "../services/finalReportEngine"

const router = Router()

/*
=====================================
NORMALIZADOR
=====================================
*/
function normalizeResult(result:any){

  let raw:any = {}

  try{

    raw = typeof result.resultJson === "string"
      ? JSON.parse(result.resultJson)
      : result.resultJson || {}

  }catch{

    raw = {}

  }

  return {

    ...raw,

    createdAt: result.createdAt,

    participant: result.participant,

    evaluationName:
      result.evaluation?.name || "Evaluación",

    type:
      result.evaluation?.type || "",

    competencies:
      raw?.competencies ||
      raw?.competenciasDetalle ||
      [],

    analysis:
      raw?.analysis ||
      raw?.aiText ||
      "",

    traffic:
      raw?.traffic || {
        color:"GRIS",
        result:"SIN RESULTADO"
      },

    score:
      raw?.score ||
      result.score ||
      0,

    evaluations:
      raw?.evaluations || []

  }

}

/*
=====================================
PDF ENGINE
=====================================
*/
async function generatePDF(html:string){

  const executablePath =
    await chromium.executablePath()

  if(!executablePath){

    throw new Error(
      "Chromium no disponible en este entorno"
    )

  }

  const browser = await puppeteer.launch({

    args: chromium.args,

    executablePath,

    headless: true

  })

  const page = await browser.newPage()

  await page.setContent(html,{
    waitUntil:"networkidle0"
  })

  const pdf = await page.pdf({

    format:"letter",

    printBackground:true,

    margin:{
      top:"20px",
      bottom:"20px",
      left:"25px",
      right:"25px"
    }

  })

  await browser.close()

  return pdf

}

/*
=====================================
PDF INDIVIDUAL
=====================================
*/
router.get("/:id/pdf", async (req,res)=>{

  try{

    const { id } = req.params

    const result:any =
      await prisma.evaluationResult.findUnique({

        where:{ id },

        include:{
          participant:{
            include:{ company:true }
          },
          evaluation:true
        }

      })

    if(!result){

      return res.status(404).json({
        error:"Resultado no encontrado"
      })

    }

    const data = normalizeResult(result)

    const html =
      await renderReportHTML(data)

    const pdf =
      await generatePDF(html)

    res.setHeader(
      "Content-Type",
      "application/pdf"
    )

    res.setHeader(
      "Content-Disposition",
      "inline; filename=reporte.pdf"
    )

    return res.send(pdf)

  }catch(error:any){

    console.error(
      "❌ ERROR PDF INDIVIDUAL:",
      error
    )

    return res.status(500).json({

      error:"Error generando PDF",

      detail:error.message

    })

  }

})

/*
=====================================
PDF FINAL
=====================================
*/
router.get("/:id/final/pdf", async (req,res)=>{

  try{

    const { id } = req.params

    /* =========================
    RESULTADO BASE
    ========================= */

    const baseResult:any =
      await prisma.evaluationResult.findUnique({

        where:{ id }

      })

    if(!baseResult){

      return res.status(404).json({
        error:"Resultado no encontrado"
      })

    }

    /* =========================
    ENGINE REAL
    ========================= */

    const data =
      await generateFinalReport(
        baseResult.participantId
      )
      data.date = baseResult.createdAt
    /* =========================
    HTML
    ========================= */

    const html =
      await renderFinalReportHTML(data)

    /* =========================
    PDF
    ========================= */

    const pdf =
      await generatePDF(html)

    res.setHeader(
      "Content-Type",
      "application/pdf"
    )

    res.setHeader(
      "Content-Disposition",
      "inline; filename=informe_final.pdf"
    )

    return res.send(pdf)

  }catch(error:any){

    console.error(
      "❌ ERROR PDF FINAL:",
      error
    )

    return res.status(500).json({

      error:"Error generando PDF FINAL",

      detail:error.message,

      stack:error.stack

    })

  }

})

export default router