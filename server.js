const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const jwtSecret = process.env.JWT_SECRET || 'lunnar_secret_key_2026';
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(express.static(__dirname));

// Serve index.html for root access
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lunnar';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Ad Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    favorites: [{ type: String }], // Array of ad IDs (or static IDs)
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const adSchema = new mongoose.Schema({
    brand: String,
    model: String,
    year: Number,
    km: Number,
    fuel: String,
    transmission: String,
    bodyType: String,
    color: String,
    condition: String,
    hp: Number,
    ccm: Number,
    price: Number,
    city: String,
    phone: String,
    email: String,
    images: [String],
    description: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const Ad = mongoose.model('Ad', adSchema);

// ===== AUTH MIDDLEWARE =====
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Bejelentkezés szükséges' });

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.status(403).json({ message: 'Érvénytelen munkamenet' });
        req.user = user;
        next();
    });
};

// ===== AUTH ROUTES =====
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'Sikeres regisztráció!' });
    } catch (err) {
        res.status(400).json({ message: 'Regisztrációs hiba: lehet, hogy az email vagy felhasználónév már foglalt.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: 'Érvénytelen email vagy jelszó' });
        }
        const token = jwt.sign({ userId: user._id, username: user.username }, jwtSecret, { expiresIn: '7d' });
        res.json({ token, username: user.username, favorites: user.favorites });
    } catch (err) {
        res.status(500).json({ message: 'Szerver hiba a bejelentkezés során' });
    }
});

// Public Routes
app.get('/api/ads', async (req, res) => {
    try {
        const ads = await Ad.find({ status: 'approved' }).sort({ createdAt: -1 });
        res.json(ads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Ad (Auto-attach owner if logged in)
app.post('/api/ads', async (req, res) => {
    try {
        const adData = req.body;
        // Check for token manually or just parse headers
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, jwtSecret);
                adData.owner = decoded.userId;
            } catch (e) { /* invalid token, submit as guest */ }
        }
        const ad = new Ad(adData);
        const newAd = await ad.save();
        res.status(201).json(newAd);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// User Specific Routes
app.get('/api/user/ads', authenticateToken, async (req, res) => {
    try {
        const ads = await Ad.find({ owner: req.user.userId }).sort({ createdAt: -1 });
        res.json(ads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/user/favorites', authenticateToken, async (req, res) => {
    try {
        const { favorites } = req.body;
        await User.findByIdAndUpdate(req.user.userId, { favorites });
        res.json({ message: 'Kedvencek szinkronizálva' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Admin Routes (Simple implementation for now)
app.get('/api/admin/ads', async (req, res) => {
    try {
        const ads = await Ad.find().sort({ createdAt: -1 });
        res.json(ads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.patch('/api/admin/ads/:id', async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (req.body.status) ad.status = req.body.status;
        const updatedAd = await ad.save();
        res.json(updatedAd);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/admin/ads/:id', async (req, res) => {
    try {
        await Ad.findByIdAndDelete(req.params.id);
        res.json({ message: 'Hirdetés törölve' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
