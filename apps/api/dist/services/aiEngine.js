"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateCompetencyAI = evaluateCompetencyAI;
exports.generateAIReport = generateAIReport;
exports.generateRecommendations = generateRecommendations;
exports.calculateRisk = calculateRisk;
exports.enrichCompetencies = enrichCompetencies;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
/* ======================================
UTILS
====================================== */
function getLevel(score) {
    if (score >= 80)
        return "ALTO";
    if (score >= 60)
        return "ADECUADO";
    if (score >= 40)
        return "EN DESARROLLO";
    return "CRITICO";
}
function getTraffic(score) {
    if (score >= 85)
        return { color: "VERDE", result: "RECOMENDABLE" };
    if (score >= 55)
        return { color: "AMARILLO", result: "RECOMENDABLE CON OBSERVACIONES" };
    return { color: "ROJO", result: "NO RECOMENDABLE" };
}
/* ======================================
PETS SCORING
====================================== */
async function evaluateCompetencyAI(question, answer, keywords) {
    if (!answer || answer.trim().length === 0) {
        return { competent: false, score: 20 };
    }
    const text = answer.toLowerCase();
    let matches = 0;
    for (const k of (keywords || [])) {
        if (text.includes(String(k).toLowerCase())) {
            matches++;
        }
    }
    let keywordScore = 50;
    if (keywords && keywords.length > 0) {
        keywordScore = Math.max(Math.round((matches / keywords.length) * 100), 20);
    }
    const length = answer.length;
    let depthScore = 40;
    if (length > 200)
        depthScore = 100;
    else if (length > 120)
        depthScore = 80;
    else if (length > 60)
        depthScore = 60;
    else if (length > 30)
        depthScore = 40;
    else
        depthScore = 20;
    const finalScore = Math.round((keywordScore * 0.6) + (depthScore * 0.4));
    return {
        competent: finalScore >= 60,
        score: finalScore || 30
    };
}
/* ======================================
PROMPTS INDIVIDUALES
====================================== */
function buildGenericPrompt(input) {
    return `
Eres un psicólogo laboral experto.

Analizas UN solo participante.

PUNTAJE: ${input.score}

COMPETENCIAS:
${(input.competencies || []).map((c) => `
- ${c.name}: ${c.score}% (${getLevel(c.score)})
`).join("\n")}

FORMATO:

Análisis general:
Fortalezas:
- ...
Brechas:
- ...
Recomendaciones:
- ...
Conclusión:
`;
}
/* ======================================
PROMPT FINAL
====================================== */
function buildFinalPrompt(input) {
    if (!input.evaluations || input.evaluations.length === 0) {
        return "No hay información suficiente.";
    }
    return `
Eres un psicólogo laboral senior experto en evaluación de personas y seguridad operacional.

IMPORTANTE:
- Analizas SOLO un participante
- NO inventas información
- NO suavizas resultados negativos
- SI hay una evaluación en ROJO → el diagnóstico es CRÍTICO

RESULTADOS:

${input.evaluations.map((e) => `
${e.type}
Puntaje: ${e.score}%

Análisis:
${e.analysis || "Sin análisis"}
`).join("\n")}

RESULTADO FINAL: ${input.traffic?.result}

FORMATO:

Diagnóstico general:
Fortalezas:
- ...
Brechas críticas:
- ...
Impacto en desempeño:
Recomendaciones:
- ...
Conclusión:
`;
}
/* ======================================
LLAMADA IA (BLINDADA)
====================================== */
async function callAI(prompt) {
    try {
        const res = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.2,
            messages: [
                {
                    role: "system",
                    content: "Eres un psicólogo laboral experto."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });
        const text = res.choices[0]?.message?.content || "";
        // 🔥 VALIDACIÓN CRÍTICA
        if (!text || text.trim().length < 30) {
            console.warn("⚠️ IA devolvió texto vacío o insuficiente");
            return "No fue posible generar el análisis automático.";
        }
        return text;
    }
    catch (err) {
        console.error("❌ ERROR IA:", err);
        return "No fue posible generar el análisis automático.";
    }
}
/* ======================================
ENGINE
====================================== */
async function generateAIReport(input) {
    let prompt = "";
    if (input.type === "FINAL") {
        prompt = buildFinalPrompt(input);
    }
    else {
        prompt = buildGenericPrompt(input);
    }
    return await callAI(prompt);
}
/* ======================================
EXTRAS
====================================== */
function generateRecommendations(competencies) {
    return (competencies || []).map(c => {
        if (c.score >= 80) {
            return { name: c.name, text: "Mantener como fortaleza." };
        }
        if (c.score >= 60) {
            return { name: c.name, text: "Mejorar consistencia." };
        }
        if (c.score >= 40) {
            return { name: c.name, text: "Desarrollar con capacitación." };
        }
        return { name: c.name, text: "Intervención prioritaria." };
    });
}
function calculateRisk(score) {
    if (score >= 85)
        return { level: "BAJO", text: "Riesgo bajo." };
    if (score >= 55)
        return { level: "MEDIO", text: "Riesgo moderado." };
    return { level: "ALTO", text: "Riesgo alto." };
}
function enrichCompetencies(competencies) {
    return (competencies || []).map(c => ({
        ...c,
        levelLabel: getLevel(c.score),
        traffic: getTraffic(c.score)
    }));
}
