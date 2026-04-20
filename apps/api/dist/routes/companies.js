"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
/* ======================================================
GET COMPANIES
====================================================== */
router.get("/", async (req, res) => {
    try {
        const companies = await db_1.default.company.findMany({
            orderBy: {
                createdAt: "desc"
            }
        });
        res.json(companies);
    }
    catch (error) {
        console.error("Error companies:", error);
        res.status(500).json({
            error: "Error obteniendo empresas"
        });
    }
});
/* ======================================================
CREATE COMPANY
====================================================== */
router.post("/", async (req, res) => {
    try {
        const { name, razonSocial, rut, direccion, giro, contactoNombre, contactoTelefono, contactoEmail } = req.body;
        if (!name) {
            return res.status(400).json({
                error: "Nombre requerido"
            });
        }
        const company = await db_1.default.company.create({
            data: {
                name,
                razonSocial,
                rut,
                direccion,
                giro,
                contactoNombre,
                contactoTelefono,
                contactoEmail
            }
        });
        res.json(company);
    }
    catch (error) {
        console.error("Error creando empresa:", error);
        res.status(500).json({
            error: "Error creando empresa"
        });
    }
});
/* ======================================================
DELETE COMPANY
====================================================== */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.company.delete({
            where: { id }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error eliminando empresa"
        });
    }
});
exports.default = router;
