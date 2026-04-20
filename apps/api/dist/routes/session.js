"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
}
/* ======================================
CREAR SESIÓN (FINAL CORRECTO)
====================================== */
router.post("/", async (req, res) => {
    try {
        const { participantId, evaluationId } = req.body;
        if (!participantId || !evaluationId) {
            return res.status(400).json({ error: "Datos incompletos" });
        }
        /* =========================
        🔥 BUSCAR ÚLTIMA ASIGNACIÓN ACTIVA
        ========================= */
        const assignment = await db_1.default.assignment.findFirst({
            where: {
                participantId,
                evaluationId,
                status: {
                    in: ["PENDING", "STARTED"]
                }
            },
            orderBy: {
                createdAt: "desc" // 🔥 CLAVE
            }
        });
        if (!assignment) {
            return res.status(404).json({
                error: "Evaluación no asignada o ya finalizada"
            });
        }
        /* =========================
        🔥 REUTILIZAR SESIÓN ACTIVA
        ========================= */
        const existingSession = await db_1.default.evaluationSession.findFirst({
            where: {
                participantId,
                evaluationId,
                status: "IN_PROGRESS"
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        if (existingSession) {
            console.log("♻️ REUSING SESSION:", existingSession.id);
            return res.json(existingSession);
        }
        /* =========================
        TRAER EVALUACIÓN
        ========================= */
        const evaluation = await db_1.default.evaluation.findUnique({
            where: { id: evaluationId },
            include: { questions: true }
        });
        if (!evaluation) {
            return res.status(404).json({ error: "Evaluación no encontrada" });
        }
        if (!evaluation.questions.length) {
            return res.status(400).json({ error: "Evaluación sin preguntas" });
        }
        /* =========================
        SELECCIÓN DE PREGUNTAS
        ========================= */
        let selected = evaluation.questions;
        if (evaluation.type === "SECURITY") {
            selected = shuffle(evaluation.questions).slice(0, 20);
        }
        if (evaluation.type === "ICOM") {
            selected = shuffle(evaluation.questions);
        }
        /* =========================
        CREAR SESIÓN NUEVA
        ========================= */
        const session = await db_1.default.evaluationSession.create({
            data: {
                participantId,
                evaluationId,
                status: "IN_PROGRESS"
            }
        });
        console.log("✅ SESSION CREATED:", session.id);
        /* =========================
        CREAR RESPUESTAS
        ========================= */
        await db_1.default.evaluationAnswer.createMany({
            data: selected.map(q => ({
                sessionId: session.id,
                questionId: q.id,
                answer: ""
            }))
        });
        console.log("✅ ANSWERS CREATED:", selected.length);
        /* =========================
        MARCAR COMO STARTED
        ========================= */
        if (assignment.status === "PENDING") {
            await db_1.default.assignment.update({
                where: { id: assignment.id },
                data: { status: "STARTED" }
            });
        }
        return res.json(session);
    }
    catch (e) {
        console.error("❌ ERROR CREANDO SESIÓN:", e);
        res.status(500).json({ error: "Error creando sesión" });
    }
});
/* ======================================
GET SESIÓN
====================================== */
router.get("/:id", async (req, res) => {
    try {
        const session = await db_1.default.evaluationSession.findUnique({
            where: { id: req.params.id },
            include: {
                answers: {
                    include: { question: true }
                }
            }
        });
        if (!session) {
            return res.status(404).json({ error: "Sesión no encontrada" });
        }
        const questions = session.answers.map(a => a.question);
        return res.json({
            id: session.id,
            questions
        });
    }
    catch (e) {
        console.error("❌ ERROR GET SESSION:", e);
        res.status(500).json({ error: "Error obteniendo sesión" });
    }
});
exports.default = router;
