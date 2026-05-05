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
const XLSX = __importStar(require("xlsx"));
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    const evaluations = await db_1.default.evaluation.findMany();
    const baseColumns = [
        "nombre",
        "apellido",
        "rut",
        "email",
        "empresa",
        "perfil"
    ];
    const visibleMap = {
        PETS: "Evaluacion Conductual",
        ICOM: "Evaluacion Psicolaboral"
    };
    const dynamicColumns = evaluations.map(ev => {
        return visibleMap[ev.type] || ev.name;
    });
    const columns = [...baseColumns, ...dynamicColumns];
    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(worksheet, [columns]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
    const buffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx"
    });
    res.setHeader("Content-Disposition", "attachment; filename=plantilla_ecos.xlsx");
    res.send(buffer);
});
exports.default = router;
