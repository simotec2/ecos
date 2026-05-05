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
    const evaluations = data.evaluations || [];
    const finalTraffic = data.finalTraffic || { color: "GRIS", result: "SIN RESULTADO" };
    /* ======================
    LOGO
    ====================== */
    const logoPath = path_1.default.join(__dirname, "..", "..", "assets", "logos", "ecos.png");
    const logoBase64 = fs_1.default.readFileSync(logoPath).toString("base64");
    const logo = `<img src="data:image/png;base64,${logoBase64}" style="height:50px;" />`;
    /* ======================
    CONSOLIDACIÓN COMPETENCIAS
    ====================== */
    const allCompetencies = evaluations.flatMap((e) => e.competencies || []);
    let radarHTML = "";
    if (allCompetencies.length > 0) {
        const radar = await (0, radarGenerator_1.generateRadarImage)(allCompetencies);
        radarHTML = `<img src="${radar}" style="width:350px;margin:auto;display:block;" />`;
    }
    /* ======================
    EVALUACIONES
    ====================== */
    const evaluationsHTML = evaluations.map((e) => `
    <div style="margin-bottom:8px;">
      ${evaluationLabels[e.type] || e.evaluationName}: 
      <b>${Math.round(e.score || 0)}%</b>
    </div>
  `).join("");
    /* ======================
    SCORE PROMEDIO
    ====================== */
    const avgScore = evaluations.length > 0
        ? Math.round(evaluations.reduce((acc, e) => acc + (e.score || 0), 0) / evaluations.length)
        : 0;
    /* ======================
    SEMÁFORO COLOR
    ====================== */
    function getColor(c) {
        if (c === "VERDE")
            return "#16a34a";
        if (c === "AMARILLO")
            return "#f59e0b";
        return "#dc2626";
    }
    /* ======================
    ANALISIS PROFESIONAL REAL
    ====================== */
    const textos = evaluations.map((e) => (e.analysis || "").toLowerCase());
    function extractKeywords(type) {
        if (type === "fortalezas") {
            return textos.filter(t => t.includes("fortaleza") ||
                t.includes("adecuado") ||
                t.includes("destaca") ||
                t.includes("positivo"));
        }
        if (type === "brechas") {
            return textos.filter(t => t.includes("debilidad") ||
                t.includes("riesgo") ||
                t.includes("deficiente") ||
                t.includes("mejorar") ||
                t.includes("brecha"));
        }
        return [];
    }
    const fortalezas = extractKeywords("fortalezas");
    const brechas = extractKeywords("brechas");
    /* ======================
    TEXTO CONSOLIDADO
    ====================== */
    const analisisFinal = `
  <div style="line-height:1.6; font-size:14px;">

    <h3>1. Síntesis General</h3>
    <p>
      El participante presenta un desempeño global evaluado como <b>${finalTraffic.result}</b>, 
      integrando resultados de evaluaciones conductuales, psicolaborales y de seguridad operacional.
    </p>

    <h3>2. Fortalezas Observadas</h3>
    <p>
      ${fortalezas.length > 0
        ? fortalezas.slice(0, 3).join("<br><br>")
        : "No se identifican fortalezas consistentes a nivel transversal."}
    </p>

    <h3>3. Brechas y Riesgos</h3>
    <p>
      ${brechas.length > 0
        ? brechas.slice(0, 3).join("<br><br>")
        : "No se identifican brechas críticas."}
    </p>

    <h3>4. Recomendación Profesional</h3>
    <p>
      ${finalTraffic.color === "ROJO"
        ? "El perfil presenta brechas relevantes que pueden impactar el desempeño y la seguridad operacional, por lo que no se recomienda su incorporación sin un proceso de intervención o formación previo."
        : finalTraffic.color === "AMARILLO"
            ? "El perfil es funcional, pero requiere acompañamiento y desarrollo en áreas específicas para asegurar un desempeño consistente."
            : "El perfil presenta condiciones adecuadas para el desempeño del rol, sin evidenciar riesgos relevantes."}
    </p>

  </div>
  `;
    /* ======================
    REEMPLAZOS TEMPLATE
    ====================== */
    html = html
        .replace(/{{logo}}/g, logo)
        .replace(/{{participant}}/g, `${participant.nombre || ""} ${participant.apellido || ""}`)
        .replace(/{{company}}/g, participant.company?.name || "")
        .replace(/{{score}}/g, String(avgScore))
        .replace(/{{color}}/g, getColor(finalTraffic.color))
        .replace(/{{result}}/g, finalTraffic.result)
        .replace(/{{evaluations}}/g, evaluationsHTML)
        .replace(/{{radar}}/g, radarHTML)
        .replace(/{{analysis}}/g, analisisFinal);
    return html;
}
