"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateICOMSession = evaluateICOMSession;
const db_1 = __importDefault(require("../db"));
async function evaluateICOMSession(sessionId) {
    const answers = await db_1.default.evaluationAnswer.findMany({
        where: { sessionId },
        include: {
            question: true
        }
    });
    let correct = 0;
    const total = answers.length;
    for (const ans of answers) {
        const selected = ans.answer || "";
        const correctAnswer = ans.question.correctAnswer || "";
        if (selected === correctAnswer) {
            correct++;
        }
    }
    const score = total > 0 ? (correct / total) * 100 : 0;
    const session = await db_1.default.evaluationSession.findUnique({
        where: { id: sessionId }
    });
    if (!session) {
        throw new Error("Session not found");
    }
    // 🔥 eliminar resultado previo
    await db_1.default.evaluationResult.deleteMany({
        where: { sessionId }
    });
    return await db_1.default.evaluationResult.create({
        data: {
            sessionId: session.id,
            evaluationId: session.evaluationId,
            participantId: session.participantId,
            score,
            resultJson: JSON.stringify({
                correct,
                total
            })
        }
    });
}
