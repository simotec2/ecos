"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    const { evaluationId, text, type, optionsJson, correctAnswer, keywordsJson } = req.body;
    const question = await db_1.default.evaluationQuestion.create({
        data: {
            evaluationId,
            text,
            type,
            optionsJson,
            correctAnswer,
            keywordsJson
        }
    });
    res.json(question);
});
exports.default = router;
