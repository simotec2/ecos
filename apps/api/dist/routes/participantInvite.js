"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const crypto_1 = require("crypto");
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
/* ======================================
INVITAR PARTICIPANTE (CON ENVÍO DE EMAIL)
====================================== */
router.get("/:id/invite", async (req, res) => {
    try {
        const { id } = req.params;
        const token = (0, crypto_1.randomUUID)();
        const participant = await db_1.default.participant.update({
            where: { id },
            data: { accessToken: token }
        });
        if (!participant.email) {
            return res.status(400).json({
                error: "El participante no tiene email"
            });
        }
        await (0, email_1.sendEvaluationEmail)(participant.email, `${participant.nombre} ${participant.apellido}`, token);
        const link = `http://localhost:5173/participant/${token}`;
        res.json({
            success: true,
            participant,
            link
        });
    }
    catch (error) {
        console.error("❌ ERROR INVITE:", error);
        res.status(500).json({
            error: "Error enviando invitación"
        });
    }
});
exports.default = router;
