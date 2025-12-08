// src/routes/auth.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../data/models/User';
import { validateSignup, validateLogin } from '../utils/validators';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Signup
router.post('/signup', async (req, res) => {
  const { error } = validateSignup(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { name, email, password, role } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(409).json({ error: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, passwordHash, role });
  await user.save();

  res.status(201).json({ message: 'User registered successfully' });
});

// Login
router.post('/login', async (req, res) => {
  const { error } = validateLogin(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

export default router;
