"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../auth");
const router = (0, express_1.Router)();
/* ======================================
LISTAR ASIGNACIONES
====================================== */
router.get("/", auth_1.authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        /* ======================================
        SUPERADMIN Y PSYCHOLOGIST
        ====================================== */
        if (user.role === "SUPERADMIN" ||
            user.role === "PSYCHOLOGIST") {
            const data = await db_1.default.assignment.findMany({
                include: {
                    participant: {
                        include: {
                            company: true
                        }
                    },
                    evaluation: true
                },
                orderBy: {
                    createdAt: "desc"
                }
            });
            return res.json(data);
        }
        /* ======================================
        COMPANY ADMIN
        ====================================== */
        if (user.role === "COMPANY_ADMIN") {
            const data = await db_1.default.assignment.findMany({
                where: {
                    participant: {
                        companyId: user.companyId
                    }
                },
                include: {
                    participant: {
                        include: {
                            company: true
                        }
                    },
                    evaluation: true
                },
                orderBy: {
                    createdAt: "desc"
                }
            });
            return res.json(data);
        }
        /* ======================================
        OTROS ROLES
        ====================================== */
        return res.json([]);
    }
    catch (err) {
        console.error("❌ ERROR LISTANDO:", err);
        res.status(500).json({
            error: "Error obteniendo asignaciones"
        });
    }
});
/* ======================================
ASIGNAR / REASIGNAR
====================================== */
router.post("/", auth_1.authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const participantId = String(req.body.participantId || "");
        const evaluationId = String(req.body.evaluationId || "");
        if (!participantId || !evaluationId) {
            return res.status(400).json({
                error: "Datos requeridos"
            });
        }
        /* ======================================
        VALIDAR EMPRESA
        ====================================== */
        if (user.role === "COMPANY_ADMIN") {
            const participant = await db_1.default.participant.findUnique({
                where: {
                    id: participantId
                }
            });
            if (!participant ||
                participant.companyId !== user.companyId) {
                return res.status(403).json({
                    error: "Sin permisos"
                });
            }
        }
        /* ======================================
        BUSCAR EXISTENTE
        ====================================== */
        const existing = await db_1.default.assignment.findFirst({
            where: {
                participantId,
                evaluationId
            }
        });
        /* ======================================
        REASIGNAR
        ====================================== */
        if (existing) {
            const updated = await db_1.default.assignment.update({
                where: {
                    id: existing.id
                },
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
        /* ======================================
        CREAR
        ====================================== */
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
        if (err.code === "P2002") {
            return res.status(200).json({
                message: "Asignación ya existente"
            });
        }
        res.status(500).json({
            error: "Error asignando evaluación"
        });
    }
});
exports.default = router;
