"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderFinalReportHTML = renderFinalReportHTML;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const radarGenerator_1 = require("./radarGenerator");
/* ======================================
MAPA NOMBRES
====================================== */
const evaluationLabels = {
    PETS: "Evaluación Conductual",
    ICOM: "Perfil Psicolaboral",
    SECURITY: "Evaluación de Seguridad Operacional"
};
async function renderFinalReportHTML(data) {
    const templatePath = path_1.default.join(__dirname, "..", "templates", "finalReportTemplate.html");
    let html = fs_1.default.readFileSync(templatePath, "utf-8");
    const participant = data.participant || {};
    const competencies = data.competencies || [];
    /* LOGO */
    const logoPath = path_1.default.join(__dirname, "..", "..", "assets", "logos", "ecos.png");
    const logoBase64 = fs_1.default.readFileSync(logoPath).toString("base64");
    const logo = `<img src="data:image/png;base64,${logoBase64}" style="height:50px;" />`;
    /* RADAR */
    let radarHTML = "";
    if (competencies.length > 0) {
        const radar = await (0, radarGenerator_1.generateRadarImage)(competencies);
        radarHTML = `<img src="${radar}" style="width:350px;margin:auto;display:block;" />`;
    }
    /* EVALUACIONES */
    const evaluationsHTML = (data.evaluations || []).map((e) => `
    <div style="margin-bottom:8px;">
      ${evaluationLabels[e.type] || e.type}: <b>${Math.round(e.score)}%</b>
    </div>
  `).join("");
    /* COLOR */
    function getColor(c) {
        if (c === "VERDE")
            return "#16a34a";
        if (c === "AMARILLO")
            return "#f59e0b";
        return "#dc2626";
    }
    html = html
        .replace(/{{logo}}/g, logo)
        .replace(/{{participant}}/g, `${participant.nombre} ${participant.apellido}`)
        .replace(/{{company}}/g, participant.company?.name || "")
        .replace(/{{score}}/g, data.score)
        .replace(/{{color}}/g, getColor(data.traffic.color))
        .replace(/{{result}}/g, data.traffic.result)
        .replace(/{{evaluations}}/g, evaluationsHTML)
        .replace(/{{radar}}/g, radarHTML)
        .replace(/{{analysis}}/g, `
  <div style="line-height:1.6; font-size:14px;">
    ${(data.analysis || "")
        .replace(/Metodología[\s\S]*?Recomendaciones/gi, "")
        .replace(/Introducción[\s\S]*?Conclusiones/gi, "")
        .replace(/empresa/gi, "participante")}
  </div>
`);
    return html;
}
