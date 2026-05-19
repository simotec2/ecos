"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderOperationalFinalReport = renderOperationalFinalReport;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getColor(color) {
    if (color === "VERDE") {
        return "#16a34a";
    }
    if (color === "AMARILLO") {
        return "#d97706";
    }
    return "#dc2626";
}
function generateDynamicVeredict(color, participantName) {
    const greenTexts = [
        `${participantName} presenta competencias alineadas con ambientes operacionales de alta exigencia.`,
        `La evaluación integrada evidencia un adecuado potencial preventivo y operacional.`
    ];
    const yellowTexts = [
        `${participantName} presenta competencias compatibles con el cargo evaluado, recomendándose seguimiento operacional inicial.`,
        `La evaluación evidencia oportunidades de mejora específicas que requieren acompañamiento preventivo.`
    ];
    const redTexts = [
        `${participantName} presenta brechas relevantes que podrían afectar el desempeño operacional seguro.`,
        `Los resultados obtenidos reflejan factores de exposición operacional que requieren intervención preventiva.`
    ];
    function randomText(items) {
        return items[Math.floor(Math.random() * items.length)];
    }
    if (color === "VERDE") {
        return randomText(greenTexts);
    }
    if (color === "AMARILLO") {
        return randomText(yellowTexts);
    }
    return randomText(redTexts);
}
async function renderOperationalFinalReport(data) {
    const templatePath = path_1.default.join(__dirname, "..", "templates", "finalOperationalReportTemplate.html");
    let html = fs_1.default.readFileSync(templatePath, "utf-8");
    /* ======================================
    LOGO
    ====================================== */
    const logoPath = path_1.default.join(__dirname, "..", "..", "assets", "logos", "ecos.png");
    const logoBase64 = fs_1.default
        .readFileSync(logoPath)
        .toString("base64");
    const logo = `
    <img
      src="data:image/png;base64,${logoBase64}"
      style="width:180px;"
    />
  `;
    /* ======================================
    PARTICIPANTE
    ====================================== */
    const participantName = `
${data.participant?.nombre || ""}
${data.participant?.apellido || ""}
  `.trim();
    /* ======================================
    COLOR
    ====================================== */
    const resultColor = getColor(data.traffic?.color || "ROJO");
    const veredictText = generateDynamicVeredict(data.traffic?.color || "ROJO", participantName);
    /* ======================================
    REEMPLAZOS
    ====================================== */
    html = html
        .replace(/{{logo}}/gi, logo)
        .replace(/{{participant}}/gi, participantName)
        .replace(/{{profile}}/gi, data.participant?.perfil ||
        data.participant?.profile ||
        "")
        .replace(/{{company}}/gi, data.participant?.company?.name || "")
        .replace(/{{date}}/gi, data.date || "")
        .replace(/{{result}}/gi, data.traffic?.result || "")
        .replace(/__COLOR__/gi, resultColor)
        .replace(/{{veredictText}}/gi, veredictText)
        .replace(/{{evaluationsCards}}/gi, data.evaluationsCards || "")
        .replace(/{{radar}}/gi, data.radar || "")
        .replace(/{{strengths}}/gi, data.strengths || "")
        .replace(/{{gaps}}/gi, data.gaps || "")
        .replace(/{{developmentPlan}}/gi, data.developmentPlan || "")
        .replace(/{{supervisorSummary}}/gi, data.supervisorSummary || "")
        .replace(/{{employerSupport}}/gi, data.employerSupport || "")
        .replace(/{{operationalExposureAnalysis}}/gi, data.operationalExposureAnalysis || "");
    /* ======================================
    LIMPIEZA FINAL
    ====================================== */
    html = html.replace(/{{.*?}}/g, "");
    return html;
}
