"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderFinalReportHTML = renderFinalReportHTML;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const safeText_1 = require("../utils/safeText");
function getColor(color) {
    if (color === "VERDE") {
        return "#16a34a";
    }
    if (color === "AMARILLO") {
        return "#f59e0b";
    }
    return "#dc2626";
}
async function renderFinalReportHTML(data) {
    /* ======================================
    TEMPLATE
    ====================================== */
    const templatePath = path_1.default.join(__dirname, "..", "templates", "finalReportTemplate.html");
    let html = fs_1.default.readFileSync(templatePath, "utf-8");
    /* ======================================
    PARTICIPANTE
    ====================================== */
    const participant = data.participant || {};
    const participantProfile = (0, safeText_1.safeText)(participant.perfil ||
        participant.profile ||
        "");
    /* ======================================
    FECHA REAL
    ====================================== */
    const reportDate = (0, safeText_1.safeText)(data.date || "");
    console.log("FINAL REPORT:", {
        participant,
        participantProfile,
        reportDate
    });
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
      style="height:55px;"
    />
  `;
    /* ======================================
    ANALISIS
    ====================================== */
    const analysis = (0, safeText_1.safeText)(data.analysis).replace(/\n/g, "<br/>");
    /* ======================================
    RADAR
    ====================================== */
    const radar = (0, safeText_1.safeText)(data.radar || "");
    /* ======================================
    REEMPLAZOS
    ====================================== */
    html = html
        .replace(/{{logo}}/gi, logo)
        .replace(/{{participant}}/gi, `
      ${(0, safeText_1.safeText)(participant.nombre)}
      ${(0, safeText_1.safeText)(participant.apellido)}
      `)
        .replace(/{{profile}}/gi, participantProfile)
        .replace(/{{company}}/gi, (0, safeText_1.safeText)(participant.company?.name || ""))
        .replace(/{{date}}/gi, reportDate)
        .replace(/{{score}}/gi, (0, safeText_1.safeText)(data.score || 0))
        .replace(/{{result}}/gi, (0, safeText_1.safeText)(data.traffic?.result || ""))
        .replace(/{{color}}/gi, getColor(data.traffic?.color))
        .replace(/{{analysis}}/gi, analysis)
        .replace(/{{radar}}/gi, radar);
    /* ======================================
    LIMPIEZA FINAL
    ====================================== */
    html = html.replace(/{{.*?}}/g, "");
    return html;
}
