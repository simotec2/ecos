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
ACCESO PARTICIPANTE POR TOKEN
=====================================
*/
router.get("/:token", async (req, res) => {
    try {
        const token = String(req.params.token || "").trim();
        if (!token) {
            return res.status(400).json({
                error: "Token requerido"
            });
        }
        // 🔥 Buscar participante con assignments + evaluation
        const participant = await db_1.default.participant.findFirst({
            where: {
                accessToken: token
            },
            include: {
                assignments: {
                    include: {
                        evaluation: true
                    }
                }
            }
        });
        if (!participant) {
            return res.status(404).json({
                error: "Participante no encontrado"
            });
        }
        // 🔥 Formatear evaluaciones correctamente
        const evaluations = participant.assignments
            .filter(a => a.evaluation) // 🔥 evita null
            .map(a => ({
            id: a.evaluation.id,
            name: a.evaluation.name,
            type: a.evaluation.type,
            status: a.status
        }));
        res.json({
            participant: {
                id: participant.id,
                nombre: participant.nombre,
                apellido: participant.apellido
            },
            evaluations
        });
    }
    catch (error) {
        console.error("ERROR PARTICIPANT ACCESS:", error);
        res.status(500).json({
            error: "Error obteniendo acceso del participante"
        });
    }
});
exports.default = router;
