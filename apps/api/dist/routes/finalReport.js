"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chromium_1 = __importDefault(require("@sparticuz/chromium"));
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const generateOperationalFinalReport_1 = require("../services/generateOperationalFinalReport");
const renderOperationalFinalReport_1 = require("../services/renderOperationalFinalReport");
const radarGenerator_1 = require("../services/radarGenerator");
const router = (0, express_1.Router)();
/* ======================================
PDF FINAL PREMIUM
====================================== */
router.get("/:participantId/pdf", async (req, res) => {
    try {
        const { participantId } = req.params;
        /* ======================================
        DATA
        ====================================== */
        const report = await (0, generateOperationalFinalReport_1.generateOperationalFinalReport)(participantId);
        /* ======================================
        RADAR
        ====================================== */
        let radarHTML = "";
        if (report.competencies &&
            report.competencies.length) {
            const radar = await (0, radarGenerator_1.generateRadarImage)(report.competencies);
            radarHTML = `
        <img
          src="${radar}"
          style="
            width:520px;
            display:block;
            margin:auto;
          "
        />
      `;
        }
        report.radar = radarHTML;
        /* ======================================
        HTML
        ====================================== */
        const html = await (0, renderOperationalFinalReport_1.renderOperationalFinalReport)(report);
        /* ======================================
        CHROMIUM
        ====================================== */
        const executablePath = await chromium_1.default.executablePath();
        if (!executablePath) {
            throw new Error("Chromium no disponible");
        }
        const browser = await puppeteer_core_1.default.launch({
            args: chromium_1.default.args,
            executablePath,
            headless: true
        });
        const page = await browser.newPage();
        await page.setContent(html, {
            waitUntil: "networkidle0"
        });
        const pdf = await page.pdf({
            format: "letter",
            printBackground: true,
            margin: {
                top: "20px",
                bottom: "20px",
                left: "20px",
                right: "20px"
            }
        });
        await browser.close();
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline; filename=informe_final_ecos.pdf"
        });
        res.send(pdf);
    }
    catch (e) {
        console.error("❌ ERROR FINAL REPORT:", e);
        res.status(500).json({
            error: "Error generando informe final",
            detail: e.message
        });
    }
});
/* ======================================
COMPATIBILIDAD LEGACY
====================================== */
router.get("/:participantId/operational-pdf", async (req, res) => {
    try {
        const { participantId } = req.params;
        const report = await (0, generateOperationalFinalReport_1.generateOperationalFinalReport)(participantId);
        let radarHTML = "";
        if (report.competencies &&
            report.competencies.length) {
            const radar = await (0, radarGenerator_1.generateRadarImage)(report.competencies);
            radarHTML = `
        <img
          src="${radar}"
          style="
            width:520px;
            display:block;
            margin:auto;
          "
        />
      `;
        }
        report.radar = radarHTML;
        const html = await (0, renderOperationalFinalReport_1.renderOperationalFinalReport)(report);
        const executablePath = await chromium_1.default.executablePath();
        if (!executablePath) {
            throw new Error("Chromium no disponible");
        }
        const browser = await puppeteer_core_1.default.launch({
            args: chromium_1.default.args,
            executablePath,
            headless: true
        });
        const page = await browser.newPage();
        await page.setContent(html, {
            waitUntil: "networkidle0"
        });
        const pdf = await page.pdf({
            format: "letter",
            printBackground: true,
            margin: {
                top: "20px",
                bottom: "20px",
                left: "20px",
                right: "20px"
            }
        });
        await browser.close();
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline; filename=informe_operacional_ecos.pdf"
        });
        res.send(pdf);
    }
    catch (e) {
        console.error("❌ ERROR INFORME OPERACIONAL:", e);
        res.status(500).json({
            error: "Error generando informe operacional",
            detail: e.message
        });
    }
});
exports.default = router;
