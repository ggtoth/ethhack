"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenAIClient = getOpenAIClient;
exports.getReviewModel = getReviewModel;
const openai_1 = __importDefault(require("openai"));
let cachedClient = null;
function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set.");
    }
    if (!cachedClient) {
        cachedClient = new openai_1.default({ apiKey });
    }
    return cachedClient;
}
function getReviewModel() {
    return process.env.OPENAI_MODEL || "gpt-4.1-mini";
}
