"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const emailService_1 = require("../services/emailService");
const router = (0, express_1.Router)();
/* ======================================
ENVÍO INDIVIDUAL (YA EXISTENTE)
====================================== */
router.post("/:participantId", async (req, res) => {
    try {
        const { participantId } = req.params;
        const participant = await db_1.default.participant.findUnique({
            where: { id: participantId }
        });
        if (!participant) {
            return res.status(404).json({ error: "Participante no encontrado" });
        }
        if (!participant.email || !participant.accessToken) {
            return res.status(400).json({
                error: "Participante sin email o token"
            });
        }
        await (0, emailService_1.sendEvaluationEmail)(participant.email, participant.nombre, participant.accessToken);
        /* marcar enviado */
        await db_1.default.assignment.updateMany({
            where: { participantId },
            data: { invitationSent: true }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error enviando invitación"
        });
    }
});
/* ======================================
ENVÍO MASIVO POR EMPRESA
====================================== */
router.post("/", async (req, res) => {
    try {
        const { companyId } = req.body;
        if (!companyId) {
            return res.status(400).json({
                error: "companyId requerido"
            });
        }
        const participants = await db_1.default.participant.findMany({
            where: { companyId }
        });
        let sent = 0;
        let skipped = 0;
        for (const p of participants) {
            if (!p.email || !p.accessToken) {
                skipped++;
                continue;
            }
            /* solo pendientes */
            const pending = await db_1.default.assignment.findFirst({
                where: {
                    participantId: p.id,
                    status: "PENDING"
                }
            });
            if (!pending) {
                skipped++;
                continue;
            }
            /* evitar duplicados */
            const alreadySent = await db_1.default.assignment.findFirst({
                where: {
                    participantId: p.id,
                    invitationSent: true
                }
            });
            if (alreadySent) {
                skipped++;
                continue;
            }
            await (0, emailService_1.sendEvaluationEmail)(p.email, p.nombre, p.accessToken);
            await db_1.default.assignment.updateMany({
                where: { participantId: p.id },
                data: { invitationSent: true }
            });
            sent++;
        }
        res.json({
            success: true,
            sent,
            skipped
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error envío masivo",
            detail: error.message
        });
    }
});
exports.default = router;
