"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReportPDF = generateReportPDF;
const chromium_1 = __importDefault(require("@sparticuz/chromium"));
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const reportRenderer_1 = require("./reportRenderer");
async function generateReportPDF(report) {
    const reportsDir = path_1.default.join(process.cwd(), "reports");
    if (!fs_1.default.existsSync(reportsDir)) {
        fs_1.default.mkdirSync(reportsDir);
    }
    const filePath = path_1.default.join(reportsDir, `Informe_ECOS_${Date.now()}.pdf`);
    const html = await (0, reportRenderer_1.renderReportHTML)(report);
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
    await page.pdf({
        path: filePath,
        format: "Letter",
        printBackground: true,
        timeout: 0,
        margin: {
            top: "25mm",
            bottom: "25mm",
            left: "20mm",
            right: "20mm"
        }
    });
    await browser.close();
    return filePath;
}
