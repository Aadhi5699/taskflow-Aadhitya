const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    let fields = {};

    if (!name) fields.name = 'is required';
    if (!email) fields.email = 'is required';
    if (!password) fields.password = 'is required';

    if (Object.keys(fields).length > 0) {
      return res.status(400).json({ error: 'validation failed', fields });
    }

    // Check existing
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'validation failed', fields: { email: 'already exists' } });
    }

    // Hash password (cost 12 as per instructions)
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await UserModel.create(name, email, passwordHash);

    // Gen Token (expires in 24h as per instructions)
    const token = jwt.sign(
      { user_id: user.id, email: user.email },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    let fields = {};

    if (!email) fields.email = 'is required';
    if (!password) fields.password = 'is required';

    if (Object.keys(fields).length > 0) {
       return res.status(400).json({ error: 'validation failed', fields });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Intentionally generic error for auth failures
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const token = jwt.sign(
      { user_id: user.id, email: user.email },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
