const express = require("express");
const router = express.Router();
const { createUser, loginUser, getCurrentUser, updateUser, deleteUser, logoutUser } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// Public
router.post("/register", createUser);
router.post("/login", loginUser);

// Protected
router.get("/me", authMiddleware, getCurrentUser);
router.put("/:id", authMiddleware, updateUser);
router.delete("/:id", authMiddleware, deleteUser);
router.post("/logout", authMiddleware, logoutUser);

module.exports = router;