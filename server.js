const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const https = require('https');

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
        raterName: String,
        score: Number,
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }],
    favorites: [{ type: String }], // Array of ad IDs (or static IDs)
    savedSearches: [{
        name: String,
        params: mongoose.Schema.Types.Mixed,
        createdAt: { type: Date, default: Date.now }
    }],
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
    comments: [{
        userId: String,
        username: String,
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

const Ad = mongoose.model('Ad', adSchema);

const messageSchema = new mongoose.Schema({
    adId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: false },
    imageUrl: { type: String, default: null },
    images: { type: [String], default: [] },
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

app.post('/api/auth/check-email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email.toLowerCase() });
        if (!user) return res.status(404).json({ message: 'Email nem található' });
        res.json({ exists: true });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ message: 'Felhasználó nem található' });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ message: 'Jelszó sikeresen módosítva' });
    } catch (err) { res.status(500).json({ message: err.message }); }
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

        // Limit images to 10
        if (adData.images && adData.images.length > 10) {
            return res.status(400).json({ message: 'Maximum 10 kép engedélyezett hirdetésenként.' });
        }

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

// Update Ad
app.patch('/api/ads/:id', authenticateToken, async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) return res.status(404).json({ message: 'Hirdetés nem található' });

        // Ownership check
        if (ad.owner && ad.owner.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Nincs jogosultságod a hirdetés módosításához' });
        }

        const adData = { ...req.body };

        // Limit images to 10
        if (adData.images && adData.images.length > 10) {
            return res.status(400).json({ message: 'Maximum 10 kép engedélyezett hirdetésenként.' });
        }

        // Clean up data
        delete adData.owner;
        delete adData.createdAt;

        Object.assign(ad, adData);
        const updatedAd = await ad.save();
        res.json(updatedAd);
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
        const { score, comment } = req.body; // 1 to 5
        if (score < 1 || score > 5) return res.status(400).json({ message: 'Érvénytelen pontszám' });

        const seller = await User.findById(req.params.id);
        if (!seller) return res.status(404).json({ message: 'Eladó nem található' });

        // Prevent self rating
        if (seller._id.toString() === req.user.userId) return res.status(400).json({ message: 'Saját magadat nem értékelheted' });

        seller.ratings.push({
            raterId: req.user.userId,
            raterName: req.user.username,
            score,
            comment: comment ? comment.trim() : ''
        });
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
        const user = await User.findById(req.params.id).select('username phone isVerified sellerRating totalRatings ratings createdAt');
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

// Post Ad Comment
app.post('/api/ads/:id/comment', authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length === 0) return res.status(400).json({ message: 'Üres komment' });

        const ad = await Ad.findById(req.params.id);
        if (!ad) return res.status(404).json({ message: 'Hirdetés nem található' });

        ad.comments.push({
            userId: req.user.userId,
            username: req.user.username,
            text: text.trim()
        });

        await ad.save();
        res.status(201).json({ message: 'Komment sikeresen hozzáadva', comments: ad.comments });
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

app.get('/api/messages/:adId/:otherPartyId', authenticateToken, async (req, res) => {
    try {
        const { adId, otherPartyId } = req.params;
        const myId = req.user.userId;
        
        console.log(`[API] Fetching messages: Ad=${adId}, Partner=${otherPartyId}, Me=${myId}`);

        if (!mongoose.Types.ObjectId.isValid(adId) || !mongoose.Types.ObjectId.isValid(otherPartyId)) {
             console.warn(`[API] Invalid IDs in fetch: Ad=${adId}, Partner=${otherPartyId}`);
             return res.json([]); 
        }

        const messages = await Message.find({
            adId: adId,
            $or: [
                { senderId: myId, receiverId: otherPartyId },
                { senderId: otherPartyId, receiverId: myId }
            ]
        }).populate('senderId', 'username').populate('receiverId', 'username').sort({ createdAt: 1 });
        
        console.log(`[API] Found ${messages.length} messages.`);
        res.json(messages);
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
        const { adId, receiverId, content, imageUrl, images } = req.body;
        const myId = req.user.userId;

        console.log(`[API] POST message: Ad=${adId}, Receiver=${receiverId}, Sender=${myId}`);

        if (!adId || !receiverId) {
             return res.status(400).json({ message: 'Missing adId or receiverId' });
        }

        const msg = new Message({
            adId,
            senderId: myId,
            receiverId,
            content: content || '',
            imageUrl,
            images: images || []
        });
        await msg.save();
        
        console.log(`[API] Message saved: ${msg._id}`);
        res.status(201).json(msg);
    } catch (err) {
        console.error(`[API] Message save ERROR:`, err);
        res.status(500).json({ message: err.message });
    }
});

// Mark messages as read
app.patch('/api/messages/read/:adId/:otherPartyId', authenticateToken, async (req, res) => {
    try {
        await Message.updateMany(
            {
                adId: req.params.adId,
                senderId: req.params.otherPartyId,
                receiverId: req.user.userId,
                isRead: false
            },
            { $set: { isRead: true } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete whole conversation
app.delete('/api/messages/conversation/:adId/:otherPartyId', authenticateToken, async (req, res) => {
    try {
        await Message.deleteMany({
            adId: req.params.adId,
            $or: [
                { senderId: req.user.userId, receiverId: req.params.otherPartyId },
                { senderId: req.params.otherPartyId, receiverId: req.user.userId }
            ]
        });
        res.json({ success: true, message: 'Beszélgetés törölve' });
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

// ===== SAVED SEARCHES ROUTES =====

// Get saved searches
app.get('/api/user/saved-searches', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        res.json({ savedSearches: user.savedSearches || [] });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching saved searches' });
    }
});

// Add saved search
app.post('/api/user/saved-searches', authenticateToken, async (req, res) => {
    const { name, params } = req.body;
    if (!name || !params) return res.status(400).json({ message: 'Name and params are required' });

    try {
        const user = await User.findById(req.user.userId);
        user.savedSearches.push({ name, params });
        await user.save();
        res.status(201).json({ message: 'Search saved successfully', savedSearches: user.savedSearches });
    } catch (err) {
        res.status(500).json({ message: 'Error saving search' });
    }
});

// Delete saved search
app.delete('/api/user/saved-searches/:id', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        user.savedSearches = user.savedSearches.filter(s => s._id.toString() !== req.params.id);
        await user.save();
        res.json({ message: 'Search deleted successfully', savedSearches: user.savedSearches });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting search' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
