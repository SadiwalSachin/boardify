import express from "express";
import User from "../models/user.model.js";
import { verifyToken } from "../config/firebase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @route   POST /api/users/register
// @desc    Register a new user (Email/Password)
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log(`[AUTH] Register Request: ${email}`);

        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log(`[AUTH] Register Failed: User ${email} already exists`);
            return res.status(400).json({ error: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            displayName: name,
            email,
            password: hashedPassword,
        });

        if (user) {
            console.log(`[AUTH] Register Successful: ${email}`);
            res.status(201).json({
                _id: user._id,
                name: user.displayName,
                email: user.email,
                token: generateToken(user._id),
            });
        }
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: "Server error during registration" });
    }
});

// @route   POST /api/users/login
// @desc    Authenticate user & get token (Email/Password)
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[AUTH] Login Request: ${email}`);
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            console.log(`[AUTH] Login Successful: ${email}`);
            res.json({
                _id: user._id,
                name: user.displayName,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            console.log(`[AUTH] Login Failed: Invalid credentials for ${email}`);
            res.status(401).json({ error: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ error: "Server error during login" });
    }
});

// Sync user data after Firebase login (Google)
router.post("/sync", verifyToken, async (req, res) => {
    try {
        const { uid, email, name, picture } = req.user;
        console.log(`[AUTH] Sync Request: ${email} (Firebase UID: ${uid})`);

        const user = await User.findOneAndUpdate(
            { firebaseId: uid },
            {
                email,
                displayName: name,
                photoURL: picture,
                lastLogin: new Date()
            },
            { upsert: true, new: true }
        );
        console.log(`[AUTH] Sync Successful: ${email}`);

        res.status(200).json({
            message: "User synced successfully",
            user,
            token: generateToken(user._id) // Give them a backend token too for consistency
        });
    } catch (error) {
        console.error("Error syncing user:", error);
        res.status(500).json({ error: "Failed to sync user data" });
    }
});

export default router;
