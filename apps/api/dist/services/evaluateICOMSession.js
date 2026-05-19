"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePETSSession = evaluatePETSSession;
const db_1 = __importDefault(require("../db"));
const aiEngine_1 = require("./aiEngine");
/* ======================================
PETS ENGINE COMPLETO
====================================== */
async function evaluatePETSSession(sessionId) {
    /* =========================
    TRAER RESPUESTAS + PREGUNTAS
    ========================= */
    const answers = await db_1.default.evaluationAnswer.findMany({
        where: { sessionId },
        include: {
            question: true
        }
    });
    if (!answers.length) {
        throw new Error("No answers found");
    }
    /* =========================
    TRAER SESIÓN
    ========================= */
    const session = await db_1.default.evaluationSession.findUnique({
        where: { id: sessionId }
    });
    if (!session) {
        throw new Error("Session not found");
    }
    /* =========================
    AGRUPAR POR COMPETENCIA
    ========================= */
    const competencyMap = {};
    for (const ans of answers) {
        const question = ans.question;
        const competency = question?.competency || "General";
        const keywords = question?.keywordsJson
            ? JSON.parse(question.keywordsJson)
            : [];
        const result = await (0, aiEngine_1.evaluateCompetencyAI)(question?.text || "", ans.answer || "", keywords);
        if (!competencyMap[competency]) {
            competencyMap[competency] = [];
        }
        competencyMap[competency].push(result.score);
    }
    /* =========================
    CALCULAR COMPETENCIAS
    ========================= */
    const competencies = Object.keys(competencyMap).map(name => {
        const scores = competencyMap[name];
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return {
            name,
            score: Math.round(avg)
        };
    });
    /* =========================
    SCORE GLOBAL
    ========================= */
    const score = Math.round(competencies.reduce((a, c) => a + c.score, 0) / competencies.length);
    /* =========================
    IA (ANÁLISIS REAL)
    ========================= */
    const aiText = await (0, aiEngine_1.generateAIReport)({
        type: "PETS",
        score,
        competencies,
        answers: answers.map(a => ({
            question: a.question?.text || "",
            answer: a.answer || ""
        }))
    });
    /* =========================
    LIMPIAR RESULTADO PREVIO
    ========================= */
    await db_1.default.evaluationResult.deleteMany({
        where: { sessionId }
    });
    /* =========================
    GUARDAR RESULTADO
    ========================= */
    return await db_1.default.evaluationResult.create({
        data: {
            sessionId,
            evaluationId: session.evaluationId,
            participantId: session.participantId,
            score,
            resultJson: JSON.stringify({
                score,
                competencies,
                analysis: aiText,
                answersCount: answers.length
            })
        }
    });
}
