import { Router } from "express"
import prisma from "../db"

import chromium from "@sparticuz/chromium"
import puppeteer from "puppeteer-core"

import { generateOperationalFinalReport } from "../services/generateOperationalFinalReport"

import { renderOperationalFinalReport } from "../services/renderOperationalFinalReport"

import { generateRadarImage } from "../services/radarGenerator"

const router = Router()

/* ======================================
PDF FINAL PREMIUM
====================================== */
router.get(
  "/:participantId/pdf",
  async (req,res)=>{

  try{

    const { participantId } =
      req.params

    /* ======================================
    DATA
    ====================================== */

    const report =
      await generateOperationalFinalReport(
        participantId
      )

    /* ======================================
    RADAR
    ====================================== */

    let radarHTML = ""

    if(
      report.competencies &&
      report.competencies.length
    ){

      const radar =
        await generateRadarImage(
          report.competencies
        )

      radarHTML = `
        <img
          src="${radar}"
          style="
            width:520px;
            display:block;
            margin:auto;
          "
        />
      `

    }

    report.radar = radarHTML

    /* ======================================
    HTML
    ====================================== */

    const html =
      await renderOperationalFinalReport(
        report
      )

    /* ======================================
    CHROMIUM
    ====================================== */

    const executablePath =
      await chromium.executablePath()

    if(!executablePath){

      throw new Error(
        "Chromium no disponible"
      )

    }

    const browser =
      await puppeteer.launch({

        args:chromium.args,

        executablePath,

        headless:true

      })

    const page =
      await browser.newPage()

    await page.setContent(
      html,
      {
        waitUntil:"networkidle0"
      }
    )

    const pdf =
      await page.pdf({

        format:"letter",

        printBackground:true,

        margin:{
          top:"20px",
          bottom:"20px",
          left:"20px",
          right:"20px"
        }

      })

    await browser.close()

    res.set({

      "Content-Type":"application/pdf",

      "Content-Disposition":
        "inline; filename=informe_final_ecos.pdf"

    })

    res.send(pdf)

  }catch(e:any){

    console.error(
      "❌ ERROR FINAL REPORT:",
      e
    )

    res.status(500).json({

      error:
        "Error generando informe final",

      detail:e.message

    })

  }

})

/* ======================================
COMPATIBILIDAD LEGACY
====================================== */
router.get(
  "/:participantId/operational-pdf",
  async (req,res)=>{

  try{

    const { participantId } =
      req.params

    const report =
      await generateOperationalFinalReport(
        participantId
      )

    let radarHTML = ""

    if(
      report.competencies &&
      report.competencies.length
    ){

      const radar =
        await generateRadarImage(
          report.competencies
        )

      radarHTML = `
        <img
          src="${radar}"
          style="
            width:520px;
            display:block;
            margin:auto;
          "
        />
      `

    }

    report.radar = radarHTML

    const html =
      await renderOperationalFinalReport(
        report
      )

    const executablePath =
      await chromium.executablePath()

    if(!executablePath){

      throw new Error(
        "Chromium no disponible"
      )

    }

    const browser =
      await puppeteer.launch({

        args:chromium.args,

        executablePath,

        headless:true

      })

    const page =
      await browser.newPage()

    await page.setContent(
      html,
      {
        waitUntil:"networkidle0"
      }
    )

    const pdf =
      await page.pdf({

        format:"letter",

        printBackground:true,

        margin:{
          top:"20px",
          bottom:"20px",
          left:"20px",
          right:"20px"
        }

      })

    await browser.close()

    res.set({

      "Content-Type":"application/pdf",

      "Content-Disposition":
        "inline; filename=informe_operacional_ecos.pdf"

    })

    res.send(pdf)

  }catch(e:any){

    console.error(
      "❌ ERROR INFORME OPERACIONAL:",
      e
    )

    res.status(500).json({

      error:
        "Error generando informe operacional",

      detail:e.message

    })

  }

})

export default router