"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEvaluationReport = generateEvaluationReport;
const db_1 = __importDefault(require("../db"));
const aiEngine_1 = require("./aiEngine");
/* ======================================
LIKERT
====================================== */
function mapLikert(value) {
    if (!value)
        return 0;
    const v = value.toLowerCase().trim();
    if (v.includes("nunca"))
        return 0;
    if (v.includes("casi nunca"))
        return 25;
    if (v.includes("a veces"))
        return 50;
    if (v.includes("casi siempre"))
        return 75;
    if (v.includes("siempre"))
        return 100;
    return 0;
}
/* ======================================
SEMÁFORO
====================================== */
function calculateTrafficLight(score) {
    if (score >= 85) {
        return { color: "VERDE", result: "RECOMENDABLE" };
    }
    if (score >= 55) {
        return { color: "AMARILLO", result: "RECOMENDABLE CON OBSERVACIONES" };
    }
    return { color: "ROJO", result: "NO RECOMENDABLE" };
}
/* ======================================
SECURITY SCORE
====================================== */
function calculateSecurityScore(answers) {
    let correct = 0;
    let total = 0;
    for (const a of answers) {
        const q = a.question;
        if (!q || q.type !== "MCQ")
            continue;
        total++;
        const user = (a.answer || "").toLowerCase().trim();
        const correctAnswer = (q.correctAnswer || "").toLowerCase().trim();
        if (user === correctAnswer) {
            correct++;
        }
    }
    if (total === 0)
        return 0;
    return Math.round((correct / total) * 100);
}
/* ======================================
MAIN
====================================== */
async function generateEvaluationReport(sessionId) {
    const session = await db_1.default.evaluationSession.findUnique({
        where: { id: sessionId },
        include: {
            evaluation: true,
            participant: {
                include: { company: true }
            },
            answers: { include: { question: true } }
        }
    });
    if (!session)
        throw new Error("Session not found");
    const answers = session.answers || [];
    const participant = session.participant;
    const company = participant?.company;
    let score = 0;
    /* ======================================
       SCORE
    ====================================== */
    if (session.evaluation.type === "ICOM") {
        const values = answers.map(a => mapLikert(a.answer || ""));
        score = values.length
            ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
            : 0;
    }
    else if (session.evaluation.type === "SECURITY") {
        score = calculateSecurityScore(answers);
    }
    else if (session.evaluation.type === "PETS") {
        let total = 0;
        let count = 0;
        for (const a of answers) {
            const r = await (0, aiEngine_1.evaluateCompetencyAI)(a.question.text, a.answer || "", Array.isArray(a.question.keywordsJson)
                ? a.question.keywordsJson
                : []);
            total += Number(r.score || 0);
            count++;
        }
        score = count ? Math.round(total / count) : 0;
    }
    const traffic = calculateTrafficLight(score);
    /* ======================================
       IA PROFESIONAL (BIEN HECHA)
    ====================================== */
    let aiText = "";
    try {
        if (session.evaluation.type === "SECURITY") {
            const total = answers.length;
            const correct = answers.filter(a => {
                const user = (a.answer || "").toLowerCase().trim();
                const correctAnswer = (a.question?.correctAnswer || "").toLowerCase().trim();
                return user === correctAnswer;
            }).length;
            const incorrect = total - correct;
            const performanceLevel = score >= 85 ? "alto"
                : score >= 55 ? "medio"
                    : "bajo";
            aiText = await (0, aiEngine_1.generateAIReport)({
                prompt: `
Eres un psicólogo laboral senior experto en seguridad operacional en minería.

Evalúa al trabajador con base en su desempeño real.

DATOS:
- Nivel: ${performanceLevel}
- Correctas: ${correct}
- Incorrectas: ${incorrect}
- Total: ${total}
- Perfil: ${participant?.perfil || "No especificado"}

Genera un informe técnico con:

ANÁLISIS GENERAL:
Describe su conducta segura y criterio operacional.

BRECHAS:
Explica qué indican los errores (${incorrect}).

RIESGOS:
Qué accidentes podrían ocurrir.

JUICIO:
Apto / Apto con observaciones / No recomendable.

RECOMENDACIONES:
Acciones concretas (capacitación, supervisión, etc.)

REGLAS:
- Nada genérico
- Nada repetido
- Redacción técnica
`
            });
        }
        else if (session.evaluation.type === "ICOM") {
            aiText = await (0, aiEngine_1.generateAIReport)({
                prompt: `
Eres psicólogo organizacional senior.

Resultado: ${traffic.result}

Genera análisis profesional con:
- conducta
- brechas
- riesgos
- desarrollo
`
            });
        }
        else {
            aiText = await (0, aiEngine_1.generateAIReport)({
                score,
                traffic,
                type: session.evaluation.type
            });
        }
    }
    catch (e) {
        aiText = "No fue posible generar análisis automático.";
    }
    /* ======================================
       INFORME FINAL
    ====================================== */
    const reportText = `
INFORME ECOS

Empresa: ${company?.name || "N/A"}
Participante: ${participant?.nombre} ${participant?.apellido}
Perfil: ${participant?.perfil || "N/A"}

Evaluación: ${session.evaluation.name}

Resultado: ${traffic.result}
Puntaje: ${score}%

----------------------------------------

${aiText}

----------------------------------------
`;
    /* ======================================
       GUARDAR
    ====================================== */
    const result = await db_1.default.evaluationResult.upsert({
        where: { sessionId: session.id },
        update: {
            score,
            resultJson: JSON.stringify({
                score,
                traffic,
                aiText,
                reportText
            })
        },
        create: {
            sessionId: session.id,
            evaluationId: session.evaluationId,
            participantId: session.participantId,
            score,
            resultJson: JSON.stringify({
                score,
                traffic,
                aiText,
                reportText
            })
        }
    });
    return result;
}
