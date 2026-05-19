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
const XLSX = __importStar(require("xlsx"));
const jwt_1 = require("../utils/jwt");
const router = (0, express_1.Router)();
/* =====================================
AUTH
===================================== */
function getUser(req) {
    try {
        const auth = req.headers.authorization || "";
        if (!auth.startsWith("Bearer ")) {
            return null;
        }
        const token = auth.replace("Bearer ", "");
        return (0, jwt_1.verifyAccessToken)(token);
    }
    catch {
        return null;
    }
}
/* =====================================
EXPORTAR RESULTADOS
===================================== */
router.get("/results", async (req, res) => {
    try {
        const user = getUser(req);
        if (!user) {
            return res.status(401).json({
                error: "No autorizado"
            });
        }
        /* =========================
        FILTRO EMPRESA
        ========================= */
        const participantWhere = {};
        if (user.role === "COMPANY_ADMIN") {
            participantWhere.companyId =
                user.companyId;
        }
        /* =========================
        RESULTADOS
        ========================= */
        const results = await db_1.default.evaluationResult.findMany({
            where: {
                participant: {
                    ...participantWhere
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
        /* =========================
        EXCEL ROWS
        ========================= */
        const rows = results.map((r) => {
            let parsed = {};
            try {
                parsed =
                    typeof r.resultJson === "string"
                        ? JSON.parse(r.resultJson)
                        : r.resultJson || {};
            }
            catch {
                parsed = {};
            }
            return {
                Fecha: new Date(r.createdAt)
                    .toLocaleDateString("es-CL"),
                Empresa: r.participant?.company?.name || "",
                Participante: `${r.participant?.nombre || ""} ${r.participant?.apellido || ""}`,
                Perfil: r.participant?.perfil || "",
                Evaluacion: r.evaluation?.name || "",
                Tipo: r.evaluation?.type || "",
                Puntaje: r.score || 0,
                Resultado: parsed?.traffic?.result || "",
                Semaforo: parsed?.traffic?.color || ""
            };
        });
        /* =========================
        WORKBOOK
        ========================= */
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");
        const buffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx"
        });
        /* =========================
        RESPONSE
        ========================= */
        res.setHeader("Content-Disposition", "attachment; filename=resultados_ecos.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        return res.send(buffer);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Error exportando Excel"
        });
    }
});
exports.default = router;
