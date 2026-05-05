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
router.get("/", async (req, res) => {
    try {
        const participants = await db_1.default.participant.findMany({
            include: { company: true },
            orderBy: { createdAt: "desc" }
        });
        res.json(participants);
    }
    catch (error) {
        console.error("GET PARTICIPANTS ERROR:", error?.message, error);
        res.status(500).json({
            error: "Error obteniendo participantes"
        });
    }
});
/* ======================================
CREAR PARTICIPANTE
====================================== */
router.post("/", async (req, res) => {
    try {
        const { nombre, apellido, rut, email, companyId } = req.body;
        if (!nombre || !apellido || !rut) {
            return res.status(400).json({
                error: "Nombre, apellido y rut requeridos"
            });
        }
        const cleanRut = normalizeRut(rut);
        const existing = await db_1.default.participant.findFirst({
            where: {
                rut: cleanRut,
                companyId: companyId || null
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
                email,
                accessToken: token,
                companyId: companyId || null
            }
        });
        res.json(participant);
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
router.put("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { nombre, apellido, rut, email, companyId } = req.body;
        if (!nombre || !apellido || !rut) {
            return res.status(400).json({
                error: "Nombre, apellido y rut requeridos"
            });
        }
        const cleanRut = normalizeRut(rut);
        const existing = await db_1.default.participant.findFirst({
            where: {
                rut: cleanRut,
                companyId: companyId || null,
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
                email,
                companyId: companyId || null
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
router.post("/:id/resend", async (req, res) => {
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
                data: { accessToken: token }
            });
        }
        await (0, email_1.sendEvaluationEmail)(participant.email, `${participant.nombre} ${participant.apellido}`, token);
        res.json({ success: true });
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
router.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        await db_1.default.participant.delete({
            where: { id }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error("DELETE PARTICIPANT ERROR:", error?.message, error);
        res.status(500).json({
            error: "Error eliminando participante"
        });
    }
});
/* ======================================
ACCESS PARTICIPANTE
====================================== */
router.get("/access/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const participant = await db_1.default.participant.findFirst({
            where: { accessToken: token },
            include: { company: true }
        });
        if (!participant) {
            return res.status(404).json({
                error: "Participante no encontrado"
            });
        }
        const assignments = await db_1.default.assignment.findMany({
            where: {
                participantId: participant.id,
                status: { in: ["PENDING", "STARTED"] }
            },
            include: { evaluation: true },
            orderBy: { createdAt: "desc" }
        });
        const evaluations = assignments.map(a => ({
            id: a.evaluation.id,
            name: a.evaluation.name,
            type: a.evaluation.type,
            status: a.status
        }));
        return res.json({
            participant,
            evaluations
        });
    }
    catch (err) {
        console.error("ERROR ACCESS:", err?.message, err);
        return res.status(500).json({
            error: "Error obteniendo acceso"
        });
    }
});
exports.default = router;
