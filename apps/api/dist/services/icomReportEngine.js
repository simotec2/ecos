"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateICOMReport = generateICOMReport;
function generateICOMReport({ score, competencies }) {
    function getLevel(value) {
        if (value > 4.5)
            return "VERDE";
        if (value >= 3.9)
            return "AMARILLO";
        return "ROJO";
    }
    let text = "";
    text += "ANÁLISIS GENERAL\n\n";
    if (score > 4.5) {
        text += "El candidato presenta un desempeño alto en competencias conductuales, evidenciando comportamientos consistentes con entornos operacionales exigentes.\n\n";
    }
    else if (score >= 3.9) {
        text += "El candidato presenta un desempeño adecuado, aunque con áreas de mejora relevantes que podrían impactar su desempeño en contextos exigentes.\n\n";
    }
    else {
        text += "El candidato presenta brechas conductuales importantes que podrían afectar su desempeño y seguridad en el entorno laboral.\n\n";
    }
    text += "ANÁLISIS POR COMPETENCIAS\n\n";
    for (const c of competencies) {
        const level = getLevel(c.score);
        text += `• ${c.name} (${c.score.toFixed(2)}) - ${level}\n`;
        if (level === "VERDE") {
            text += "Muestra conductas consistentes y adecuadas.\n\n";
        }
        if (level === "AMARILLO") {
            text += "Presenta conductas variables que requieren desarrollo.\n\n";
        }
        if (level === "ROJO") {
            text += "Evidencia debilidades significativas en esta competencia.\n\n";
        }
    }
    text += "CONCLUSIÓN\n\n";
    if (score > 4.5) {
        text += "Candidato recomendable para el cargo.\n";
    }
    else if (score >= 3.9) {
        text += "Candidato recomendable con observaciones.\n";
    }
    else {
        text += "Candidato no recomendable.\n";
    }
    return text;
}
