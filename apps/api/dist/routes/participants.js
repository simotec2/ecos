"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const crypto_1 = require("crypto");
const email_1 = require("../utils/email");
const auth_1 = require("../auth");
const router = (0, express_1.Router)();
/* ======================================
UTIL: NORMALIZAR RUT
====================================== */
function normalizeRut(rut) {
    if (!rut)
        return "";
    let clean = rut
        .replace(/\./g, "")
        .replace(/\s/g, "")
        .toLowerCase();
    if (clean.includes("-")) {
        const [num, dv] = clean.split("-");
        return `${num}-${dv}`;
    }
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    return `${body}-${dv}`;
}
/* ======================================
OBTENER PARTICIPANTES
====================================== */
router.get("/", auth_1.authMiddleware, async (req, res) => {
    try {
        let where = {};
        /* ======================================
        COMPANY ADMIN SOLO SU EMPRESA
        ====================================== */
        if (req.user?.role === "COMPANY_ADMIN") {
            where.companyId = req.user.companyId;
        }
        const participants = await db_1.default.participant.findMany({
            where,
            include: {
                company: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        return res.json(participants);
    }
    catch (error) {
        console.error("GET PARTICIPANTS ERROR:", error?.message, error);
        return res.status(500).json({
            error: "Error obteniendo participantes"
        });
    }
});
/* ======================================
CREAR PARTICIPANTE
====================================== */
router.post("/", auth_1.authMiddleware, async (req, res) => {
    try {
        const { nombre, apellido, rut, perfil, email, companyId } = req.body;
        if (!nombre || !apellido || !rut) {
            return res.status(400).json({
                error: "Nombre, apellido y rut requeridos"
            });
        }
        /* ======================================
        COMPANY ADMIN SOLO SU EMPRESA
        ====================================== */
        let finalCompanyId = companyId || null;
        if (req.user?.role === "COMPANY_ADMIN") {
            finalCompanyId = req.user.companyId;
        }
        const cleanRut = normalizeRut(rut);
        const existing = await db_1.default.participant.findFirst({
            where: {
                rut: cleanRut,
                companyId: finalCompanyId
            }
        });
        if (existing) {
            return res.status(400).json({
                error: "Este RUT ya existe en esta empresa"
            });
        }
        const token = (0, crypto_1.randomUUID)();
        const participant = await db_1.default.participant.create({
            data: {
                nombre,
                apellido,
                rut: cleanRut,
                perfil,
                email,
                accessToken: token,
                companyId: finalCompanyId
            }
        });
        res.json(participant);
        /* ======================================
        ENVIAR EMAIL
        ====================================== */
        if (email) {
            (0, email_1.sendEvaluationEmail)(email, `${nombre} ${apellido}`, token);
        }
    }
    catch (error) {
        console.error("CREATE PARTICIPANT ERROR:", error?.message, error);
        return res.status(500).json({
            error: "Error creando participante"
        });
    }
});
/* ======================================
ACTUALIZAR PARTICIPANTE
====================================== */
router.put("/:id", auth_1.authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const { nombre, apellido, rut, perfil, email, companyId } = req.body;
        if (!nombre || !apellido || !rut) {
            return res.status(400).json({
                error: "Nombre, apellido y rut requeridos"
            });
        }
        const current = await db_1.default.participant.findUnique({
            where: { id }
        });
        if (!current) {
            return res.status(404).json({
                error: "Participante no encontrado"
            });
        }
        /* ======================================
        COMPANY ADMIN SOLO SU EMPRESA
        ====================================== */
        if (req.user?.role === "COMPANY_ADMIN" &&
            current.companyId !== req.user.companyId) {
            return res.status(403).json({
                error: "No autorizado"
            });
        }
        let finalCompanyId = companyId || null;
        if (req.user?.role === "COMPANY_ADMIN") {
            finalCompanyId = req.user.companyId;
        }
        const cleanRut = normalizeRut(rut);
        const existing = await db_1.default.participant.findFirst({
            where: {
                rut: cleanRut,
                companyId: finalCompanyId,
                NOT: { id }
            }
        });
        if (existing) {
            return res.status(400).json({
                error: "Este RUT ya existe en esta empresa"
            });
        }
        const participant = await db_1.default.participant.update({
            where: { id },
            data: {
                nombre,
                apellido,
                rut: cleanRut,
                perfil,
                email,
                companyId: finalCompanyId
            }
        });
        res.json(participant);
    }
    catch (error) {
        console.error("UPDATE PARTICIPANT ERROR:", error?.message, error);
        res.status(500).json({
            error: "Error actualizando participante"
        });
    }
});
/* ======================================
REENVIAR INVITACIÓN
====================================== */
router.post("/:id/resend", auth_1.authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const participant = await db_1.default.participant.findUnique({
            where: { id }
        });
        if (!participant) {
            return res.status(404).json({
                error: "Participante no encontrado"
            });
        }
        /* ======================================
        COMPANY ADMIN SOLO SU EMPRESA
        ====================================== */
        if (req.user?.role === "COMPANY_ADMIN" &&
            participant.companyId !== req.user.companyId) {
            return res.status(403).json({
                error: "No autorizado"
            });
        }
        if (!participant.email) {
            return res.status(400).json({
                error: "El participante no tiene email"
            });
        }
        let token = participant.accessToken;
        if (!token) {
            token = (0, crypto_1.randomUUID)();
            await db_1.default.participant.update({
                where: { id },
                data: {
                    accessToken: token
                }
            });
        }
        await (0, email_1.sendEvaluationEmail)(participant.email, `${participant.nombre} ${participant.apellido}`, token);
        res.json({
            success: true
        });
    }
    catch (error) {
        console.error("RESEND ERROR:", error?.message, error);
        res.status(500).json({
            error: "Error reenviando invitación"
        });
    }
});
/* ======================================
ELIMINAR PARTICIPANTE
====================================== */
router.delete("/:id", auth_1.authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== "SUPERADMIN") {
            return res.status(403).json({
                error: "No autorizado"
            });
        }
        const id = req.params.id;
        /* ======================================
        ELIMINAR RESULTADOS
        ====================================== */
        await db_1.default.evaluationResult.deleteMany({
            where: { participantId: id }
        });
        /* ======================================
        ELIMINAR ASIGNACIONES
        ====================================== */
        await db_1.default.assignment.deleteMany({
            where: { participantId: id }
        });
        /* ======================================
        ELIMINAR PARTICIPANTE
        ====================================== */
        await db_1.default.participant.delete({
            where: { id }
        });
        return res.json({
            success: true
        });
    }
    catch (error) {
        console.error("DELETE PARTICIPANT ERROR:", error?.message, error);
        return res.status(500).json({
            error: "Error eliminando participante"
        });
    }
});
exports.default = router;
