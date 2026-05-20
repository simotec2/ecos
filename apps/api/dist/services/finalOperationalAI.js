"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFinalOperationalAI = generateFinalOperationalAI;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
function getLevel(score) {
    if (score >= 80)
        return "ALTO";
    if (score >= 60)
        return "ADECUADO";
    if (score >= 40)
        return "EN DESARROLLO";
    return "CRITICO";
}
function buildPrompt(input) {
    return `

Eres un especialista senior en:

- seguridad minera
- psicología preventiva
- continuidad operacional
- comportamiento humano en minería
- gestión preventiva operacional

Tu función es generar un análisis ejecutivo
premium para un informe final integrado.

IMPORTANTE:

- Responde SOLO JSON válido
- NO agregues markdown
- NO agregues texto fuera del JSON
- Usa lenguaje operacional minero
- NO repitas competencias textualmente
- NO repitas scores
- NO inventes patologías
- Debe sonar como consultora minera premium

PERFIL:
${input.profile}

RESULTADO:
${input.traffic?.result}

SCORE:
${input.score}

COMPETENCIAS:

${(input.competencies || []).map((c) => `
- ${c.name}: ${c.score}% (${getLevel(c.score)})
`).join("\n")}

EVALUACIONES:

${(input.evaluations || []).map((e) => `
${e.type}: ${e.score}%
`).join("\n")}

RESPONDE EXACTAMENTE ESTE JSON:

{
  "executiveSummary":"",
  "operationalImpact":"",
  "exposureFactors":[
    "",
    ""
  ],
  "developmentPlan":[
    "",
    ""
  ],
  "recommendedCourses":[
    "",
    ""
  ],
  "supervisorAdvice":"",
  "finalConclusion":""
}

`.trim();
}
async function generateFinalOperationalAI(input) {
    try {
        const prompt = buildPrompt(input);
        const response = await openai.chat.completions.create({
            model: "gpt-5",
            temperature: 0.5,
            messages: [
                {
                    role: "system",
                    content: `
Eres consultor senior experto
en seguridad minera y análisis
conductual operacional.
`
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });
        const raw = response.choices[0]?.message?.content || "";
        const clean = raw
            .replace(/```json/gi, "")
            .replace(/```/gi, "")
            .trim();
        const parsed = JSON.parse(clean);
        return {
            executiveSummary: parsed.executiveSummary || "",
            operationalImpact: parsed.operationalImpact || "",
            exposureFactors: Array.isArray(parsed.exposureFactors)
                ? parsed.exposureFactors
                : [],
            developmentPlan: Array.isArray(parsed.developmentPlan)
                ? parsed.developmentPlan
                : [],
            recommendedCourses: Array.isArray(parsed.recommendedCourses)
                ? parsed.recommendedCourses
                : [],
            supervisorAdvice: parsed.supervisorAdvice || "",
            finalConclusion: parsed.finalConclusion || ""
        };
    }
    catch (err) {
        console.error("================================");
        console.error("ERROR FINAL AI");
        console.error("================================");
        console.error(err);
        if (err instanceof Error) {
            console.error("MESSAGE:");
            console.error(err.message);
            console.error("STACK:");
            console.error(err.stack);
        }
        return {
            executiveSummary: "No fue posible generar análisis.",
            operationalImpact: "Sin información disponible.",
            exposureFactors: [
                "Sin información disponible."
            ],
            developmentPlan: [
                "Seguimiento preventivo."
            ],
            recommendedCourses: [
                "Seguridad minera operacional."
            ],
            supervisorAdvice: "Realizar acompañamiento preventivo.",
            finalConclusion: "Resultado generado parcialmente."
        };
    }
}
