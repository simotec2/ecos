"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const crypto_1 = require("crypto");
const XLSX = __importStar(require("xlsx"));
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
/* ======================================
UTILS
====================================== */
function normalize(text) {
    return String(text || "")
        .toLowerCase()
        .trim();
}
function isSelected(value) {
    return value === 1 || value === "1" || value === "X" || value === "x";
}
/* ======================================
MAPA VISUAL → SISTEMA
====================================== */
const evaluationMap = {
    // visibles
    "evaluacion conductual": "PETS",
    "evaluacion psicolaboral": "ICOM",
    // seguridad
    "seguridad supervisor puerto": "Seguridad Supervisor Puerto",
    "seguridad operador puerto": "Seguridad Operador Puerto",
    "seguridad supervisor minería": "Seguridad Supervisor Minería",
    "seguridad operador minería": "Seguridad Operador Minería"
};
router.post("/", async (req, res) => {
    try {
        const { file } = req.body;
        if (!file) {
            return res.status(400).json({ error: "Archivo requerido" });
        }
        const buffer = Buffer.from(file, "base64");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        const evaluationsDB = await db_1.default.evaluation.findMany();
        const results = [];
        for (const row of rows) {
            const nombre = row.nombre;
            const apellido = row.apellido;
            const rut = row.rut;
            const email = row.email;
            const empresa = row.empresa;
            const perfil = row.perfil;
            if (!nombre || !apellido || !rut)
                continue;
            const token = (0, crypto_1.randomUUID)();
            /* ======================
            EMPRESA
            ====================== */
            let companyId = null;
            if (empresa) {
                const company = await db_1.default.company.findFirst({
                    where: { name: empresa }
                });
                if (company)
                    companyId = company.id;
            }
            /* ======================
            PARTICIPANTE
            ====================== */
            const participant = await db_1.default.participant.create({
                data: {
                    nombre,
                    apellido,
                    rut,
                    email,
                    accessToken: token,
                    companyId,
                    perfil: perfil || null
                }
            });
            /* ======================
            ASIGNAR EVALUACIONES
            ====================== */
            for (const column in row) {
                const normalizedColumn = normalize(column);
                const mappedValue = evaluationMap[normalizedColumn];
                if (!mappedValue)
                    continue;
                const value = row[column];
                if (isSelected(value)) {
                    const evaluation = evaluationsDB.find(ev => ev.type === mappedValue || ev.name === mappedValue);
                    if (evaluation) {
                        await db_1.default.assignment.create({
                            data: {
                                participantId: participant.id,
                                evaluationId: evaluation.id,
                                status: "PENDING"
                            }
                        });
                    }
                }
            }
            /* ======================
            EMAIL
            ====================== */
            if (email) {
                try {
                    await (0, email_1.sendEvaluationEmail)(email, `${nombre} ${apellido}`, token);
                }
                catch (e) {
                    console.error("Error enviando email:", email);
                }
            }
            results.push(participant);
        }
        res.json({
            success: true,
            total: results.length
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error carga masiva",
            detail: error.message
        });
    }
});
exports.default = router;
