"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const reportEngine_1 = require("../services/reportEngine");
const router = (0, express_1.Router)();
router.post("/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
        console.log("🔵 FINALIZANDO:", sessionId);
        const session = await db_1.default.evaluationSession.findUnique({
            where: { id: sessionId }
        });
        if (!session) {
            return res.status(404).json({ error: "Sesión no encontrada" });
        }
        /* =========================
        GENERAR REPORTE
        ========================= */
        await (0, reportEngine_1.generateEvaluationReport)(sessionId);
        /* =========================
        MARCAR SESIÓN COMPLETA
        ========================= */
        await db_1.default.evaluationSession.update({
            where: { id: sessionId },
            data: {
                completedAt: new Date(),
                status: "COMPLETED"
            }
        });
        /* =========================
        MARCAR ASSIGNMENT COMPLETADO
        ========================= */
        await db_1.default.assignment.update({
            where: {
                participantId_evaluationId: {
                    participantId: session.participantId,
                    evaluationId: session.evaluationId
                }
            },
            data: {
                status: "COMPLETED"
            }
        });
        /* =========================
        CONTAR PENDIENTES
        ========================= */
        const pending = await db_1.default.assignment.count({
            where: {
                participantId: session.participantId,
                status: { not: "COMPLETED" }
            }
        });
        console.log("🟡 PENDIENTES:", pending);
        return res.json({
            ok: true,
            pending
        });
    }
    catch (e) {
        console.error("❌ FINISH ERROR:", e);
        return res.status(500).json({
            error: "Error al finalizar evaluación"
        });
    }
});
exports.default = router;
