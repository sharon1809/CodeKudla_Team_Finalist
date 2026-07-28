"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Document = void 0;
const mongoose_1 = require("mongoose");
const documentSchema = new mongoose_1.Schema({
    filename: {
        type: String,
        required: true,
        trim: true,
    },
    cloudinaryUrl: {
        type: String,
        required: true,
    },
    cloudinaryPublicId: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fileSize: {
        type: Number,
        required: true, // in bytes
    },
    chunkCount: {
        type: Number,
        default: 0,
    },
    uploadDate: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
exports.Document = (0, mongoose_1.model)('Document', documentSchema);
