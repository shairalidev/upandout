import { Router } from 'express';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ensureModels } from '../services/storage/db.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  name: Joi.string().min(1).max(80).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

router.post('/register', async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const { User } = await ensureModels();
  const existing = await User.findOne({ where: { email: value.email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(value.password, 10);
  const user = await User.create({ email: value.email, name: value.name, password_hash: hash });

  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '7d'
  });

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }
  });
});

router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const { User } = await ensureModels();
  const user = await User.findOne({ where: { email: value.email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(value.password, user.password_hash || '');
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '7d'
  });

  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});



router.get('/me', requireAuth, async (req, res) => {
  const { User } = await ensureModels();
  const user = await User.findByPk(req.user.id, { attributes: ['id','email','name','createdAt'] });
  res.json({ user });
});


export default router;
