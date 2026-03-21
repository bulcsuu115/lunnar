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

// Health check endpoint for cron jobs (heartbeat)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
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
    phone: { type: String },
    isVerified: { type: Boolean, default: false },
    sellerRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    ratings: [{
        raterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        score: Number,
        createdAt: { type: Date, default: Date.now }
    }],
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
    vin: String,
    views: { type: Number, default: 0 },
    favoritesCount: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    createdAt: { type: Date, default: Date.now }
});

const Ad = mongoose.model('Ad', adSchema);

const messageSchema = new mongoose.Schema({
    adId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

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
        const { username, email, password, phone } = req.body;
        console.log(`[AUTH] Regisztrációs kísérlet: ${username} (${email})`);
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword, phone });
        await user.save();
        console.log(`[AUTH] Sikeres regisztráció: ${username}`);
        res.status(201).json({ message: 'Sikeres regisztráció!' });
    } catch (err) {
        console.error('[AUTH] Regisztrációs hiba:', err.message);
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
        res.json({ 
            token, 
            username: user.username, 
            favorites: user.favorites,
            isVerified: user.isVerified,
            userId: user._id
        });
    } catch (err) {
        res.status(500).json({ message: 'Szerver hiba a bejelentkezés során' });
    }
});

// Public Routes
app.get('/api/ads', async (req, res) => {
    try {
        // Find approved ads, sort by isPremium first, then createdAt
        const ads = await Ad.find({ status: 'approved' }).sort({ isPremium: -1, createdAt: -1 });
        res.json(ads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Ad (Auto-attach owner if logged in)
app.post('/api/ads', async (req, res) => {
    try {
        console.log('[ADS] Új hirdetés beérkezés...');
        const adData = { ...req.body };

        // Remove fields that are not in the schema / could conflict with MongoDB
        delete adData.id;
        delete adData._id;
        delete adData.ownerId;
        delete adData.ownerEmail;

        // Check for token manually or just parse headers
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, jwtSecret);
                adData.owner = decoded.userId;
                console.log(`[ADS] Owner beállítva: ${decoded.userId}`);
            } catch (e) {
                console.warn('[ADS] Érvénytelen token, vendégként mentjük');
            }
        }

        // Force status to approved for immediate visibility
        adData.status = 'approved';

        console.log(`[ADS] Mentés: ${adData.brand} ${adData.model}, ár: ${adData.price}, képek: ${(adData.images || []).length} db`);
        const ad = new Ad(adData);
        const newAd = await ad.save();
        console.log(`[ADS] Sikeresen mentve! ID: ${newAd._id}`);
        res.status(201).json(newAd);
    } catch (err) {
        console.error('[ADS] HIBA a mentés során:', err.message);
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

// ===== NOVEL PREMIUM FEATURES APIS =====

// User verification (simulate SMS)
app.post('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.userId, { isVerified: true });
        res.json({ message: 'Fiók sikeresen hitelesítve!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Rate seller
app.post('/api/users/:id/rate', authenticateToken, async (req, res) => {
    try {
        const { score } = req.body; // 1 to 5
        if (score < 1 || score > 5) return res.status(400).json({ message: 'Érvénytelen pontszám' });
        
        const seller = await User.findById(req.params.id);
        if (!seller) return res.status(404).json({ message: 'Eladó nem található' });
        
        // Prevent self rating
        if (seller._id.toString() === req.user.userId) return res.status(400).json({ message: 'Saját magadat nem értékelheted' });

        seller.ratings.push({ raterId: req.user.userId, score });
        seller.totalRatings += 1;
        const totalScore = seller.ratings.reduce((acc, r) => acc + r.score, 0);
        seller.sellerRating = totalScore / seller.totalRatings;
        
        await seller.save();
        res.json({ message: 'Értékelés sikeresen mentve!', newRating: seller.sellerRating });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user profile summary
app.get('/api/users/:id/profile', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('username phone isVerified sellerRating totalRatings createdAt');
        if (!user) return res.status(404).json({ message: 'Felhasználó nem található' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Increment Ad views
app.post('/api/ads/:id/view', async (req, res) => {
    try {
        await Ad.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.json({ message: 'Views incremented' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Make Ad Premium (simulate payment)
app.post('/api/ads/:id/premium', authenticateToken, async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) return res.status(404).json({ message: 'Hirdetés nem található' });
        if (ad.owner && ad.owner.toString() !== req.user.userId) return res.status(403).json({ message: 'Nincs jogosultságod' });
        
        ad.isPremium = true;
        await ad.save();
        res.json({ message: 'Hirdetés kiemelve!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// User Stats for Dashboard
app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        const ads = await Ad.find({ owner: req.user.userId });
        const totalViews = ads.reduce((acc, ad) => acc + ad.views, 0);
        
        const adIds = ads.map(ad => ad._id.toString());
        const totalFavoritesResult = await User.aggregate([
            { $unwind: "$favorites" },
            { $match: { "favorites": { $in: adIds } } },
            { $count: "count" }
        ]);
        const totalFavorites = totalFavoritesResult.length > 0 ? totalFavoritesResult[0].count : 0;
        
        res.json({
            totalAds: ads.length,
            totalViews: totalViews,
            totalFavorites: totalFavorites
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Messaging
app.get('/api/messages/:adId', authenticateToken, async (req, res) => {
    try {
        const messages = await Message.find({ adId: req.params.adId }).sort({ createdAt: 1 });
        // Only return if user is sender or receiver - simple security check
        const relevantMessages = messages.filter(m => 
            m.senderId.toString() === req.user.userId || 
            m.receiverId.toString() === req.user.userId
        );
        res.json(relevantMessages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [{ senderId: req.user.userId }, { receiverId: req.user.userId }]
        }).populate('adId', 'brand model images views isPremium').populate('senderId', 'username').populate('receiverId', 'username').sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) {
         res.status(500).json({ message: err.message });
    }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { adId, receiverId, content } = req.body;
        const msg = new Message({
            adId,
            senderId: req.user.userId,
            receiverId,
            content
        });
        await msg.save();
        res.status(201).json(msg);
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
