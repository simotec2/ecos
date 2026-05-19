"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateSecurity = evaluateSecurity;
const db_1 = __importDefault(require("../db"));
/*
=====================================
NORMALIZAR TEXTO
=====================================
*/
function normalize(value) {
    return (value || "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}
/*
=====================================
EVALUACIÓN SECURITY (CORREGIDA)
=====================================
*/
async function evaluateSecurity(sessionId) {
    const session = await db_1.default.evaluationSession.findUnique({
        where: { id: sessionId }
    });
    if (!session) {
        throw new Error("Sesión no encontrada");
    }
    const rawAnswers = await db_1.default.evaluationAnswer.findMany({
        where: { sessionId },
        include: {
            question: true
        }
    });
    // eliminar duplicados
    const map = new Map();
    rawAnswers.forEach(a => {
        map.set(a.questionId, a);
    });
    const answers = Array.from(map.values());
    let correct = 0;
    let total = answers.length;
    answers.forEach(a => {
        const rawUser = a.answer || "";
        const rawCorrect = a.question?.correctAnswer || "";
        const user = normalize(rawUser);
        const correctAns = normalize(rawCorrect);
        console.log("🧪 COMPARACIÓN REAL:", {
            rawUser,
            rawCorrect,
            user,
            correctAns
        });
        if (user === correctAns) {
            correct++;
        }
    });
    const score = total > 0 ? (correct / total) * 100 : 0;
    console.log("✅ RESULTADO FINAL:", {
        correct,
        total,
        score
    });
    let result = "NO RECOMENDABLE";
    let color = "ROJO";
    if (score >= 85) {
        result = "RECOMENDABLE";
        color = "VERDE";
    }
    else if (score >= 55) {
        result = "RECOMENDABLE CON OBSERVACIONES";
        color = "AMARILLO";
    }
    const saved = await db_1.default.evaluationResult.create({
        data: {
            sessionId,
            evaluationId: session.evaluationId,
            participantId: session.participantId,
            score,
            resultJson: JSON.stringify({
                correct,
                total,
                percentage: score,
                color,
                result
            })
        }
    });
    return saved;
}
