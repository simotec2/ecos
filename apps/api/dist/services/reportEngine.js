"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEvaluationReport = generateEvaluationReport;
const db_1 = __importDefault(require("../db"));
const ai = __importStar(require("./aiEngine"));
/* ======================================
UTILS
====================================== */
function normalize(value) {
    return (value || "").toLowerCase().trim();
}
function calculateTrafficLight(score) {
    if (score >= 85)
        return { color: "VERDE", result: "RECOMENDABLE" };
    if (score >= 55)
        return { color: "AMARILLO", result: "RECOMENDABLE CON OBSERVACIONES" };
    return { color: "ROJO", result: "NO RECOMENDABLE" };
}
function mapLikert(value) {
    if (!value)
        return 0;
    const v = String(value).toLowerCase().trim();
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
    if (v === "1")
        return 0;
    if (v === "2")
        return 25;
    if (v === "3")
        return 50;
    if (v === "4")
        return 75;
    if (v === "5")
        return 100;
    return 0;
}
/* ======================================
MAIN
====================================== */
async function generateEvaluationReport(sessionId) {
    const session = await db_1.default.evaluationSession.findUnique({
        where: { id: sessionId },
        include: {
            evaluation: true,
            participant: { include: { company: true } },
            answers: { include: { question: true } }
        }
    });
    if (!session)
        throw new Error("Sesión no encontrada");
    const type = session.evaluation.type;
    let score = 0;
    let competencies = [];
    /* ================= PETS ================= */
    if (type === "PETS") {
        const results = await Promise.all(session.answers.map(async (a) => {
            let keywords = [];
            try {
                keywords = typeof a.question.keywordsJson === "string"
                    ? JSON.parse(a.question.keywordsJson)
                    : a.question.keywordsJson || [];
            }
            catch {
                keywords = [];
            }
            const r = await ai.evaluateCompetencyAI(a.question.text, a.answer || "", keywords);
            return {
                competency: a.question.competency || "General",
                score: r.score || 30
            };
        }));
        const grouped = {};
        results.forEach(r => {
            if (!grouped[r.competency])
                grouped[r.competency] = [];
            grouped[r.competency].push(r.score);
        });
        competencies = Object.entries(grouped).map(([name, arr]) => ({
            name,
            score: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        }));
        score = competencies.length
            ? competencies.reduce((a, b) => a + b.score, 0) / competencies.length
            : 0;
    }
    /* ================= ICOM ================= */
    if (type === "ICOM") {
        const grouped = {};
        session.answers.forEach(a => {
            const val = mapLikert(a.answer || "");
            const comp = a.question.competency || "General";
            if (!grouped[comp])
                grouped[comp] = [];
            grouped[comp].push(val);
        });
        competencies = Object.entries(grouped).map(([name, arr]) => ({
            name,
            score: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        }));
        score = competencies.length
            ? competencies.reduce((a, b) => a + b.score, 0) / competencies.length
            : 0;
    }
    /* ================= SECURITY ================= */
    if (type === "SECURITY") {
        const grouped = {};
        session.answers.forEach(a => {
            let user = normalize(a.answer || "");
            const map = { "0": "a", "1": "b", "2": "c" };
            if (map[user])
                user = map[user];
            user = user.replace(/[^\w]/g, "");
            let good = normalize(a.question.correctAnswer || "");
            good = good.replace(/[^\w]/g, "");
            const val = user === good ? 100 : 0;
            const comp = a.question.competency || "General";
            if (!grouped[comp])
                grouped[comp] = [];
            grouped[comp].push(val);
        });
        competencies = Object.entries(grouped).map(([name, arr]) => ({
            name,
            score: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        }));
        score = competencies.length
            ? competencies.reduce((a, b) => a + b.score, 0) / competencies.length
            : 0;
    }
    /* ================= LIMPIEZA ================= */
    const clean = competencies.filter(c => !c.name.toLowerCase().includes("debe sumarse"));
    const traffic = calculateTrafficLight(score);
    const enriched = ai.enrichCompetencies(clean);
    const answersText = session.answers
        .filter(a => a.answer && a.answer.trim().length > 0)
        .map(a => ({
        question: a.question.text,
        answer: a.answer,
        competency: a.question.competency
    }));
    let aiText = "";
    try {
        aiText = await ai.generateAIReport({
            score,
            competencies: enriched,
            type,
            traffic,
            answers: answersText
        });
    }
    catch (error) {
        console.error("❌ ERROR IA:", error);
        aiText = "No fue posible generar el análisis automático.";
    }
    const recommendations = ai.generateRecommendations(enriched);
    const risk = ai.calculateRisk(score);
    await db_1.default.evaluationResult.deleteMany({
        where: { sessionId: session.id }
    });
    return await db_1.default.evaluationResult.create({
        data: {
            sessionId: session.id,
            participantId: session.participantId,
            evaluationId: session.evaluationId,
            score,
            resultJson: JSON.stringify({
                score,
                traffic,
                competencies: enriched,
                recommendations,
                risk,
                aiText
            })
        }
    });
}
