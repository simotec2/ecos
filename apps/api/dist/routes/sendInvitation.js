"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const emailService_1 = require("../services/emailService");
const router = (0, express_1.Router)();
router.post("/:participantId", async (req, res) => {
    try {
        const { participantId } = req.params;
        const participant = await db_1.default.participant.findUnique({
            where: { id: participantId }
        });
        if (!participant) {
            return res.status(404).json({
                error: "Participante no encontrado"
            });
        }
        if (!participant.email) {
            return res.status(400).json({
                error: "El participante no tiene correo"
            });
        }
        if (!participant.accessToken) {
            return res.status(400).json({
                error: "Participante sin token de acceso"
            });
        }
        await (0, emailService_1.sendEvaluationEmail)(participant.email, participant.nombre, participant.accessToken);
        res.json({
            success: true
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error enviando invitación"
        });
    }
});
exports.default = router;
