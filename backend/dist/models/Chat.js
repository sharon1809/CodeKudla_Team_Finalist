"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const mongoose_1 = require("mongoose");
const citationSchema = new mongoose_1.Schema({
    text: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    sourceName: { type: String, required: true },
}, { _id: false });
const messageSchema = new mongoose_1.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    citations: [citationSchema],
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
const chatSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    document: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
    },
    messages: [messageSchema],
}, {
    timestamps: true,
});
exports.Chat = (0, mongoose_1.model)('Chat', chatSchema);
