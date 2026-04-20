"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
/*
=====================================
HISTORIAL POR PARTICIPANTE
=====================================
*/
router.get("/:participantId", async (req, res) => {
    try {
        const participantId = String(req.params.participantId);
        const history = await db_1.default.evaluationResult.findMany({
            where: { participantId },
            include: {
                evaluation: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        return res.json(history);
    }
    catch (err) {
        console.error("HISTORY ERROR:", err);
        res.status(500).json({
            error: "Error obteniendo historial"
        });
    }
});
exports.default = router;
