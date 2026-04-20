"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    try {
        const sessionId = String(req.body.sessionId || "");
        const questionId = String(req.body.questionId || "");
        const answer = String(req.body.answer ?? "");
        if (!sessionId || !questionId) {
            return res.status(400).json({
                error: "sessionId y questionId requeridos"
            });
        }
        const existing = await db_1.default.evaluationAnswer.findFirst({
            where: {
                sessionId,
                questionId
            }
        });
        if (existing) {
            const updated = await db_1.default.evaluationAnswer.update({
                where: { id: existing.id },
                data: { answer }
            });
            return res.json(updated);
        }
        const created = await db_1.default.evaluationAnswer.create({
            data: {
                sessionId,
                questionId,
                answer
            }
        });
        return res.json(created);
    }
    catch (err) {
        console.error("Error guardando respuesta", err);
        return res.status(500).json({
            error: "Error interno"
        });
    }
});
exports.default = router;
