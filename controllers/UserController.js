import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import UserModal from '../models/User.js';
import PostModel from '../models/Post.js';
import CommentModel from '../models/Comment.js';

import nodemailer from 'nodemailer';

export const register = async (req, res) => {
    try {
        const existingUser = await UserModal.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({
                message: 'Email already exists in the database.',
            });
        }

        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const doc = new UserModal({
            email: req.body.email,
            fullName: req.body.fullName,
            avatarUrl: req.body.avatarUrl,
            passwordHash: hash,
        });

        const user = await doc.save();

        const token = jwt.sign(
            {
                _id: user._id,
            },
            'secret123',
            {
                expiresIn: '30d',
            }
        );
        const { passwordHash, ...userData } = user._doc;

        res.json({ ...user._doc, token });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Failed to register',
        });
    }
};

export const login = async (req, res) => {
    try {
        const user = await UserModal.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({
                message: "User doesn't find",
            });
        }

        const isValidPass = await bcrypt.compare(
            req.body.password,
            user._doc.passwordHash
        );

        if (!isValidPass) {
            return res.status(400).json({
                message: 'Invalid login or password',
            });
        }

        const token = jwt.sign(
            {
                _id: user._id,
            },
            'secret123',
            {
                expiresIn: '30d',
            }
        );

        const { passwordHash, ...userData } = user._doc;

        res.json({ ...user._doc, token });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Failed to login',
        });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await UserModal.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                message: 'User doenst find',
            });
        }
        const { passwordHash, ...userData } = user._doc;
        // res.setHeader('Cache-Control', 'public, max-age=3600');
        res.json(userData);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: 'not',
        });
    }
};

export const update = async (req, res) => {
    const userId = req.params.id;
    const { fullName, email, avatarUrl } = req.body;

    try {
        let user = await UserModal.findByIdAndUpdate(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (fullName) {
            user.fullName = fullName;
        }
        if (email) {
            user.email = email;
        }

        if (avatarUrl) {
            user.avatarUrl = avatarUrl;
        }
        user = await user.save();

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update user' });
    }
};

export const passwordForgot = async (req, res) => {
    const { email } = req.body;

    if (!isValidEmail(email)) {
        return res.status(400).send({ error: 'Invalid email format.' });
    }

    try {
        const user = await UserModal.findOne({ email });

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        const token = generateResetToken(user._id);

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
        await user.save();

        sendResetEmail(email, token);

        res.send({ message: 'Password reset email sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to send password reset email.' });
    }
};

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const generateResetToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const sendResetEmail = async (email, token) => {
    try {
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        let mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Reset your password',
            text: `To reset your password, click on the following link: ${process.env.FRONTEND_URL}/reset-password/${token}`,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw new Error('Failed to send password reset email.');
    }
};

export const resetPassword = async (req, res) => {
    const { password, token } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || !decoded.userId) {
            return res.status(400).send({ error: 'Invalid token.' });
        }

        const user = await UserModal.findById(decoded.userId);
        if (!user) {
            return res.status(404).send({ error: 'User not found.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        user.passwordHash = hash;
        await user.save();

        res.send({ message: 'Password reset successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to reset password.' });
    }
};

export const removeUser = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const deletedUser = await UserModal.findOneAndDelete({ _id: userId });

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        await PostModel.deleteMany({ user: userId });
        await CommentModel.deleteMany({ user: userId });

        res.json({
            success: true,
        });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({
            message: 'Failed to delete account',
        });
    }
};
