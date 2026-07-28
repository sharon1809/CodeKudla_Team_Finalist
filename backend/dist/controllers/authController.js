"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.updateProfile = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const User_1 = require("../models/User");
const RefreshToken_1 = require("../models/RefreshToken");
const token_1 = require("../utils/token");
const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        if (!email || !password || !firstName || !lastName) {
            res.status(400).json({ message: 'All fields are required' });
            return;
        }
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ message: 'A user with this email already exists' });
            return;
        }
        const user = new User_1.User({ email, password, firstName, lastName });
        await user.save();
        const payload = { id: user._id.toString(), email: user.email };
        const accessToken = (0, token_1.generateAccessToken)(payload);
        const refreshToken = (0, token_1.generateRefreshToken)(payload);
        // Save refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
        const tokenRecord = new RefreshToken_1.RefreshToken({
            token: refreshToken,
            user: user._id,
            expiresAt,
        });
        await tokenRecord.save();
        res.status(201).json({
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        const user = await User_1.User.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        const payload = { id: user._id.toString(), email: user.email };
        const accessToken = (0, token_1.generateAccessToken)(payload);
        const refreshToken = (0, token_1.generateRefreshToken)(payload);
        // Save refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await new RefreshToken_1.RefreshToken({
            token: refreshToken,
            user: user._id,
            expiresAt,
        }).save();
        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken: tokenInput } = req.body;
        if (!tokenInput) {
            res.status(400).json({ message: 'Refresh token is required' });
            return;
        }
        // Verify token exists in database
        const savedToken = await RefreshToken_1.RefreshToken.findOne({ token: tokenInput });
        if (!savedToken) {
            res.status(403).json({ message: 'Refresh token is invalid or expired' });
            return;
        }
        // Check expiration
        if (new Date() > savedToken.expiresAt) {
            await RefreshToken_1.RefreshToken.deleteOne({ _id: savedToken._id });
            res.status(403).json({ message: 'Refresh token has expired' });
            return;
        }
        try {
            const decoded = (0, token_1.verifyRefreshToken)(tokenInput);
            const user = await User_1.User.findById(decoded.id);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            // Generate new tokens
            const payload = { id: user._id.toString(), email: user.email };
            const newAccessToken = (0, token_1.generateAccessToken)(payload);
            const newRefreshToken = (0, token_1.generateRefreshToken)(payload);
            // Rotate token: Delete old token and save new token
            await RefreshToken_1.RefreshToken.deleteOne({ _id: savedToken._id });
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            await new RefreshToken_1.RefreshToken({
                token: newRefreshToken,
                user: user._id,
                expiresAt,
            }).save();
            res.status(200).json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            });
        }
        catch (err) {
            // Token JWT verification failed
            await RefreshToken_1.RefreshToken.deleteOne({ _id: savedToken._id });
            res.status(403).json({ message: 'Refresh token verification failed', error: err.message });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error refreshing token', error: error.message });
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res) => {
    try {
        const { refreshToken: tokenInput } = req.body;
        if (tokenInput) {
            await RefreshToken_1.RefreshToken.deleteOne({ token: tokenInput });
        }
        res.status(200).json({ message: 'Logged out successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error logging out', error: error.message });
    }
};
exports.logout = logout;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const { firstName, lastName, password } = req.body;
        const user = await User_1.User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (firstName)
            user.firstName = firstName;
        if (lastName)
            user.lastName = lastName;
        if (password)
            user.password = password; // pre-save hook will hash it
        await user.save();
        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};
exports.updateProfile = updateProfile;
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const user = await User_1.User.findById(userId).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json({ user });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};
exports.getProfile = getProfile;
