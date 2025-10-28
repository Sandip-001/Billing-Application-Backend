const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validateUserInput } = require("../utils/validate");
const User = require("../models/user");
require("dotenv").config();

// Register new user
const createUser = async (req, res) => {
  try {
    const errors = validateUserInput(req.body);
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    const { username, email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // Create token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "10d",
      }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: false, // set to true in production (HTTPS)
        maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
      })
      .status(201)
      .json({
        message: "User registered successfully",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        },
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get current user from cookie
const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token found" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "username", "email", "createdAt"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("Error getting user:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};


// Update user
const updateUser = async (req, res) => {
  try {
    const errors = validateUserInput(req.body, true);
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { username, email, password } = req.body;
    if (password) req.body.password = await bcrypt.hash(password, 10);

    await user.update(req.body);
    res.json({ message: "User updated successfully", user });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: err.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.destroy();
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "10d",
      }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: false,
        maxAge: 10 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: "Login successful",
        user: { id: user.id, username: user.username, email: user.email },
      });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const logoutUser = async (req, res) => {
  try {
    // Clear the auth token cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err.message);
    res.status(500).json({ message: "Server error during logout" });
  }
};

module.exports = {
  createUser,
  getCurrentUser,
  updateUser,
  deleteUser,
  loginUser,
  logoutUser,
};
