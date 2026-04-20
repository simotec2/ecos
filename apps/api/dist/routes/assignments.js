"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
/* ======================================
LISTAR ASIGNACIONES
====================================== */
router.get("/", async (req, res) => {
    try {
        const data = await db_1.default.assignment.findMany({
            include: {
                participant: true,
                evaluation: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        res.json(data);
    }
    catch (err) {
        console.error("❌ ERROR LISTANDO:", err);
        res.status(500).json({
            error: "Error obteniendo asignaciones"
        });
    }
});
/* ======================================
ASIGNAR / REASIGNAR (100% COMPATIBLE)
====================================== */
router.post("/", async (req, res) => {
    try {
        const participantId = String(req.body.participantId || "");
        const evaluationId = String(req.body.evaluationId || "");
        if (!participantId || !evaluationId) {
            return res.status(400).json({
                error: "Datos requeridos"
            });
        }
        /* =========================
        BUSCAR EXISTENTE
        ========================= */
        const existing = await db_1.default.assignment.findFirst({
            where: {
                participantId,
                evaluationId
            }
        });
        /* =========================
        SI EXISTE → RESETEAR
        ========================= */
        if (existing) {
            const updated = await db_1.default.assignment.update({
                where: { id: existing.id },
                data: {
                    status: "PENDING"
                }
            });
            console.log("♻️ REASIGNANDO:", updated.id);
            return res.json({
                message: "Asignación reiniciada",
                assignment: updated
            });
        }
        /* =========================
        SI NO EXISTE → CREAR
        ========================= */
        const created = await db_1.default.assignment.create({
            data: {
                participantId,
                evaluationId,
                status: "PENDING"
            }
        });
        console.log("✅ NUEVA ASIGNACIÓN:", created.id);
        return res.json({
            message: "Asignación creada",
            assignment: created
        });
    }
    catch (err) {
        console.error("❌ ERROR ASIGNANDO:", err);
        /* 🔥 MANEJO ESPECÍFICO PRISMA */
        if (err.code === "P2002") {
            return res.status(200).json({
                message: "Asignación ya existente (controlado)"
            });
        }
        res.status(500).json({
            error: "Error asignando evaluación"
        });
    }
});
exports.default = router;
