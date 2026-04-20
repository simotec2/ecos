"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFinalPDF = generateFinalPDF;
const puppeteer_1 = __importDefault(require("puppeteer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function generateFinalPDF(html) {
    const reportsDir = path_1.default.join(process.cwd(), "reports");
    if (!fs_1.default.existsSync(reportsDir)) {
        fs_1.default.mkdirSync(reportsDir);
    }
    const filePath = path_1.default.join(reportsDir, `Informe_Final_${Date.now()}.pdf`);
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
        margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    });
    await browser.close();
    return filePath;
}
