"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const chromium_1 = __importDefault(require("@sparticuz/chromium"));
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const reportRenderer_1 = require("../services/reportRenderer");
const generateOperationalFinalReport_1 = require("../services/generateOperationalFinalReport");
const renderOperationalFinalReport_1 = require("../services/renderOperationalFinalReport");
const router = (0, express_1.Router)();
/*
=====================================
NORMALIZADOR
=====================================
*/
function normalizeResult(result) {
    let raw = {};
    try {
        raw =
            typeof result.resultJson === "string"
                ? JSON.parse(result.resultJson)
                : result.resultJson || {};
    }
    catch {
        raw = {};
    }
    return {
        ...raw,
        createdAt: result.createdAt,
        participant: result.participant,
        evaluationName: result.evaluation?.name || "Evaluación",
        type: result.evaluation?.type || "",
        competencies: raw?.competencies ||
            raw?.competenciasDetalle ||
            [],
        analysis: raw?.analysis ||
            raw?.aiText ||
            "",
        traffic: raw?.traffic || {
            color: "GRIS",
            result: "SIN RESULTADO"
        },
        score: raw?.score ||
            result.score ||
            0,
        evaluations: raw?.evaluations || []
    };
}
/*
=====================================
PDF ENGINE
=====================================
*/
async function generatePDF(html) {
    const executablePath = await chromium_1.default.executablePath();
    if (!executablePath) {
        throw new Error("Chromium no disponible en este entorno");
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
            left: "25px",
            right: "25px"
        }
    });
    await browser.close();
    return pdf;
}
/*
=====================================
PDF INDIVIDUAL
=====================================
*/
router.get("/:id/pdf", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db_1.default.evaluationResult.findUnique({
            where: { id },
            include: {
                participant: {
                    include: {
                        company: true
                    }
                },
                evaluation: true
            }
        });
        if (!result) {
            return res.status(404).json({
                error: "Resultado no encontrado"
            });
        }
        const data = normalizeResult(result);
        const html = await (0, reportRenderer_1.renderReportHTML)(data);
        const pdf = await generatePDF(html);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=reporte.pdf");
        return res.send(pdf);
    }
    catch (error) {
        console.error("❌ ERROR PDF INDIVIDUAL:", error);
        return res.status(500).json({
            error: "Error generando PDF",
            detail: error.message
        });
    }
});
/*
=====================================
PDF FINAL
=====================================
*/
router.get("/:id/final/pdf", async (req, res) => {
    try {
        const { id } = req.params;
        /* =========================
        RESULTADO BASE
        ========================= */
        const baseResult = await db_1.default.evaluationResult.findUnique({
            where: { id }
        });
        if (!baseResult) {
            return res.status(404).json({
                error: "Resultado no encontrado"
            });
        }
        /* =========================
        DATA FINAL
        ========================= */
        const report = await (0, generateOperationalFinalReport_1.generateOperationalFinalReport)(baseResult.participantId);
        report.date =
            new Date(baseResult.createdAt)
                .toLocaleDateString("es-CL");
        /* =========================
        HTML
        ========================= */
        const html = await (0, renderOperationalFinalReport_1.renderOperationalFinalReport)(report);
        /* =========================
        PDF
        ========================= */
        const pdf = await generatePDF(html);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=informe_final.pdf");
        return res.send(pdf);
    }
    catch (error) {
        console.error("❌ ERROR PDF FINAL:", error);
        return res.status(500).json({
            error: "Error generando PDF FINAL",
            detail: error.message,
            stack: error.stack
        });
    }
});
exports.default = router;
