"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReportPDF = generateReportPDF;
const puppeteer_1 = __importDefault(require("puppeteer"));
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
    const browser = await puppeteer_1.default.launch({
        headless: true,
        args: ["--no-sandbox"]
    });
    const page = await browser.newPage();
    await page.setContent(html);
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
