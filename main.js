// =============================================
// LUNNAR — Main Application Logic
// Dark futuristic theme + AutoScout24 functions
// =============================================

// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
let isLightMode = localStorage.getItem('lunnarTheme') === 'light';

if (isLightMode) {
    body.classList.add('light-mode');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    isLightMode = body.classList.contains('light-mode');
    localStorage.setItem('lunnarTheme', isLightMode ? 'light' : 'dark');
});

let width = window.innerWidth;
let height = window.innerHeight;

// ===== STARFIELD =====
const starCanvas = document.getElementById('starfield');
const starCtx = starCanvas ? starCanvas.getContext('2d') : null;
let stars = [];
const STAR_COUNT = 400;
let baseSpeed = 0.08;
let warpSpeed = 0.08;

class Star {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * width;
        this.size = 0.5 + Math.random();
        this.opacity = 0.2 + Math.random() * 0.8;
    }
    update() {
        this.z -= (warpSpeed * 50);
        if (this.z <= 0) { this.reset(); this.z = width; }
    }
    draw() {
        if (!starCtx) return;
        const starColor = isLightMode ? `rgba(148, 163, 184, ${this.opacity * 0.15})` : `rgba(255, 255, 255, ${this.opacity})`;

        const x = (this.x - width / 2) * (width / this.z) + width / 2;
        const y = (this.y - height / 2) * (width / this.z) + height / 2;
        const s = this.size * (width / this.z);
        if (x < 0 || x > width || y < 0 || y > height) return;

        starCtx.fillStyle = starColor;
        // Optimization: Use fillRect for small stars instead of arc for better performance
        if (s < 1.5) {
            starCtx.fillRect(x - s / 2, y - s / 2, s, s);
        } else {
            starCtx.beginPath();
            starCtx.arc(x, y, s, 0, Math.PI * 2);
            starCtx.fill();
        }
    }
}

function initStars() {
    if (!starCanvas) return;
    resizeStarCanvas();
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) stars.push(new Star());
    animateStars();
}

function resizeStarCanvas() {
    if (!starCanvas) return;
    const hero = document.getElementById('hero');
    if (!hero) return;
    width = hero.offsetWidth || window.innerWidth;
    height = hero.offsetHeight || window.innerHeight;
    starCanvas.width = width;
    starCanvas.height = height;
}

let heroRectCache = null;
let starOpacity = 1;
const heroEl = document.getElementById('hero');

function updateHeroRect() {
    if (heroEl) heroRectCache = heroEl.getBoundingClientRect();
}
window.addEventListener('scroll', () => {
    // Only update rect if hero is likely near viewport
    if (window.scrollY < (height + 200)) updateHeroRect();
}, { passive: true });

function animateStars() {
    if (!starCanvas || !starCtx || !heroEl) return;

    // Use cached rect or initial rect if null
    if (!heroRectCache) updateHeroRect();
    const rect = heroRectCache;

    if (rect && rect.bottom > 0) {
        const newOpacity = Math.max(0, Math.min(1, rect.bottom / height));
        // Only update DOM opacity if it changed significantly
        if (Math.abs(starOpacity - newOpacity) > 0.01) {
            starOpacity = newOpacity;
            starCanvas.style.opacity = starOpacity;
        }

        starCtx.clearRect(0, 0, width, height);
        stars.forEach(star => { star.update(); star.draw(); });
        warpSpeed += (baseSpeed - warpSpeed) * 0.05;
    }
    requestAnimationFrame(animateStars);
}

window.addEventListener('wheel', (e) => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    if (rect.bottom > 0) {
        warpSpeed = Math.min(2, warpSpeed + Math.abs(e.deltaY) * 0.01);
    }
});

// Scroll logic that would break the page removed here
// Stats & General Reveal System
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');

            // If it's the stats grid, trigger counter animation
            if (entry.target.classList.contains('stats-grid')) {
                const values = entry.target.querySelectorAll('.stat-value');
                values.forEach(val => animateCounter(val));
            }
        }
    });
}, { threshold: 0.2 });

function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();

    function step(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const current = Math.floor(progress * (target - start) + start);
        el.textContent = current.toLocaleString();
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = target.toLocaleString();
        }
    }
    requestAnimationFrame(step);
}

document.addEventListener('DOMContentLoaded', () => {
    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) revealObserver.observe(statsGrid);

    // Add other sections to observe
    document.querySelectorAll('section').forEach(section => {
        if (section.id !== 'hero') revealObserver.observe(section);
    });
});


// ===== MOUSE LIGHT =====
let mouseX = 0, mouseY = 0;
let mouseUpdatePending = false;
const mouseLight = document.getElementById('mouse-light');

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!mouseUpdatePending) {
        mouseUpdatePending = true;
        requestAnimationFrame(() => {
            if (mouseLight) {
                // Direct transform is much faster than updating global CSS variables
                mouseLight.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%))`;
            } else {
                // Fallback for CSS variable based implementation
                document.documentElement.style.setProperty('--mouse-x', `${(mouseX / width) * 100}%`);
                document.documentElement.style.setProperty('--mouse-y', `${(mouseY / height) * 100}%`);
            }
            mouseUpdatePending = false;
        });
    }
}, { passive: true });

// ===== TYPING EFFECT =====
const subtitleText = "A tökéletes használt autó megtalálása még sosem volt ilyen egyszerű.";
function typeSubtitle() {
    const el = document.getElementById('hero-subtitle');
    if (!el) return;
    let i = 0;
    el.innerHTML = "";
    function type() {
        if (i < subtitleText.length) {
            el.innerHTML += subtitleText.charAt(i);
            i++;
            setTimeout(type, 40);
        }
    }
    type();
}

// ===== NEURAL NETWORK VISUAL =====
let neuralCanvas, nctx, particles = [];
function initNeural() {
    neuralCanvas = document.getElementById('neural-canvas');
    if (!neuralCanvas) return;
    nctx = neuralCanvas.getContext('2d');
    resizeNeural();
    particles = [];
    // Reduce particle count from 80 to 50 for smoother performance
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * neuralCanvas.width,
            y: Math.random() * neuralCanvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        });
    }
    animateNeural();
}

function resizeNeural() {
    if (!neuralCanvas) return;
    neuralCanvas.width = neuralCanvas.offsetWidth;
    neuralCanvas.height = neuralCanvas.offsetHeight;
}

function animateNeural() {
    if (!neuralCanvas) return;

    // Performance: Only clear and redraw if the canvas is actually visible/in the DOM
    if (neuralCanvas.offsetParent === null) {
        requestAnimationFrame(animateNeural);
        return;
    }

    nctx.clearRect(0, 0, neuralCanvas.width, neuralCanvas.height);
    nctx.strokeStyle = isLightMode ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)";
    nctx.fillStyle = isLightMode ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)";

    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > neuralCanvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > neuralCanvas.height) p.vy *= -1;

        nctx.fillRect(p.x - 1, p.y - 1, 2, 2);

        // Optimization: Only check connections for every 2nd particle to reduce O(n^2) burden
        if (i % 2 === 0) {
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                // Quick distance check before hypot (optimization)
                if (Math.abs(dx) < 100 && Math.abs(dy) < 100) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        nctx.lineWidth = 1 - dist / 100;
                        nctx.beginPath();
                        nctx.moveTo(p.x, p.y);
                        nctx.lineTo(p2.x, p2.y);
                        nctx.stroke();
                    }
                }
            }
        }
    });
    requestAnimationFrame(animateNeural);
}

// ================================================================
// ===== CAR MARKETPLACE DATA & LOGIC =====
// ================================================================

const BRANDS_DATA = {
    'Alfa Romeo': { logo: 'https://www.car-logos.org/wp-content/uploads/2011/09/alfa_romeo.png', models: ['145', '146', '147', '155', '156', '159', '164', '166', '4C', 'Brera', 'Giulia', 'Giulietta', 'GT', 'GTV', 'MiTo', 'Spider', 'Stelvio', 'Tonale'] },
    'Aston Martin': { logo: 'https://cdn.simpleicons.org/astonmartin/white', models: ['DB7', 'DB9', 'DB11', 'DBS', 'DBS Superleggera', 'DBX', 'Rapide', 'V8 Vantage', 'V12 Vantage', 'Vanquish', 'Vantage', 'Virage'] },
    'Audi': { logo: 'https://cdn.simpleicons.org/audi/white', models: ['A1', 'A2', 'A3', 'A4', 'A4 Allroad', 'A5', 'A6', 'A6 Allroad', 'A7', 'A8', 'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'Q8 e-tron', 'R8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'RS Q3', 'RS Q8', 'S1', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'SQ2', 'SQ5', 'SQ7', 'SQ8', 'TT', 'TTS', 'TT RS', 'e-tron', 'e-tron GT'] },
    'Bentley': { logo: 'https://cdn.simpleicons.org/bentley/white', models: ['Arnage', 'Azure', 'Bentayga', 'Continental GT', 'Continental GTC', 'Continental Flying Spur', 'Flying Spur', 'Mulsanne'] },
    'BMW': { logo: 'https://cdn.simpleicons.org/bmw/white', models: ['114', '116', '118', '120', '123', '125', '128ti', '130', '135', '214', '216', '218', '220', '225', '228', '230', '235', 'M235', '316', '318', '320', '323', '325', '328', '330', '335', '340', 'M340', '418', '420', '425', '428', '430', '435', '440', 'M440', '518', '520', '523', '525', '528', '530', '535', '540', '545', '550', 'M550', '630', '635', '640', '650', '725', '728', '730', '735', '740', '745', '750', '760', '840', '850', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'XM', 'Z3', 'Z4', 'Z8', 'i3', 'i4', 'i5', 'i7', 'i8', 'iX', 'iX1', 'iX3'] },
    'BYD': { logo: 'https://cdn.simpleicons.org/byd/white', models: ['Atto 3', 'Dolphin', 'Han', 'Seal', 'Seal U', 'Tang'] },
    'Cadillac': { logo: 'https://cdn.simpleicons.org/cadillac/white', models: ['ATS', 'BLS', 'CT4', 'CT5', 'CTS', 'DeVille', 'Eldorado', 'Escalade', 'Lyriq', 'Seville', 'SRX', 'STS', 'XT4', 'XT5', 'XT6', 'XTS'] },
    'Chevrolet': { logo: 'https://cdn.simpleicons.org/chevrolet/white', models: ['Aveo', 'Blazer', 'Camaro', 'Captiva', 'Colorado', 'Corvette', 'Cruze', 'Epica', 'Equinox', 'Impala', 'Kalos', 'Lacetti', 'Malibu', 'Matiz', 'Nubira', 'Orlando', 'Silverado', 'Spark', 'Suburban', 'Tahoe', 'Tracker', 'Trailblazer', 'Trax'] },
    'Chrysler': { logo: 'https://cdn.simpleicons.org/chrysler/white', models: ['200', '300', '300C', 'Crossfire', 'Grand Voyager', 'Neon', 'Pacifica', 'PT Cruiser', 'Sebring', 'Town & Country', 'Voyager'] },
    'Citroën': { logo: 'https://cdn.simpleicons.org/citroen/white', models: ['AX', 'Berlingo', 'BX', 'C-Crosser', 'C-Elysée', 'C-Zero', 'C1', 'C2', 'C3', 'C3 Aircross', 'C3 Picasso', 'C4', 'C4 Aircross', 'C4 Cactus', 'C4 Picasso', 'C4 SpaceTourer', 'C5', 'C5 Aircross', 'C5 X', 'C6', 'C8', 'DS3', 'DS4', 'DS5', 'Grand C4 Picasso', 'Grand C4 SpaceTourer', 'Jumper', 'Jumpy', 'Nemo', 'Saxo', 'SpaceTourer', 'Xantia', 'XM', 'Xsara', 'Xsara Picasso', 'ZX', 'ë-C4'] },
    'Cupra': { logo: 'https://cdn.simpleicons.org/cupra/white', models: ['Ateca', 'Born', 'Formentor', 'Leon', 'Tavascan'] },
    'Dacia': { logo: 'https://cdn.simpleicons.org/dacia/white', models: ['Dokker', 'Duster', 'Jogger', 'Lodgy', 'Logan', 'Logan MCV', 'Sandero', 'Sandero Stepway', 'Solenza', 'Spring'] },
    'Daewoo': { logo: 'https://cdn.simpleicons.org/daewoo/white', models: ['Espero', 'Evanda', 'Kalos', 'Lacetti', 'Lanos', 'Leganza', 'Matiz', 'Nexia', 'Nubira', 'Tacuma'] },
    'Daihatsu': { logo: 'https://cdn.simpleicons.org/daihatsu/white', models: ['Applause', 'Charade', 'Copen', 'Cuore', 'Feroza', 'Gran Move', 'Materia', 'Move', 'Rocky', 'Sirion', 'Terios', 'Trevis', 'YRV'] },
    'Dodge': { logo: 'https://cdn.simpleicons.org/dodge/white', models: ['Avenger', 'Caliber', 'Challenger', 'Charger', 'Dakota', 'Dart', 'Durango', 'Grand Caravan', 'Journey', 'Nitro', 'Ram', 'Viper'] },
    'DS': { logo: 'https://cdn.simpleicons.org/citroen/white', models: ['DS 3', 'DS 3 Crossback', 'DS 4', 'DS 4 Cross', 'DS 5', 'DS 7', 'DS 7 Crossback', 'DS 9'] },
    'Ferrari': { logo: 'https://cdn.simpleicons.org/ferrari/white', models: ['296 GTB', '296 GTS', '348', '360', '430', '456', '458 Italia', '458 Spider', '488 GTB', '488 Pista', '488 Spider', '512', '550', '575M', '599 GTB', '612 Scaglietti', '812 GTS', '812 Superfast', 'California', 'F12', 'F355', 'F430', 'F8 Tributo', 'FF', 'GTC4Lusso', 'LaFerrari', 'Portofino', 'Purosangue', 'Roma', 'SF90'] },
    'Fiat': { logo: 'https://cdn.simpleicons.org/fiat/white', models: ['124 Spider', '126', '500', '500C', '500e', '500L', '500X', '600', 'Barchetta', 'Brava', 'Bravo', 'Cinquecento', 'Coupé', 'Croma', 'Doblò', 'Ducato', 'Fiorino', 'Freemont', 'Grande Punto', 'Idea', 'Linea', 'Marea', 'Multipla', 'Palio', 'Panda', 'Punto', 'Punto Evo', 'Qubo', 'Scudo', 'Sedici', 'Seicento', 'Stilo', 'Talento', 'Tipo', 'Ulysse', 'Uno'] },
    'Ford': { logo: 'https://cdn.simpleicons.org/ford/white', models: ['B-Max', 'Bronco', 'C-Max', 'Capri', 'Cougar', 'EcoSport', 'Edge', 'Escort', 'Explorer', 'F-150', 'Fiesta', 'Focus', 'Focus C-Max', 'Focus CC', 'Focus ST', 'Fusion', 'Galaxy', 'Granada', 'Grand C-Max', 'Ka', 'Ka+', 'Kuga', 'Maverick', 'Mondeo', 'Mustang', 'Mustang Mach-E', 'Orion', 'Probe', 'Puma', 'Ranger', 'S-Max', 'Scorpio', 'Sierra', 'Streetka', 'Tourneo Connect', 'Tourneo Courier', 'Tourneo Custom', 'Transit', 'Transit Connect', 'Transit Courier', 'Transit Custom'] },
    'Genesis': { logo: 'https://cdn.simpleicons.org/genesis/white', models: ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'] },
    'Honda': { logo: 'https://cdn.simpleicons.org/honda/white', models: ['Accord', 'Civic', 'Civic Type R', 'Concerto', 'CR-V', 'CR-Z', 'CRX', 'e', 'FR-V', 'HR-V', 'Insight', 'Integra', 'Jazz', 'Legend', 'Logo', 'NSX', 'Prelude', 'S2000', 'Shuttle', 'Stream', 'ZR-V'] },
    'Hyundai': { logo: 'https://cdn.simpleicons.org/hyundai/white', models: ['Accent', 'Atos', 'Atos Prime', 'Bayon', 'Coupe', 'Elantra', 'Galloper', 'Genesis', 'Getz', 'Grandeur', 'H-1', 'H-1 Starex', 'H-100', 'H350', 'i10', 'i20', 'i20 N', 'i30', 'i30 N', 'i40', 'Ioniq', 'Ioniq 5', 'Ioniq 5 N', 'Ioniq 6', 'ix20', 'ix35', 'ix55', 'Kona', 'Kona Electric', 'Lantra', 'Matrix', 'Pony', 'Santa Fe', 'Santamo', 'Sonata', 'Staria', 'Terracan', 'Trajet', 'Tucson', 'Veloster', 'Venue'] },
    'Infiniti': { logo: 'https://cdn.simpleicons.org/infiniti/white', models: ['EX', 'FX', 'G', 'M', 'Q30', 'Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX55', 'QX60', 'QX70', 'QX80'] },
    'Isuzu': { logo: 'https://cdn.simpleicons.org/isuzu/white', models: ['D-Max', 'Trooper'] },
    'Jaguar': { logo: 'https://cdn.simpleicons.org/jaguar/white', models: ['E-Pace', 'F-Pace', 'F-Type', 'I-Pace', 'S-Type', 'X-Type', 'XE', 'XF', 'XJ', 'XJ6', 'XJ8', 'XJR', 'XK', 'XK8', 'XKR'] },
    'Jeep': { logo: 'https://cdn.simpleicons.org/jeep/white', models: ['Avenger', 'Cherokee', 'Commander', 'Compass', 'Gladiator', 'Grand Cherokee', 'Liberty', 'Patriot', 'Renegade', 'Wrangler'] },
    'Kia': { logo: 'https://cdn.simpleicons.org/kia/white', models: ['Besta', 'Carens', 'Carnival', 'Ceed', 'Ceed GT', 'Cerato', 'EV6', 'EV9', 'Joice', 'Magentis', 'Niro', 'Niro EV', 'Opirus', 'Optima', 'Picanto', 'Pregio', 'Pride', 'ProCeed', 'Retona', 'Rio', 'Sephia', 'Shuma', 'Sorento', 'Soul', 'Sportage', 'Stinger', 'Stonic', 'Venga', 'XCeed'] },
    'Lada': { logo: 'https://cdn.simpleicons.org/lada/white', models: ['Granta', 'Kalina', 'Largus', 'Niva', 'Priora', 'Samara', 'Vesta', 'XRAY'] },
    'Lamborghini': { logo: 'https://cdn.simpleicons.org/lamborghini/white', models: ['Aventador', 'Countach', 'Diablo', 'Gallardo', 'Huracán', 'Murciélago', 'Revuelto', 'Urus'] },
    'Lancia': { logo: 'https://cdn.simpleicons.org/lancia/white', models: ['Delta', 'Lybra', 'Musa', 'Phedra', 'Thesis', 'Voyager', 'Ypsilon'] },
    'Land Rover': { logo: 'https://cdn.simpleicons.org/landrover/white', models: ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Freelander 2', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'] },
    'Lexus': { logo: 'https://cdn.simpleicons.org/lexus/white', models: ['CT', 'ES', 'GS', 'GX', 'IS', 'LC', 'LS', 'LX', 'NX', 'RC', 'RC F', 'RX', 'RZ', 'SC', 'UX'] },
    'Lincoln': { logo: 'https://cdn.simpleicons.org/lincoln/white', models: ['Aviator', 'Continental', 'Corsair', 'MKC', 'MKS', 'MKT', 'MKX', 'MKZ', 'Nautilus', 'Navigator', 'Town Car'] },
    'Maserati': { logo: 'https://cdn.simpleicons.org/maserati/white', models: ['Ghibli', 'GranCabrio', 'GranTurismo', 'Grecale', 'Levante', 'MC20', 'Quattroporte'] },
    'Mazda': { logo: 'https://cdn.simpleicons.org/mazda/white', models: ['2', '3', '5', '6', '121', '323', '323 F', '626', 'B-Series', 'BT-50', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-7', 'CX-9', 'Demio', 'MPV', 'MX-3', 'MX-5', 'MX-6', 'MX-30', 'Premacy', 'RX-7', 'RX-8', 'Tribute', 'Xedos 6', 'Xedos 9'] },
    'Mercedes': { logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyNGExMiAxMiAwIDEgMCAwLTI0IDEyIDEyIDAgMCAwIDAgMjR6bTAtMjMuNDQzYTExLjQ0MyAxMS40NDMgMCAxIDEgMCAyMi44ODYgMTEuNDQzIDExLjA2MyAwIDAgMSAwLTIyLjg4NnptLS4yODYgNS42MnY2LjYyMWwtNS43MzMgMy4zMWEuMjg2LjI4NiAwIDAgMCAuMTQ0LjUyNC4yOC4yOCAwIDAgMCAuMTQyLS4wMzhMMTIgMTMuMDZsNS43MzMgMy4zYS4yODYuMjg2IDAgMCAwIC40MjgtLjI0OGMwLS4wOTgtLjA1MS0uMTktLjE0Mi0uMjM4bC01LjczMy0zLjMxVjUuNzk3YS4yODYuMjg2IDAgMCAwLS41NzEgMHoiLz48L3N2Zz4=', models: ['A 140', 'A 150', 'A 160', 'A 170', 'A 180', 'A 190', 'A 200', 'A 210', 'A 220', 'A 250', 'A 35 AMG', 'A 45 AMG', 'B 150', 'B 160', 'B 170', 'B 180', 'B 200', 'B 220', 'B 250', 'C 160', 'C 180', 'C 200', 'C 220', 'C 230', 'C 240', 'C 250', 'C 270', 'C 280', 'C 300', 'C 320', 'C 350', 'C 400', 'C 43 AMG', 'C 63 AMG', 'CL 500', 'CL 600', 'CLA 180', 'CLA 200', 'CLA 220', 'CLA 250', 'CLA 35 AMG', 'CLA 45 AMG', 'CLK 200', 'CLK 230', 'CLK 270', 'CLK 320', 'CLS 250', 'CLS 320', 'CLS 350', 'CLS 400', 'CLS 500', 'CLS 53 AMG', 'CLS 63 AMG', 'E 200', 'E 220', 'E 230', 'E 240', 'E 250', 'E 270', 'E 280', 'E 290', 'E 300', 'E 320', 'E 350', 'E 400', 'E 420', 'E 430', 'E 450', 'E 500', 'E 53 AMG', 'E 55 AMG', 'E 63 AMG', 'G 270', 'G 300', 'G 320', 'G 350', 'G 400', 'G 500', 'G 55 AMG', 'G 63 AMG', 'GL 320', 'GL 350', 'GL 420', 'GL 450', 'GL 500', 'GLA 180', 'GLA 200', 'GLA 220', 'GLA 250', 'GLA 35 AMG', 'GLA 45 AMG', 'GLB 180', 'GLB 200', 'GLB 220', 'GLB 250', 'GLC 200', 'GLC 220', 'GLC 250', 'GLC 300', 'GLC 350', 'GLC 43 AMG', 'GLC 63 AMG', 'GLE 250', 'GLE 300', 'GLE 350', 'GLE 400', 'GLE 450', 'GLE 500', 'GLE 53 AMG', 'GLE 63 AMG', 'GLK 200', 'GLK 220', 'GLK 250', 'GLK 320', 'GLK 350', 'GLS 350', 'GLS 400', 'GLS 450', 'GLS 500', 'GLS 580', 'GLS 63 AMG', 'ML 230', 'ML 270', 'ML 280', 'ML 300', 'ML 320', 'ML 350', 'ML 400', 'ML 420', 'ML 430', 'ML 450', 'ML 500', 'ML 55 AMG', 'ML 63 AMG', 'R 280', 'R 300', 'R 320', 'R 350', 'R 500', 'S 250', 'S 280', 'S 300', 'S 320', 'S 350', 'S 400', 'S 420', 'S 430', 'S 450', 'S 500', 'S 550', 'S 560', 'S 580', 'S 600', 'S 63 AMG', 'S 65 AMG', 'SL 280', 'SL 300', 'SL 320', 'SL 350', 'SL 380', 'SL 400', 'SL 420', 'SL 450', 'SL 500', 'SL 560', 'SL 600', 'SL 63 AMG', 'SL 65 AMG', 'SLC 180', 'SLC 200', 'SLC 300', 'SLK 200', 'SLK 230', 'SLK 250', 'SLK 280', 'SLK 300', 'SLK 320', 'SLK 350', 'SLK 55 AMG', 'V 200', 'V 220', 'V 230', 'V 250', 'V 300', 'Vito', 'X 220', 'X 250', 'X 350', 'EQA', 'EQB', 'EQC', 'EQE', 'EQE SUV', 'EQS', 'EQS SUV', 'EQV'] },
    'MG': { logo: 'https://cdn.simpleicons.org/mg/white', models: ['3', '4', '5', 'EHS', 'HS', 'Marvel R', 'MG4', 'MG5', 'ZS', 'ZS EV'] },
    'Mini': { logo: 'https://cdn.simpleicons.org/mini/white', models: ['Cabrio', 'Clubman', 'Cooper', 'Cooper D', 'Cooper S', 'Cooper SD', 'Cooper SE', 'Countryman', 'Coupé', 'John Cooper Works', 'One', 'One D', 'Paceman', 'Roadster'] },
    'Mitsubishi': { logo: 'https://cdn.simpleicons.org/mitsubishi/white', models: ['ASX', 'Carisma', 'Colt', 'Eclipse', 'Eclipse Cross', 'Galant', 'Grandis', 'i-MiEV', 'L200', 'Lancer', 'Lancer Evo', 'Outlander', 'Outlander PHEV', 'Pajero', 'Pajero Pinin', 'Pajero Sport', 'Space Runner', 'Space Star', 'Space Wagon'] },
    'Nissan': { logo: 'https://cdn.simpleicons.org/nissan/white', models: ['350Z', '370Z', 'Almera', 'Almera Tino', 'Ariya', 'Cabstar', 'e-NV200', 'GT-R', 'Interstar', 'Juke', 'King Cab', 'Leaf', 'Maxima', 'Micra', 'Murano', 'Navara', 'Note', 'NP300', 'NV200', 'NV300', 'NV400', 'Pathfinder', 'Patrol', 'Pixo', 'Primastar', 'Primera', 'Pulsar', 'Qashqai', 'Qashqai+2', 'Serena', 'Sunny', 'Terrano', 'Tiida', 'Townstar', 'X-Trail', 'Z'] },
    'Opel': { logo: 'https://cdn.simpleicons.org/opel/white', models: ['Adam', 'Agila', 'Ampera', 'Ampera-e', 'Antara', 'Ascona', 'Astra', 'Astra F', 'Astra G', 'Astra H', 'Astra J', 'Astra K', 'Astra L', 'Calibra', 'Cascada', 'Combo', 'Combo Life', 'Corsa', 'Corsa A', 'Corsa B', 'Corsa C', 'Corsa D', 'Corsa E', 'Corsa F', 'Corsa-e', 'Crossland', 'Crossland X', 'Frontera', 'Grandland', 'Grandland X', 'Insignia', 'Insignia A', 'Insignia B', 'Kadett', 'Karl', 'Meriva', 'Meriva A', 'Meriva B', 'Mokka', 'Mokka X', 'Mokka-e', 'Monterey', 'Movano', 'Omega', 'Signum', 'Sintra', 'Tigra', 'Vectra', 'Vectra A', 'Vectra B', 'Vectra C', 'Vivaro', 'Zafira', 'Zafira A', 'Zafira B', 'Zafira C', 'Zafira Life', 'Zafira-e Life'] },
    'Peugeot': { logo: 'https://cdn.simpleicons.org/peugeot/white', models: ['104', '106', '107', '108', '1007', '204', '205', '206', '206+', '207', '208', '208 e', '2008', '2008 e', '301', '304', '305', '306', '307', '308', '309', '3008', '404', '405', '406', '407', '408', '4007', '4008', '504', '505', '508', '508 PSE', '5008', '604', '605', '607', '806', '807', 'Bipper', 'Boxer', 'Expert', 'Ion', 'Partner', 'RCZ', 'Rifter', 'Traveller'] },
    'Polestar': { logo: 'https://cdn.simpleicons.org/polestar/white', models: ['1', '2', '3', '4'] },
    'Porsche': { logo: 'https://cdn.simpleicons.org/porsche/white', models: ['356', '718 Boxster', '718 Cayman', '718 Spyder', '911 Carrera', '911 GT3', '911 GT3 RS', '911 Targa', '911 Turbo', '911 Turbo S', '924', '928', '944', '968', 'Boxster', 'Cayenne', 'Cayenne Coupé', 'Cayman', 'Macan', 'Panamera', 'Taycan', 'Taycan Cross Turismo'] },
    'Renault': { logo: 'https://cdn.simpleicons.org/renault/white', models: ['Alaskan', 'Arkana', 'Austral', 'Avantime', 'Captur', 'Clio', 'Clio I', 'Clio II', 'Clio III', 'Clio IV', 'Clio V', 'Espace', 'Express', 'Fluence', 'Grand Espace', 'Grand Scenic', 'Kadjar', 'Kangoo', 'Koleos', 'Laguna', 'Laguna I', 'Laguna II', 'Laguna III', 'Latitude', 'Master', 'Megane', 'Megane I', 'Megane II', 'Megane III', 'Megane IV', 'Megane E-Tech', 'Modus', 'Rafale', 'Safrane', 'Scenic', 'Scenic I', 'Scenic II', 'Scenic III', 'Scenic IV', 'Symbol', 'Talisman', 'Thalia', 'Trafic', 'Twingo', 'Twingo I', 'Twingo II', 'Twingo III', 'Twizy', 'Vel Satis', 'Wind', 'Zoe'] },
    'Saab': { logo: 'https://cdn.simpleicons.org/saab/white', models: ['9-3', '9-3X', '9-5', '9-7X', '900', '9000'] },
    'SEAT': { logo: 'https://cdn.simpleicons.org/seat/white', models: ['Alhambra', 'Altea', 'Altea XL', 'Arona', 'Arosa', 'Ateca', 'Cordoba', 'Exeo', 'Ibiza', 'Leon', 'Leon ST', 'Mii', 'Tarraco', 'Toledo'] },
    'Škoda': { logo: 'https://cdn.simpleicons.org/skoda/white', models: ['Citigo', 'Elroq', 'Enyaq', 'Enyaq Coupé', 'Enyaq iV', 'Epiq', 'Fabia', 'Fabia I', 'Fabia II', 'Fabia III', 'Fabia IV', 'Felicia', 'Forman', 'Kamiq', 'Karoq', 'Kodiaq', 'Kushaq', 'Octavia', 'Octavia I', 'Octavia II', 'Octavia III', 'Octavia IV', 'Octavia RS', 'Praktik', 'Rapid', 'Roomster', 'Scala', 'Slavia', 'Superb', 'Superb I', 'Superb II', 'Superb III', 'Yeti'] },
    'Smart': { logo: 'https://cdn.simpleicons.org/smart/white', models: ['Forfour', 'Fortwo', 'Fortwo Cabrio', 'Roadster', '#1', '#3'] },
    'SsangYong': { logo: 'https://cdn.simpleicons.org/ssangyong/white', models: ['Actyon', 'Actyon Sports', 'Korando', 'Kyron', 'Musso', 'Rexton', 'Rodius', 'Tivoli', 'Torres', 'XLV'] },
    'Subaru': { logo: 'https://cdn.simpleicons.org/subaru/white', models: ['BRZ', 'Crosstrek', 'Forester', 'Impreza', 'Impreza WRX', 'Justy', 'Legacy', 'Levorg', 'Outback', 'Solterra', 'SVX', 'Trezia', 'WRX', 'XV'] },
    'Suzuki': { logo: 'https://cdn.simpleicons.org/suzuki/white', models: ['Across', 'Alto', 'Baleno', 'Cappuccino', 'Carry', 'Celerio', 'Grand Vitara', 'Ignis', 'Jimny', 'Kizashi', 'Liana', 'Samurai', 'S-Cross', 'Splash', 'Swift', 'SX4', 'SX4 S-Cross', 'Vitara', 'Wagon R+', 'XL7'] },
    'Tesla': { logo: 'https://cdn.simpleicons.org/tesla/white', models: ['Cybertruck', 'Model 3', 'Model S', 'Model X', 'Model Y', 'Roadster'] },
    'Toyota': { logo: 'https://cdn.simpleicons.org/toyota/white', models: ['4-Runner', 'Auris', 'Avensis', 'Aygo', 'Aygo X', 'bZ4X', 'C-HR', 'Camry', 'Celica', 'Corolla', 'Corolla Cross', 'Corolla Verso', 'GR86', 'GR Supra', 'GR Yaris', 'GT86', 'Hiace', 'Highlander', 'Hilux', 'IQ', 'Land Cruiser', 'Mirai', 'MR2', 'Paseo', 'Picnic', 'Previa', 'Prius', 'Prius Plus', 'Proace', 'Proace City', 'Proace City Verso', 'RAV4', 'Starlet', 'Supra', 'Urban Cruiser', 'Verso', 'Verso-S', 'Yaris', 'Yaris Cross', 'Yaris Verso'] },
    'Volkswagen': { logo: 'https://cdn.simpleicons.org/volkswagen/white', models: ['Amarok', 'Arteon', 'Beetle', 'Bora', 'Caddy', 'CC', 'Corrado', 'Crafter', 'e-Golf', 'e-Up!', 'Eos', 'Fox', 'Golf I', 'Golf II', 'Golf III', 'Golf IV', 'Golf V', 'Golf VI', 'Golf VII', 'Golf VIII', 'Golf', 'Golf GTI', 'Golf R', 'Golf Plus', 'Golf Sportsvan', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'ID.Buzz', 'Jetta', 'Lupo', 'Multivan', 'New Beetle', 'Passat B1', 'Passat B2', 'Passat B3', 'Passat B4', 'Passat B5', 'Passat B6', 'Passat B7', 'Passat B8', 'Passat CC', 'Passat', 'Phaeton', 'Polo', 'Polo GTI', 'Scirocco', 'Sharan', 'T-Cross', 'T-Roc', 'T-Roc R', 'Taigo', 'Tiguan', 'Tiguan Allspace', 'Touareg', 'Touran', 'Transporter', 'Up!'] },
    'Volvo': { logo: 'https://cdn.simpleicons.org/volvo/white', models: ['240', '340', '440', '460', '480', '740', '760', '850', '940', '960', 'C30', 'C40', 'C70', 'EX30', 'EX90', 'S40', 'S60', 'S70', 'S80', 'S90', 'V40', 'V40 Cross Country', 'V50', 'V60', 'V60 Cross Country', 'V70', 'V90', 'V90 Cross Country', 'XC40', 'XC40 Recharge', 'XC60', 'XC70', 'XC90'] },
};

const CITIES = ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr', 'Nyíregyháza', 'Kecskemét', 'Székesfehérvár', 'Szombathely'];
const CITY_COORDS = {
    'Budapest': { lat: 47.4979, ln: 19.0402 },
    'Debrecen': { lat: 47.5316, ln: 21.6273 },
    'Szeged': { lat: 46.2530, ln: 20.1414 },
    'Miskolc': { lat: 48.1000, ln: 20.7833 },
    'Pécs': { lat: 46.0727, ln: 18.2323 },
    'Győr': { lat: 47.6833, ln: 17.6351 },
    'Nyíregyháza': { lat: 47.9554, ln: 21.7167 },
    'Kecskemét': { lat: 46.9062, ln: 19.6913 },
    'Székesfehérvár': { lat: 47.1899, ln: 18.4103 },
    'Szombathely': { lat: 47.2307, ln: 16.6214 }
};

// Haversine formula for distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function deg2rad(deg) { return deg * (Math.PI / 180); }

const FUEL_TYPES = ['Benzin', 'Dízel', 'Elektromos', 'Hibrid', 'LPG'];
const TRANSMISSIONS = ['Manuális', 'Automata'];

const BADGE_TYPES = [
    { text: 'ÚJ', class: 'badge-new' },
    { text: 'PRÉMIUM', class: 'badge-premium' },
    { text: 'NÉPSZERŰ', class: 'badge-popular' },
    { text: 'ÁRCSÖKKENTÉS', class: 'badge-reduced' },
    { text: 'ELEKTROMOS', class: 'badge-electric' },
];

const CAR_IMAGES = [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1606148585437-080c3e987c6b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80',
];

// ===== BACKEND CONFIG =====
const API_BASE_URL = '/api'; // Use relative path for production (Render)

// ===== GENERATE CARS =====
function generateCars(count = 12) {
    // Keeping this as fallback if API is not available
    const cars = [];
    const brandKeys = Object.keys(BRANDS_DATA);
    for (let i = 0; i < count; i++) {
        const brand = brandKeys[Math.floor(Math.random() * brandKeys.length)];
        const models = BRANDS_DATA[brand].models;
        const model = models[Math.floor(Math.random() * models.length)];
        const year = 2010 + Math.floor(Math.random() * 16);
        const km = Math.floor(Math.random() * 250000) + 5000;
        const fuel = FUEL_TYPES[Math.floor(Math.random() * FUEL_TYPES.length)];
        const trans = TRANSMISSIONS[Math.floor(Math.random() * 2)];
        const hp = 80 + Math.floor(Math.random() * 420);
        const ccm = fuel === 'Elektromos' ? null : (1000 + Math.floor(Math.random() * 4) * 500);
        const price = Math.floor((3 + Math.random() * 45) * 1000000 / 100000) * 100000;
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];
        const img = CAR_IMAGES[i % CAR_IMAGES.length];
        const badge = Math.random() > 0.55 ? BADGE_TYPES[Math.floor(Math.random() * BADGE_TYPES.length)] : null;
        const daysAgo = Math.floor(Math.random() * 30);

        // Mock price history for the last 6 months
        const priceHistory = [];
        let currentPrice = price;
        for (let j = 5; j >= 0; j--) {
            priceHistory.push({
                month: new Date(new Date().setMonth(new Date().getMonth() - j)).toLocaleString('hu-HU', { month: 'short' }),
                price: currentPrice
            });
            // Randomly adjust historical price to look realistic (sometimes higher, sometimes lower)
            currentPrice = currentPrice * (1 + (Math.random() * 0.1 - 0.05));
        }

        const color = ['Fekete', 'Fehér', 'Ezüst', 'Szürke', 'Kék', 'Piros', 'Zöld', 'Sárga', 'Barna'][Math.floor(Math.random() * 9)];
        const bodyType = ['Kisautó', 'Limuzin', 'Kombi', 'SUV & Pick-up', 'Kupé', 'Kabriólet', 'Egyterű', 'Transzporter'][Math.floor(Math.random() * 8)];
        const condition = ['Új', 'Újszerű', 'Használt', 'Sérült'][Math.floor(Math.random() * 4)];

        cars.push({
            id: 'static-' + (i + 1), brand, model, year, km, fuel, transmission: trans, hp, ccm, price, city, img, images: [img], badge, daysAgo, priceHistory, color, bodyType, condition,
            description: `Kiváló állapotú ${brand} ${model}, ${year} évjárat. ${fuel} üzemanyagú, ${trans.toLowerCase()} váltó, ${hp} lóerő. Szervizelve, magyar papírokkal. ${city}ben megtekinthető.`,
            status: 'approved'
        });
    }
    return cars;
}

let allCars = [];
let filteredCars = [];
let favorites = JSON.parse(localStorage.getItem('lunnarFavorites') || '[]').map(String);
let compareList = JSON.parse(localStorage.getItem('lunnarCompareList') || '[]');
let currentUser = JSON.parse(localStorage.getItem('lunnarUser') || 'null');
let token = localStorage.getItem('lunnarToken');
let editingAdId = null;

// ===== HELPERS =====
function formatPrice(n) { return n.toLocaleString('hu-HU') + ' Ft'; }
function formatKm(n) { return n.toLocaleString('hu-HU') + ' km'; }
function daysAgoText(d) {
    if (d === 0) return 'Ma';
    if (d === 1) return 'Tegnap';
    return d + ' napja';
}

/**
 * Compresses an image file for storage efficiency.
 * @param {File} file - The original image file
 * @param {number} maxWidth - Maximum width (default 1200)
 * @param {number} maxHeight - Maximum height (default 1200)
 * @param {number} quality - JPEG quality (0 to 1)
 * @returns {Promise<string>} Base64 compressed image
 */
async function compressImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Switch to image/webp for better compression
                resolve(canvas.toDataURL('image/webp', quality));
            };
            img.onerror = (e) => reject(e);
        };
        reader.onerror = (e) => reject(e);
    });
}

// ===== BRANDS INIT =====
// ===== BRANDS INIT =====
function getModelGroups(brand, models) {
    const groups = {};

    models.forEach(model => {
        let groupName = "Egyéb";

        if (brand === 'BMW') {
            if (/^[1-8]/.test(model)) groupName = `${model[0]}-es sorozat`;
            else if (model.startsWith('X')) groupName = "X sorozat";
            else if (model.startsWith('Z')) groupName = "Z sorozat";
            else if (model.startsWith('i')) groupName = "i sorozat";
            else if (model.startsWith('M')) groupName = "M sorozat";
        } else if (brand === 'Mercedes') {
            const match = model.match(/^([A-Z]+)/);
            if (match) {
                const prefix = match[1];
                if (['EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'EQV'].includes(prefix)) groupName = "EQ széria";
                else groupName = `${prefix}-osztály`;
            }
        } else if (brand === 'Audi') {
            if (model.startsWith('A')) groupName = "A széria";
            else if (model.startsWith('Q')) groupName = "Q széria";
            else if (model.startsWith('RS')) groupName = "RS széria";
            else if (model.startsWith('S')) groupName = "S széria";
            else if (model.startsWith('TT')) groupName = "TT";
            else if (model.startsWith('e-tron')) groupName = "e-tron";
        } else if (brand === 'Volkswagen') {
            if (model.includes('Golf')) groupName = "Golf";
            else if (model.includes('Passat')) groupName = "Passat";
            else if (model.startsWith('ID')) groupName = "ID széria";
            else if (model.startsWith('T-')) groupName = "T-sorozat (T-Roc/Cross)";
            else groupName = model.split(' ')[0];
        } else {
            groupName = model.split(' ')[0];
        }

        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(model);
    });

    return groups;
}

// ===== CUSTOM SELECT CLASS =====
class CustomSelect {
    constructor(selectEl) {
        if (!selectEl) return;
        if (selectEl._customSelect) return selectEl._customSelect;

        this.select = selectEl;
        this.container = null;
        this.trigger = null;
        this.optionsContainer = null;
        this.init();
        // Store reference on the element
        selectEl._customSelect = this;
    }

    init() {
        // Create wrapper
        this.container = document.createElement('div');
        this.container.className = 'custom-select-wrapper';
        this.select.parentNode.insertBefore(this.container, this.select);
        this.container.appendChild(this.select);

        // Create trigger
        this.trigger = document.createElement('div');
        this.trigger.className = 'custom-select-trigger';
        this.updateTriggerContent();
        this.updateDisabledState();

        const arrow = document.createElement('span');
        arrow.className = 'custom-select-arrow';
        arrow.innerHTML = '▼';
        this.trigger.appendChild(arrow);

        this.container.appendChild(this.trigger);

        // Create options container
        this.optionsContainer = document.createElement('div');
        this.optionsContainer.className = 'custom-options';
        this.container.appendChild(this.optionsContainer);

        this.renderOptions();

        // Events
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.select.disabled) return;
            this.toggle();
        });

        document.addEventListener('click', () => this.close());

        // Listen for original select changes (from user interaction only)
        this.select.addEventListener('change', () => {
            this.updateTriggerContent();
        });
    }

    // Public method to fully rebuild the custom select after external changes
    rebuild() {
        // Ensure we are in a clean state
        this.updateDisabledState();
        this.renderOptions();

        // Update trigger based on the actual select state
        this.updateTriggerContent();

        // Safety: close if open during structural changes
        this.close();

        // Small delay to ensure browser has processed all DOM changes and layout is stable
        setTimeout(() => {
            if (this.select) {
                this.updateTriggerContent();
                // If it was supposed to be open, it will stay closed until user clicks again
                // this prevents glitchy rendering of long lists
            }
        }, 100);
    }

    updateTriggerContent() {
        if (!this.trigger || !this.select) return;
        const selectedIndex = this.select.selectedIndex;
        const options = this.select.options;
        const textArea = this.trigger.querySelector('span:not(.custom-select-arrow)') || document.createElement('span');

        let text = '';
        if (selectedIndex >= 0 && options[selectedIndex]) {
            text = options[selectedIndex].textContent;
        } else if (options.length > 0) {
            text = options[0].textContent;
        }

        textArea.textContent = text;
        if (!textArea.parentNode) this.trigger.prepend(textArea);
    }

    updateDisabledState() {
        if (this.select.disabled) {
            this.container.classList.add('disabled');
            this.trigger.style.opacity = '0.4';
            this.trigger.style.cursor = 'not-allowed';
        } else {
            this.container.classList.remove('disabled');
            this.trigger.style.opacity = '1';
            this.trigger.style.cursor = 'pointer';
        }
    }

    renderOptions() {
        if (!this.optionsContainer) return;
        this.optionsContainer.innerHTML = '';

        if (this.select.disabled) return;

        const children = this.select.children;
        for (let child of children) {
            if (child.tagName === 'OPTGROUP') {
                const label = document.createElement('div');
                label.className = 'optgroup-label';
                label.textContent = child.label;
                this.optionsContainer.appendChild(label);

                for (let option of child.children) {
                    this.createOption(option, true);
                }
            } else {
                this.createOption(child);
            }
        }
    }

    createOption(option, isChild = false) {
        const opt = document.createElement('div');
        opt.className = `custom-option ${isChild ? 'optgroup-child' : ''} ${option.selected ? 'selected' : ''}`;
        opt.textContent = option.textContent;
        opt.dataset.value = option.value;

        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            this.select.value = option.value;
            this.select.dispatchEvent(new Event('change'));
            this.close();
        });

        this.optionsContainer.appendChild(opt);
    }

    toggle() {
        const isOpen = this.container.classList.contains('open');
        // Close all other custom selects first
        document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
        if (!isOpen) this.container.classList.add('open');
    }

    close() {
        this.container.classList.remove('open');
    }
}

function initBrands() {
    const grid = document.getElementById('brands-grid');
    const select = document.getElementById('brand-select');
    if (!grid || !select) return;

    const brandEntries = Object.entries(BRANDS_DATA);

    // Truly popular brands for the grid (max 24 to stay within ~3 rows on desktop)
    const POPULAR_BRANDS_LIST = [
        'Suzuki', 'Opel', 'Volkswagen', 'Ford', 'Toyota', 'Skoda',
        'Renault', 'Audi', 'BMW', 'Mercedes', 'Peugeot', 'Citroën',
        'Honda', 'Kia', 'Hyundai', 'Mazda', 'Volvo', 'Nissan',
        'Dacia', 'Fiat', 'Seat', 'Tesla', 'Mitsubishi', 'Chevrolet'
    ];

    const popularEntries = brandEntries.filter(([name]) => POPULAR_BRANDS_LIST.includes(name));

    grid.innerHTML = popularEntries.map(([name, data]) => {
        const count = allCars.filter(car => car.brand === name).length;
        return `
            <div class="brand-item fade-in" data-brand="${name}">
                <div class="brand-logo"><img src="${data.logo}" alt="${name}"></div>
                <span class="brand-name">${name}</span>
                <span class="brand-count">${count}</span>
            </div>
        `;
    }).join('');

    grid.querySelectorAll('.brand-item').forEach(item => {
        item.addEventListener('click', () => {
            select.value = item.dataset.brand;
            select.dispatchEvent(new Event('change'));
            document.getElementById('listings').scrollIntoView({ behavior: 'smooth' });
        });
    });

    select.innerHTML = '<option value="">Összes márka</option>' +
        brandEntries.map(([name]) => `<option value="${name}">${name}</option>`).join('');

    // Initialize custom selects for search form
    const searchForm = document.getElementById('car-search-form');
    if (searchForm) {
        searchForm.querySelectorAll('select').forEach(s => new CustomSelect(s));
    }

    select.addEventListener('change', () => {
        const modelSelect = document.getElementById('model-select');
        const brand = select.value;

        if (brand && BRANDS_DATA[brand]) {
            modelSelect.disabled = false;
            const groups = getModelGroups(brand, BRANDS_DATA[brand].models);

            let optionsHtml = '<option value="">Összes modell</option>';
            Object.entries(groups).forEach(([groupName, models]) => {
                optionsHtml += `<optgroup label="${groupName}">`;
                optionsHtml += `<option value="group:${groupName}">${groupName} (mind)</option>`;
                models.forEach(m => {
                    optionsHtml += `<option value="${m}">${m}</option>`;
                });
                optionsHtml += `</optgroup>`;
            });
            modelSelect.innerHTML = optionsHtml;
        } else {
            modelSelect.disabled = true;
            modelSelect.innerHTML = '<option value="">Előbb válassz márkát</option>';
        }
        modelSelect.value = "";
        modelSelect.selectedIndex = 0;

        // Force the CustomSelect widget to fully rebuild
        // Initialize custom selects for search form - only once or when needed
        if (searchForm) {
            searchForm.querySelectorAll('select').forEach(s => {
                if (!s._customSelect) new CustomSelect(s);
                else s._customSelect.rebuild();
            });
        }
        filterCars();
    });

    document.getElementById('model-select').addEventListener('change', filterCars);

    // Brands reveal logic (Intersection Observer)
    const brandsSection = document.getElementById('brands');
    if (brandsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    brandsSection.classList.add('revealed');
                    // Stagger cards and MAKE SURE THEY ARE VISIBLE
                    const items = brandsSection.querySelectorAll('.brand-item');
                    items.forEach((item, index) => {
                        item.style.transitionDelay = `${index * 50}ms`;
                        item.classList.add('visible'); // Force visible state
                    });
                    // Once revealed, we don't need to observe anymore
                    observer.unobserve(brandsSection);
                }
            });
        }, { threshold: 0.1 });
        observer.observe(brandsSection);

        // If it was already revealed (on re-render), make items visible immediately
        if (brandsSection.classList.contains('revealed')) {
            brandsSection.querySelectorAll('.brand-item').forEach(item => item.classList.add('visible'));
        }
    }
}

/* renderCarCard consolidated */
// ===== RENDER CARS =====
function renderCars(cars) {
    const grid = document.getElementById('car-list');
    const countEl = document.getElementById('results-count');
    if (!grid) return;

    if (countEl) countEl.innerHTML = `Összesen <strong>${cars.length}</strong> találat`;

    if (cars.length === 0) {
        grid.innerHTML = `
            <div class="placeholder" style="letter-spacing:2px; grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
                🔍 NINCS TALÁLAT — PRÓBÁLJ MÁS SZŰRŐFELTÉTELEKET
            </div>
        `;
        return;
    }

    grid.innerHTML = cars.map(car => renderCarCard(car, false)).join('');

    // Event listeners
    grid.querySelectorAll('.car-fav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(btn.dataset.favId, btn);
        });
    });

    grid.querySelectorAll('.toggle-compare-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCompare(btn.dataset.compareId, btn);
        });
    });

    // Staggered fade-in
    requestAnimationFrame(() => {
        grid.querySelectorAll('.fade-in').forEach((el, i) => {
            setTimeout(() => el.classList.add('visible'), i * 80);
        });
    });
}

// ===== FILTER & SORT =====
function filterCars() {
    const brand = document.getElementById('brand-select').value;
    const model = document.getElementById('model-select').value;
    const fuel = document.getElementById('fuel-select')?.value;
    const transmission = document.getElementById('transmission-select')?.value;
    const bodyStyle = document.getElementById('body-select')?.value;
    const condition = document.getElementById('condition-select')?.value;
    const color = document.getElementById('color-select')?.value;

    // Ranges
    const yearFrom = parseInt(document.getElementById('year-from').value) || 1900;
    const yearTo = parseInt(document.getElementById('year-to').value) || 2099;
    const priceFrom = parseInt(document.getElementById('price-from').value) || 0;
    const priceTo = parseInt(document.getElementById('price-to').value) || Infinity;

    const kmFrom = parseInt(document.getElementById('km-from')?.value) || 0;
    const kmTo = parseInt(document.getElementById('km-to')?.value) || Infinity;

    const hpFrom = parseInt(document.getElementById('hp-from')?.value) || 0;
    const hpTo = parseInt(document.getElementById('hp-to')?.value) || Infinity;

    // Distance
    const searchCity = document.getElementById('city-search')?.value.trim();
    const distanceLimit = parseInt(document.getElementById('distance-select')?.value);

    // Find target city coords if provided
    let targetCoords = null;
    if (searchCity === 'Jelenlegi helyzetem' && window.userCoords) {
        targetCoords = window.userCoords;
    } else if (searchCity && searchCity.length > 2) {
        const match = Object.keys(CITY_COORDS).find(k => k.toLowerCase() === searchCity.toLowerCase());
        if (match) targetCoords = CITY_COORDS[match];
    }

    filteredCars = allCars.filter(car => {
        // Basic match
        if (brand && car.brand !== brand) return false;
        if (model) {
            if (model.startsWith('group:')) {
                const groupName = model.replace('group:', '');
                const groupModels = getModelGroups(car.brand, BRANDS_DATA[car.brand]?.models || [])[groupName] || [];
                if (!groupModels.includes(car.model)) return false;
            } else if (car.model !== model) {
                return false;
            }
        }

        // Detailed match
        if (fuel && car.fuel !== fuel) return false;
        if (transmission && car.transmission !== transmission) return false;
        if (bodyStyle && car.bodyType !== bodyStyle) return false;
        if (condition && car.condition !== condition) return false;
        if (color && car.color !== color) return false;

        // Range matches
        if (car.year < yearFrom || car.year > yearTo) return false;
        if (car.price < priceFrom || car.price > priceTo) return false;
        if (car.km < kmFrom || car.km > kmTo) return false;
        if (parseInt(car.hp || 0) < hpFrom || parseInt(car.hp || 0) > hpTo) return false;

        // Location Distance Filtering
        if (targetCoords && distanceLimit >= 0) {
            const carCoords = CITY_COORDS[car.city];
            if (!carCoords) return false;
            const dist = getDistanceFromLatLonInKm(targetCoords.lat, targetCoords.ln, carCoords.lat, carCoords.ln);
            if (dist > distanceLimit) return false;
        } else if (searchCity && !distanceLimit && searchCity !== 'Jelenlegi helyzetem') {
            if (car.city.toLowerCase() !== searchCity.toLowerCase()) return false;
        }

        return true;
    });

    sortCars();
    renderCars(filteredCars);
    updateSearchCount();
}

function sortCars() {
    const sort = document.getElementById('sort-select').value;
    switch (sort) {
        case 'price-asc': filteredCars.sort((a, b) => a.price - b.price); break;
        case 'price-desc': filteredCars.sort((a, b) => b.price - a.price); break;
        case 'km-asc': filteredCars.sort((a, b) => a.km - b.km); break;
        case 'km-desc': filteredCars.sort((a, b) => b.km - a.km); break;
        case 'year-desc': filteredCars.sort((a, b) => b.year - a.year); break;
        case 'year-asc': filteredCars.sort((a, b) => a.year - b.year); break;
        case 'hp-desc': filteredCars.sort((a, b) => (b.hp || 0) - (a.hp || 0)); break;
        default: filteredCars.sort((a, b) => a.daysAgo - b.daysAgo); break;
    }
}

function updateSearchCount() {
    const el = document.getElementById('search-count');
    if (el) el.textContent = filteredCars.length.toLocaleString('hu-HU');
}

// ===== FAVORITES =====
function toggleFavorite(id, btn) {
    const idx = favorites.indexOf(id);
    const isBig = btn && btn.classList.contains('big');
    if (idx === -1) {
        favorites.push(id.toString());
        if (btn) {
            btn.classList.add('active');
            btn.innerHTML = isBig ? '❤️ Kedvenc' : '❤️';
        }
    } else {
        favorites.splice(idx, 1);
        if (btn) {
            btn.classList.remove('active');
            btn.innerHTML = isBig ? '🤍 Kedvencekhez' : '🤍';
        }
    }
    localStorage.setItem('lunnarFavorites', JSON.stringify(favorites));
    syncFavoritesWithBackend();
}

// ===== COMPARE TOOL =====
function toggleCompare(id, btn) {
    const car = allCars.find(c => (c.id && c.id == id) || (c._id && c._id == id));
    if (!car) return;

    const idx = compareList.findIndex(c => (c.id && c.id == car.id) || (c._id && c._id == car._id));
    if (idx === -1) {
        if (compareList.length >= 3) {
            showToast('Maximum 3 autót hasonlíthatsz össze!', 'warning');
            return;
        }
        compareList.push(car);
        if (btn) btn.textContent = '✓ HOZZÁADVA';
    } else {
        compareList.splice(idx, 1);
        if (btn) btn.textContent = '+ ÖSSZEHASONLÍT';
    }

    // Also update any other buttons on the page for this car
    document.querySelectorAll(`.toggle-compare-btn[data-compare-id="${id}"]`).forEach(b => {
        b.textContent = idx === -1 ? '✓ HOZZÁADVA' : '+ ÖSSZEHASONLÍT';
    });

    renderCompareBar();
}

function renderCompareBar() {
    const bar = document.getElementById('compare-bar');
    const container = document.getElementById('compare-items-container');
    if (!bar || !container) return;

    if (compareList.length === 0) {
        bar.style.display = 'none';
        return;
    }

    bar.style.display = 'flex';
    container.innerHTML = compareList.map(car => `
        <div class="compare-item">
            <img src="${car.images && car.images.length ? car.images[0] : car.img}" alt="${car.brand}">
            <span>${car.brand} ${car.model}</span>
            <button class="remove-compare" onclick="toggleCompare('${car.id || car._id}')">&times;</button>
        </div>
    `).join('');
}

function openCompareModal() {
    if (compareList.length < 2) {
        showToast('Legalább 2 autót válassz ki az összehasonlításhoz!', 'warning');
        return;
    }

    const modal = document.getElementById('compare-modal');
    const tableContainer = document.getElementById('compare-table-container');
    if (!modal || !tableContainer) return;

    let html = `<div class="compare-grid" style="grid-template-columns: repeat(${compareList.length}, 1fr);">`;

    // Header (Images and Titles)
    compareList.forEach(car => {
        html += `
        <div class="compare-col-header">
            <img src="${car.images && car.images.length ? car.images[0] : car.img}" alt="${car.brand}">
            <h4>${car.brand} ${car.model}</h4>
            <div class="compare-price">${formatPrice(car.price)}</div>
        </div>`;
    });

    // Specs
    const specs = [
        { label: 'Évjárat', key: 'year' },
        { label: 'Futott km', key: 'km', format: formatKm },
        { label: 'Üzemanyag', key: 'fuel' },
        { label: 'Váltó', key: 'transmission' },
        { label: 'Teljesítmény', key: 'hp', suffix: ' LE' },
        { label: 'Hengerűrtartalom', key: 'ccm', suffix: ' ccm' }
    ];

    specs.forEach(spec => {
        html += `<div class="compare-spec-row" style="grid-column: 1 / -1;">${spec.label}</div>`;
        compareList.forEach(car => {
            const val = car[spec.key];
            const displayVal = val ? (spec.format ? spec.format(val) : val + (spec.suffix || '')) : '-';
            html += `<div class="compare-spec-val">${displayVal}</div>`;
        });
    });

    html += `</div>`;
    tableContainer.innerHTML = html;
    modal.classList.add('active');
}

// ===== MODAL =====
// ===== ROUTING & VIEWS =====
// ===== VIEW MANAGER (ROUTING) =====
function handleRouting() {
    const hash = window.location.hash || '#home';
    const views = ['view-home', 'view-ad-detail', 'view-favorites', 'view-profile'];

    // Hide all views
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) {
            el.style.display = 'none';
            el.classList.remove('active');
        }
    });

    const homeAnchors = ['#home', '#hero', '#brands', '#listings', '#how-it-works'];
    const isHomeAnchor = homeAnchors.some(a => hash.startsWith(a));

    // Determine target view
    if (hash === '' || isHomeAnchor) {
        showView('view-home');
        if (hash.startsWith('#') && hash !== '#home') {
            const target = document.querySelector(hash);
            if (target) {
                setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        } else {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    } else if (hash.startsWith('#ad/')) {
        const id = hash.replace('#ad/', '');
        renderAdDetail(id);
        showView('view-ad-detail');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (hash === '#favorites-view' || hash === '#view-favorites') {
        renderFavorites();
        showView('view-favorites');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (hash === '#view-profile') {
        if (!token) {
            window.location.hash = '#home';
            return;
        }
        try {
            renderProfile();
        } catch (e) {
            console.error("Profile rendering failed:", e);
        }
        showView('view-profile');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showView(viewId) {
    const v = document.getElementById(viewId);
    if (v) {
        v.style.display = 'block';
        v.classList.add('active');
    }
}

function renderAdDetail(id) {
    const car = allCars.find(c => c.id == id || c._id == id);
    const container = document.getElementById('detail-page-content');
    if (!container) return;

    if (!car) {
        container.innerHTML = '<div class="placeholder">HIRDETÉS NEM TALÁLHATÓ</div>';
        return;
    }

    const isFav = favorites.includes(String(car._id || car.id));
    const images = (car.images && car.images.length > 0) ? car.images : [car.img];
    const hasMultiple = images.length > 1;

    container.innerHTML = `
        <div class="dynamic-glow-container"></div>
        <div class="ad-full-detail">
            <a href="#home" class="back-link">← Vissza a kereséshez</a>
            <div class="detail-header-flex">
                <div class="detail-title-area">
                    <h1 class="detail-title">${car.brand} ${car.model}</h1>
                    <p class="detail-subtitle">${car.year} · ${car.fuel} · ${car.transmission}</p>
                </div>
                <div class="detail-price-area">
                    <div class="detail-price">${formatPrice(car.price)}</div>
                    <button class="car-fav big ${isFav ? 'active' : ''}" id="detail-fav-btn" data-fav-id="${car._id || car.id}">${isFav ? '❤️ Kedvenc' : '🤍 Kedvencekhez'}</button>
                </div>
            </div>

            <div class="detail-gallery">
                <div class="main-image-container" id="gallery-container">
                    <img src="${images[0]}" id="main-detail-img" alt="${car.brand} ${car.model}">
                    ${hasMultiple ? `
                        <button class="gallery-nav prev" id="gallery-prev" aria-label="Előző kép">‹</button>
                        <button class="gallery-nav next" id="gallery-next" aria-label="Következő kép">›</button>
                        <div class="gallery-counter" id="gallery-counter">1 / ${images.length}</div>
                    ` : ''}
                </div>
                ${hasMultiple ? `
                <div class="thumbnail-row" id="thumbnail-row">
                    ${images.map((img, i) => `
                        <div class="thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
                            <img src="${img}" alt="Kép ${i + 1}">
                        </div>
                    `).join('')}
                </div>` : ''}
            </div>

            <div class="detail-info-grid">
                <div class="detail-specs-card">
                    <h3>ADATOK</h3>
                    <div class="specs-list">
                        <div class="spec-item"><span>🐎 Teljesítmény</span><strong>${car.hp} LE</strong></div>
                        <div class="spec-item"><span>🛣️ Futott km</span><strong>${formatKm(car.km)}</strong></div>
                        <div class="spec-item"><span>📅 Évjárat</span><strong>${car.year}</strong></div>
                        <div class="spec-item"><span>⛽ Üzemanyag</span><strong>${car.fuel}</strong></div>
                        <div class="spec-item"><span>⚙️ Váltó</span><strong>${car.transmission}</strong></div>
                        <div class="spec-item"><span>🚗 Karosszéria</span><strong>${car.bodyType || '-'}</strong></div>
                        <div class="spec-item"><span>🎨 Szín</span><strong>${car.color || '-'}</strong></div>
                        <div class="spec-item"><span>💎 Állapot</span><strong>${car.condition || '-'}</strong></div>
                        ${car.ccm ? `<div class="spec-item"><span>🔧 Hengerűrtartalom</span><strong>${car.ccm} ccm</strong></div>` : ''}
                        <div class="spec-item"><span>📍 Település</span><strong>${car.city}</strong></div>
                        ${car.vin ? `<div class="spec-item" style="grid-column: 1/-1;">
                            <span>🔍 Alvázszám (VIN)</span><strong>${car.vin}</strong>
                            <div style="display:inline-block; margin-left:10px;">
                                <button class="cta-mini" onclick="window.open('https://www.carvertical.com/hu/check?vin=${car.vin}', '_blank')" style="padding:4px 10px; font-size:0.75rem; background:#005bea; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Lekérdezés a carVerticalon 🛡️</button>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
                <div class="detail-desc-card">
                    <h3>LEÍRÁS</h3>
                    <p>${car.description || 'Nincs megadva leírás.'}</p>
                    <div class="detail-contact" style="display:flex; flex-direction:column; gap:0.5rem; margin-top:2rem;">
                        ${car.phone ? `
                            <button class="cta-button primary" onclick="window.location.href='tel:${car.phone}'" style="width:100%;">📞 ELADÓ HÍVÁSA (${car.phone})</button>
                        ` : `
                            <button class="cta-button primary" style="width:100%;">📞 ELADÓ HÍVÁSA</button>
                        `}
                        <div id="seller-rating-${car._id || car.id}" style="text-align:center; font-size:0.9rem; margin-bottom:0.5rem; color:#fbbf24; font-weight:bold;"></div>
                        <button class="cta-button secondary" onclick="openUserChat('${String(car._id || car.id)}', '${String(car.owner || car.ownerId || '')}', '${String(car.seller || 'Eladó').replace(/'/g, "\\'")}', '${String(car.brand + ' ' + car.model).replace(/'/g, "\\'")}')" style="width:100%;">💬 CHAT AZ ELADÓVAL</button>
                        ${token && currentUser ? `
                            <button class="cta-mini" onclick="openRatingModal('${String(car.owner || car.ownerId || '')}', '${String(car.seller || 'Eladó').replace(/'/g, "\\'")}')" style="width:100%; padding:0.8rem; border:1px solid var(--border-color); background:transparent; color:var(--text-color); font-weight:bold; letter-spacing:1px;">⭐ ELADÓ ÉRTÉKELÉSE</button>
                        ` : ''}
                        ${car.email ? `<p style="margin-top: 0.5rem; text-align:center; opacity: 0.7; font-size: 0.9rem;">📧 ${car.email}</p>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="price-tracker-section">
                <h3>ÁRTÖRTÉNET (6 HÓNAP)</h3>
                <div class="price-chart-container">
                    <canvas id="priceChartCanvas"></canvas>
                </div>
            </div>

            <div class="ad-comments">
                <h3>KÖZÖSSÉGI FEED (${car.comments ? car.comments.length : 0} hozzászólás)</h3>
                <div class="comment-list" id="comment-list-container">
                    ${(car.comments || []).map(c => `
                        <div class="comment-item">
                            <div class="comment-avatar">${c.username.charAt(0).toUpperCase()}</div>
                            <div class="comment-content">
                                <div class="comment-header">
                                    <span>${c.username}</span>
                                    <span>${new Date(c.createdAt).toLocaleDateString('hu-HU', {year:'numeric', month:'short', day:'numeric'})}</span>
                                </div>
                                <div class="comment-text">${c.text}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${token && currentUser ? `
                <div class="comment-input-area">
                    <textarea id="new-comment-text" placeholder="Oszd meg a véleményed vagy tedd fel a kérdésed a közösségnek..."></textarea>
                    <button class="cta-button primary" onclick="submitComment('${car._id || car.id}')">KÜLDÉS</button>
                </div>` : '<p style="margin-top: 1rem; opacity: 0.7;">A hozzászóláshoz be kell jelentkezned.</p>'}
            </div>
        </div>
        `;

    // Fetch and display seller rating
    const ownerIdVar = car.owner || car.ownerId;
    if (ownerIdVar) {
        fetch(`${API_BASE_URL}/users/${ownerIdVar}/profile`)
            .then(res => res.json())
            .then(usr => {
                const el = document.getElementById(`seller-rating-${car._id || car.id}`);
                if (el && usr.totalRatings > 0) {
                    el.innerHTML = `Értékelés: ⭐ ${usr.sellerRating.toFixed(1)} (${usr.totalRatings} vélemény)`;
                    if (usr.ratings && usr.ratings.length > 0) {
                        const comments = usr.ratings.filter(r => r.comment && r.comment.length > 0);
                        if (comments.length > 0) {
                            const last = comments[comments.length - 1];
                            el.innerHTML += `<div style="font-size:0.8rem; color:var(--text-color); opacity:0.8; margin-top:0.4rem; line-height:1.2; font-style:italic;">"${last.comment}"<br>— ${last.raterName}</div>`;
                        }
                    }
                } else if (el) {
                    el.innerHTML = `Még nem kapott értékelést`;
                    el.style.color = 'var(--text-color)';
                    el.style.opacity = '0.6';
                }
            })
            .catch(err => console.warn('Hiba a profil betöltésekor', err));
    }

    // ===== IMAGE CAROUSEL LOGIC =====
    if (hasMultiple) {
        let currentIndex = 0;
        const mainImg = document.getElementById('main-detail-img');
        const counterEl = document.getElementById('gallery-counter');
        const thumbRow = document.getElementById('thumbnail-row');
        const thumbs = thumbRow ? thumbRow.querySelectorAll('.thumb') : [];

        function goToImage(index) {
            if (index < 0) index = images.length - 1;
            if (index >= images.length) index = 0;
            currentIndex = index;

            // Fade transition
            mainImg.style.opacity = '0';
            setTimeout(() => {
                mainImg.src = images[currentIndex];
                mainImg.style.opacity = '1';
            }, 150);

            // Update counter
            if (counterEl) counterEl.textContent = `${currentIndex + 1} / ${images.length}`;

            // Update thumbnails
            thumbs.forEach((t, i) => {
                t.classList.toggle('active', i === currentIndex);
            });

            // Auto-scroll thumbnail into view
            if (thumbs[currentIndex]) {
                thumbs[currentIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }

        // Arrow buttons
        const prevBtn = document.getElementById('gallery-prev');
        const nextBtn = document.getElementById('gallery-next');
        if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goToImage(currentIndex - 1); });
        if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goToImage(currentIndex + 1); });

        // Thumbnail clicks
        thumbs.forEach(t => {
            t.addEventListener('click', () => goToImage(parseInt(t.dataset.index)));
        });

        // Touch swipe support
        const galleryEl = document.getElementById('gallery-container');
        let touchStartX = 0;
        let touchEndX = 0;
        const SWIPE_THRESHOLD = 50;

        galleryEl.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        galleryEl.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > SWIPE_THRESHOLD) {
                if (diff > 0) goToImage(currentIndex + 1); // swipe left = next
                else goToImage(currentIndex - 1); // swipe right = prev
            }
        }, { passive: true });

        // Keyboard arrow support
        const keyHandler = (e) => {
            if (e.key === 'ArrowLeft') goToImage(currentIndex - 1);
            if (e.key === 'ArrowRight') goToImage(currentIndex + 1);
        };
        document.addEventListener('keydown', keyHandler);
        // Clean up when leaving the detail view
        const observer = new MutationObserver(() => {
            if (!document.getElementById('gallery-container')) {
                document.removeEventListener('keydown', keyHandler);
                observer.disconnect();
            }
        });
        observer.observe(container, { childList: true, subtree: true });
    }

    const favBtn = container.querySelector('.car-fav');
    if (favBtn) {
        favBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleFavorite(car.id, favBtn);
        });
    }

    // Render price chart if data exists
    if (car.priceHistory && car.priceHistory.length > 0) {
        setTimeout(() => renderPriceChart(car.priceHistory), 100);
    }
    
    // Rögzítjük a megtekintést a szerveren
    if (car._id || car.id) {
        fetch(`${API_BASE_URL}/ads/${car._id || car.id}/view`, { method: 'POST' }).catch(e => console.log('View stat error ignored', e));
    }

    // Dynamic Glow Extraction
    extractDominantColor(images[0]).then(color => {
        document.documentElement.style.setProperty('--dynamic-glow-color', color);
    });
}

function renderPriceChart(history) {
    const canvas = document.getElementById('priceChartCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    // Set actual size in memory (scaled to account for extra pixel density)
    const cw = container.clientWidth;
    const ch = container.clientHeight || 200;
    canvas.width = cw * 2;
    canvas.height = ch * 2;

    // Normalize coordinate system to use css pixels
    ctx.scale(2, 2);

    // Get min and max prices for scaling
    const prices = history.map(h => h.price);
    const minPrice = Math.min(...prices) * 0.95;
    const maxPrice = Math.max(...prices) * 1.05;
    const range = maxPrice - minPrice;

    // Draw parameters
    const padding = 30;
    const graphW = cw - padding * 2;
    const graphH = ch - padding * 2;

    const isLight = document.body.classList.contains('light-mode');
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#00f3ff';
    const textColor = isLight ? '#475569' : 'rgba(255, 255, 255, 0.5)';
    const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255, 255, 255, 0.05)';

    ctx.clearRect(0, 0, cw, ch);

    // Draw Grid & Labels
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';

    history.forEach((data, i) => {
        const x = padding + (i / (history.length - 1)) * graphW;

        // Vertical grid lines
        ctx.beginPath();
        ctx.strokeStyle = gridColor;
        ctx.moveTo(x, padding);
        ctx.lineTo(x, ch - padding);
        ctx.stroke();

        // Month labels
        ctx.fillText(data.month, x, ch - 5);
    });

    // Draw the main line
    ctx.beginPath();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';

    // Shadow / Glow effect
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = isLight ? 0 : 10;

    history.forEach((data, i) => {
        const x = padding + (i / (history.length - 1)) * graphW;
        const normalizedY = (data.price - minPrice) / range;
        const y = padding + graphH - (normalizedY * graphH);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw data points
    ctx.shadowBlur = 0;
    history.forEach((data, i) => {
        const x = padding + (i / (history.length - 1)) * graphW;
        const normalizedY = (data.price - minPrice) / range;
        const y = padding + graphH - (normalizedY * graphH);

        ctx.beginPath();
        ctx.fillStyle = isLight ? '#fff' : '#0a0a0a';
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
}

function renderFavorites() {
    const grid = document.getElementById('favorites-grid');
    if (!grid) return;

    const favCars = allCars.filter(c => favorites.includes(c.id.toString()) || favorites.includes(c._id ? c._id.toString() : ''));

    if (favCars.length === 0) {
        grid.innerHTML = '<div class="placeholder" style="grid-column: 1/-1;">MÉG NINCSENEK KEDVENC AUTÓID</div>';
        return;
    }

    renderCarsIn(favCars, grid);
}

// Custom render for any grid
function renderCarsIn(cars, grid, isProfileView = false) {
    grid.innerHTML = cars.map(car => renderCarCard(car, isProfileView)).join('');

    // Staggered fade-in (Standard)
    requestAnimationFrame(() => {
        grid.querySelectorAll('.fade-in').forEach((el, i) => {
            setTimeout(() => el.classList.add('visible'), i * 80);
        });
    });

    grid.querySelectorAll('.car-fav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(btn.dataset.favId, btn);
            if (window.location.hash === '#favorites-view') renderFavorites();
        });
    });

    grid.querySelectorAll('.toggle-compare-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCompare(btn.dataset.compareId, btn);
        });
    });
}

// ===== HEADER SCROLL =====
function initHeaderScroll() {
    window.addEventListener('scroll', () => {
        document.querySelector('header').classList.toggle('scrolled', window.scrollY > 20);
    });
}

// ===== HAMBURGER MENU =====
function initHamburger() {
    const btn = document.getElementById('hamburger');
    const nav = document.getElementById('nav-links');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            btn.classList.remove('active');
            nav.classList.remove('open');
        });
    });
}

// ===== STATS COUNTER =====
function initStats() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.stat-value[data-target]').forEach(el => {
                    const target = parseInt(el.dataset.target);
                    let current = 0;
                    const duration = 2000;
                    const step = target / (duration / 16);
                    function tick() {
                        current += step;
                        if (current < target) {
                            el.textContent = Math.floor(current).toLocaleString('hu-HU');
                            requestAnimationFrame(tick);
                        } else {
                            el.textContent = target.toLocaleString('hu-HU');
                        }
                    }
                    tick();
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    const sec = document.getElementById('stats');
    if (sec) observer.observe(sec);
}

// ===== FADE IN OBSERVER =====
// ===== FADE IN OBSERVER =====
function initFadeIn() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ===== SEARCH FORM =====
function initSearch() {
    const form = document.getElementById('car-search-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        filterCars();
        document.getElementById('listings').scrollIntoView({ behavior: 'smooth' });
    });

    // Save Search Button
    const saveSearchBtn = document.createElement('button');
    saveSearchBtn.type = 'button';
    saveSearchBtn.className = 'cta-mini';
    saveSearchBtn.innerHTML = '📂 KERESÉS MENTÉSE';
    saveSearchBtn.style.cssText = 'margin-top: 1rem; width: 100%; padding: 0.8rem; border: 1px dashed var(--border-color); background: transparent;';
    saveSearchBtn.onclick = saveCurrentSearch;
    form.appendChild(saveSearchBtn);

    // Detailed Search Toggle
    const toggleBtn = document.getElementById('detailed-search-toggle');
    const detailedBox = document.getElementById('detailed-search-box');
    if (toggleBtn && detailedBox) {
        toggleBtn.addEventListener('click', () => {
            const isActive = detailedBox.classList.toggle('active');
            toggleBtn.innerHTML = isActive ?
                '<span class="icon" style="transform: rotate(45deg)">＋</span> KEVESEBB OPCIÓ' :
                '<span class="icon">＋</span> TOVÁBBI KERESÉSI OPCIÓK';

            if (isActive) {
                detailedBox.querySelectorAll('select').forEach(s => {
                    if (!s._customSelect) new CustomSelect(s);
                });
            }
        });
    }

    // Live update count
    form.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', updateSearchCount);
        if (el.type === 'number' || el.type === 'text') {
            el.addEventListener('input', updateSearchCount);
        }
    });

    form.addEventListener('reset', () => {
        const modelSelect = document.getElementById('model-select');
        modelSelect.disabled = true;
        modelSelect.innerHTML = '<option value="">Előbb válassz márkát</option>';
        if (modelSelect._customSelect) modelSelect._customSelect.rebuild();

        filteredCars = [...allCars];
        renderCars(filteredCars);
        updateSearchCount();
    });

    document.getElementById('fuel-select').addEventListener('change', filterCars);
    document.getElementById('sort-select').addEventListener('change', () => {
        sortCars();
        renderCars(filteredCars);
    });

    // Body Type Quick Filter (HOMEPAGE)
    document.querySelectorAll('.body-type-item').forEach(item => {
        item.addEventListener('click', () => {
            const bodyType = item.getAttribute('data-body');
            const bodySelect = document.getElementById('body-select');

            if (bodySelect) {
                bodySelect.value = bodyType;
                if (bodySelect._customSelect) bodySelect._customSelect.rebuild();

                // Trigger filter and scroll
                filterCars();
                document.getElementById('listings').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ===== MODAL EVENTS =====
function initModal() {
    const modal = document.getElementById('car-modal');
    const closeBtn = document.getElementById('modal-close');

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        const activeView = document.querySelector('.page-view.active');
        const isHomeView = activeView && activeView.id === 'view-home';

        // Routing links should follow normal hashchange behavior
        const routingHashes = ['#ad/', '#favorites-view', '#view-favorites', '#view-profile'];
        if (routingHashes.some(rh => href.startsWith(rh))) return;

        // If we are on home view, smooth scroll to section
        if (isHomeView) {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
                window.history.pushState(null, null, href); // Update URL without triggering hashchange reload
            } else if (href === '#home') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.history.pushState(null, null, '#home');
            }
        }
        // If not on home view, let the anchor click happen -> triggers hashchange -> handleRouting switches view
    });
});

// ===== FETCH DATA =====
async function fetchAds() {
    let apiAds = [];
    try {
        const res = await fetch(`${API_BASE_URL}/ads`);
        if (res.ok) apiAds = await res.json();
    } catch (err) {
        console.warn('Backend server not running, using local fallback');
    }

    // Load local ads from storage
    const localAds = JSON.parse(localStorage.getItem('lunnarLocalAds') || '[]');
    const approvedLocalAds = localAds.filter(ad => ad.status === 'approved');

    // Merge: API ads take priority
    let combinedAds = [...apiAds, ...approvedLocalAds];

    allCars = combinedAds;
    filteredCars = [...allCars];
    renderCars(allCars);
    updateSearchCount();
    initBrands(); // Refresh brand counts in popular section
}

// ===== AD SUBMISSION =====
function initSubmission() {
    const sellBtn = document.getElementById('sell-btn');
    const mobileSellBtn = document.getElementById('mobile-sell-btn');
    const mobileFabBtn = document.getElementById('mobile-fab-btn');
    const modal = document.getElementById('submission-modal');
    const closeBtn = document.getElementById('submission-close');
    const form = document.getElementById('ad-submission-form');
    const fileInput = document.getElementById('sub-img-file');
    const preview = document.getElementById('img-preview');

    // Selects
    const subBrand = document.getElementById('sub-brand');
    const subModel = document.getElementById('sub-model');
    const subFuel = document.getElementById('sub-fuel');
    const subTrans = document.getElementById('sub-transmission');
    const subBody = document.getElementById('sub-body');
    const subCondition = document.getElementById('sub-condition');
    const subColor = document.getElementById('sub-color');

    let base64Images = [];

    // Expose image setting for edit mode
    window.setSubmissionImages = (images) => {
        base64Images = images;
        updateImagePreviews();
    };

    // Init Selects
    if (subBrand) {
        subBrand.innerHTML = '<option value="" disabled selected>Válassz márkát</option>';
        subBrand.innerHTML += Object.keys(BRANDS_DATA).sort().map(b => `<option value="${b}">${b}</option>`).join('');
        subBrand.addEventListener('change', () => {
            const brand = subBrand.value;
            const data = BRANDS_DATA[brand];
            if (!data) return;

            let html = '<option value="" disabled selected>Válassz modellt</option>';
            const groups = getModelGroups(brand, data.models);
            const groupEntries = Object.entries(groups);

            if (groupEntries.length > 1) {
                groupEntries.forEach(([groupName, models]) => {
                    html += `<optgroup label="${groupName}">`;
                    models.forEach(m => {
                        html += `<option value="${m}">${m}</option>`;
                    });
                    html += `</optgroup>`;
                });
            } else {
                const models = data.models || [];
                html += models.map(m => `<option value="${m}">${m}</option>`).join('');
            }

            subModel.innerHTML = html;
            subModel.disabled = false;

            // Rebuild CustomSelect if exists
            if (subModel._customSelect) subModel._customSelect.rebuild();
        });

        // Initialize custom selects for submission form
        setTimeout(() => {
            [subBrand, subModel, subFuel, subTrans, subBody, subCondition, subColor].forEach(s => {
                if (s) new CustomSelect(s);
            });
        }, 0);
    }

    if (subFuel) {
        subFuel.innerHTML = '<option value="" disabled selected>Üzemanyag</option>';
        subFuel.innerHTML += FUEL_TYPES.map(f => `<option value="${f}">${f}</option>`).join('');
    }

    if (subTrans) {
        subTrans.innerHTML = '<option value="" disabled selected>Váltó</option>';
        subTrans.innerHTML += TRANSMISSIONS.map(t => `<option value="${t}">${t}</option>`).join('');
    }

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            
            if (base64Images.length + files.length > 10) {
                showToast('Maximum 10 képet tölthetsz fel hirdetésenként!', 'warning');
                fileInput.value = '';
                return;
            }

            for (const file of files) {
                // First-line defense: don't even try if file is huge (e.g. 10MB+)
                if (file.size > 10 * 1024 * 1024) {
                    showToast(`A(z) ${file.name} kép túl nagy (max 10MB).`, 'warning');
                    continue;
                }

                try {
                    // Compress to max 1200px at 0.7 quality
                    const compressedBase64 = await compressImage(file, 1200, 1200, 0.7);
                    base64Images.push(compressedBase64);
                } catch (err) {
                    console.error('Image compression failed:', err);
                    showToast('Nem sikerült feldolgozni a képet.', 'error');
                }
            }
            updateImagePreviews();
            fileInput.value = '';
        });
    }

    function updateImagePreviews() {
        if (!preview) return;
        if (base64Images.length === 0) {
            preview.innerHTML = '<div class="preview-placeholder">A feltöltött képek itt fognak megjelenni</div>';
            return;
        }

        preview.innerHTML = base64Images.map((img, index) => `
            <div class="preview-card">
                <img src="${img}">
                <div class="preview-controls">
                    <button type="button" class="order-btn" onclick="event.stopPropagation(); window.moveImage(${index}, -1)" ${index === 0 ? 'disabled' : ''} title="Előre">←</button>
                    <button type="button" class="remove-img-btn" onclick="event.stopPropagation(); window.removeImage(${index})" title="Kép törlése">&times;</button>
                    <button type="button" class="order-btn" onclick="event.stopPropagation(); window.moveImage(${index}, 1)" ${index === base64Images.length - 1 ? 'disabled' : ''} title="Hátra">→</button>
                </div>
            </div>
        `).join('');
    }

    window.removeImage = (index) => {
        base64Images.splice(index, 1);
        updateImagePreviews();
    };

    window.moveImage = (index, direction) => {
        if (direction === -1 && index > 0) {
            const tmp = base64Images[index];
            base64Images[index] = base64Images[index - 1];
            base64Images[index - 1] = tmp;
        } else if (direction === 1 && index < base64Images.length - 1) {
            const tmp = base64Images[index];
            base64Images[index] = base64Images[index + 1];
            base64Images[index + 1] = tmp;
        }
        updateImagePreviews();
    };

    if (sellBtn) sellBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSubmissionModal();
    });

    if (mobileSellBtn) mobileSellBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Close hamburger menu first
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('nav-links');
        if (hamburger) hamburger.classList.remove('active');
        if (navLinks) navLinks.classList.remove('open');
        openSubmissionModal();
    });

    if (mobileFabBtn) mobileFabBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSubmissionModal();
    });

    function openSubmissionModal() {
        if (!token || !currentUser) {
            showToast('Hirdetés feladásához be kell jelentkezned!', 'error');
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            return;
        }
        editingAdId = null;
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) modalTitle.textContent = 'HIRDETÉS FELADÁSA';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Ensure custom selects are updated
        [subBrand, subModel, subFuel, subTrans, subBody, subCondition, subColor].forEach(s => {
            if (s && s._customSelect) s._customSelect.rebuild();
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        form.reset();
        preview.innerHTML = '<div class="preview-placeholder">A feltöltött képek itt fognak megjelenni</div>';
        base64Images = [];
        editingAdId = null;
        if (subModel) {
            subModel.disabled = true;
            subModel.innerHTML = '<option value="" disabled selected>Előbb válassz márkát</option>';
        }
        [subBrand, subModel, subFuel, subTrans, subBody, subCondition, subColor].forEach(s => {
            if (s && s._customSelect) s._customSelect.rebuild();
        });
    });

    if (form) form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<span>FOLYAMATBAN...</span>'; }

        try {
            if (base64Images.length === 0) {
                showToast('Kérjük, válassz ki legalább egy képet!', 'error');
                if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnText; }
                return;
            }

            const getVal = (id) => {
                const el = document.getElementById(id);
                return el ? el.value : "";
            };

            const brand = subBrand ? subBrand.value : "";
            const model = subModel ? subModel.value : "";

            if (!brand || !model) {
                showToast('Kérjük, válassz márkát és modellt!', 'error');
                if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnText; }
                return;
            }

            const adData = {
                brand: brand,
                model: model,
                year: parseInt(getVal('sub-year')) || 0,
                price: parseInt(getVal('sub-price')) || 0,
                km: parseInt(getVal('sub-km')) || 0,
                city: getVal('sub-city'),
                hp: parseInt(getVal('sub-hp')) || 0,
                ccm: parseInt(getVal('sub-ccm')) || 0,
                phone: getVal('sub-phone'),
                email: getVal('sub-email'),
                images: base64Images,
                description: getVal('sub-desc'),
                fuel: subFuel ? subFuel.value : "",
                transmission: subTrans ? subTrans.value : "",
                bodyType: subBody ? subBody.value : "",
                condition: subCondition ? subCondition.value : "",
                color: subColor ? subColor.value : "",
                vin: getVal('sub-vin'),
                status: 'approved',
                ownerEmail: currentUser.email,
                ownerId: currentUser.id,
                seller: currentUser.username
            };

            // Local ID only used for localStorage fallback
            const localId = editingAdId || ('local-' + Date.now());
            if (editingAdId) {
                adData.updatedAt = new Date().toISOString();
            } else {
                adData.createdAt = new Date().toISOString();
            }

            console.log('[Submission] Hirdetés adatok:', adData.brand, adData.model, 'képek:', adData.images.length);


            let success = false;
            // 1. Try Backend
            try {
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const method = editingAdId ? 'PATCH' : 'POST';
                const url = editingAdId ? `${API_BASE_URL}/ads/${editingAdId}` : `${API_BASE_URL}/ads`;

                console.log('[Submission] Küldés a szerverre:', method, url);
                const res = await fetch(url, {
                    method: method,
                    headers: headers,
                    body: JSON.stringify(adData)
                });
                if (res.ok) {
                    const savedAd = await res.json();
                    console.log('[Submission] Sikeresen mentve a szerverre! ID:', savedAd._id);
                    success = true;
                } else {
                    const errData = await res.json().catch(() => ({}));
                    console.error('[Submission] Backend hiba:', res.status, errData.message || '');
                }
            } catch (err) {
                console.warn('[Submission] Backend kapcsolódási hiba:', err.message);
            }

            // 2. Fallback to Local Storage
            if (!success) {
                console.warn('[Submission] Szerverre mentés sikertelen, localStorage fallback...');
                try {
                    const localAdData = { ...adData, id: localId };
                    const localAds = JSON.parse(localStorage.getItem('lunnarLocalAds') || '[]');
                    if (editingAdId) {
                        const idx = localAds.findIndex(a => a.id === editingAdId || a._id === editingAdId);
                        if (idx !== -1) {
                            localAds[idx] = { ...localAds[idx], ...localAdData };
                        } else {
                            localAds.push(localAdData);
                        }
                    } else {
                        localAds.push(localAdData);
                    }
                    localStorage.setItem('lunnarLocalAds', JSON.stringify(localAds));
                    success = true;
                } catch (lsErr) {
                    console.error('[Submission] Local storage error:', lsErr);
                    if (lsErr.name === 'QuotaExceededError' || lsErr.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                        throw new Error('A tárhelyed megtelt! Kérjük, használj kevesebb vagy kisebb felbontású képet.');
                    } else {
                        throw new Error('Nem sikerült helyileg elmenteni a hirdetést.');
                    }
                }
            }

            if (success) {
                showToast(editingAdId ? 'Hirdetés sikeresen frissítve!' : 'Hirdetés sikeresen beküldve! 🎉', 'success');
                modal.classList.remove('active');
                form.reset();
                preview.innerHTML = '<div class="preview-placeholder">A feltöltött képek itt fognak megjelenni</div>';
                base64Images = [];
                editingAdId = null;
                document.body.style.overflow = '';
                fetchAds();
                if (window.location.hash === '#view-profile') renderProfile();
            }
        } catch (error) {
            console.error('[Submission] CRITICAL ERROR:', error);
            showToast(error.message || 'Hiba történt a beküldés során.', 'error');
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnText; }
        }
    });
}



async function fetchAdminAds() {
    const grid = document.getElementById('admin-ad-list');
    let apiAds = [];
    try {
        const res = await fetch(`${API_BASE_URL}/admin/ads`);
        if (res.ok) apiAds = await res.json();
    } catch (err) {
        console.warn('Backend error in admin fetch');
    }

    const localAds = JSON.parse(localStorage.getItem('lunnarLocalAds') || '[]');
    // Show ALL ads for management in admin view
    const combined = [...apiAds, ...localAds];

    if (combined.length === 0) {
        grid.innerHTML = '<div class="placeholder">NINCSENEK MEGJELENÍTHETŐ HIRDETÉSEK</div>';
        return;
    }
    renderAdminAds(combined);
}

function renderAdminAds(ads) {
    const grid = document.getElementById('admin-ad-list');
    grid.innerHTML = ads.map(ad => {
        const displayImages = ad.images && ad.images.length > 0 ? ad.images : [ad.img];
        return `
        <div class="car-card" style="cursor:default;">
            <div class="car-image-mod" style="display: flex; gap: 2px; overflow-x: auto; height: 120px; background: #000;">
                ${displayImages.map(img => `<img src="${img}" style="height: 100%; flex-shrink: 0; object-fit: cover; width: 100px;">`).join('')}
            </div>
            <div class="car-details">
                <span class="status-badge status-${ad.status}">${ad.status}</span>
                <div class="car-title">${ad.brand} ${ad.model}</div>
                <div class="car-price">${formatPrice(ad.price)}</div>
                <div style="font-size: 0.8rem; margin-top: 0.5rem; opacity: 0.8;">
                    📞 ${ad.phone || 'Nincs tel.'} | 📧 ${ad.email || 'Nincs email'}
                </div>
                <div class="admin-actions" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem;">
                    ${ad.status === 'pending' ? `
                        <button class="admin-btn approve" onclick="moderateAd('${ad._id || ad.id}', 'approved')">Elfogad</button>
                        <button class="admin-btn reject" onclick="moderateAd('${ad._id || ad.id}', 'rejected')">Elutasít</button>
                    ` : `
                        <button class="admin-btn" disabled style="opacity:0.5">${ad.status === 'approved' ? 'Elfogadva' : 'Elutasítva'}</button>
                    `}
                    <button class="admin-btn reject" onclick="deleteAd('${ad._id || ad.id}')" style="background:#dc2626">Törlés</button>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

async function moderateAd(id, status) {
    // Check if it's a local ad
    const localAds = JSON.parse(localStorage.getItem('lunnarLocalAds') || '[]');
    const localIdx = localAds.findIndex(ad => ad.id === id);

    if (localIdx !== -1) {
        localAds[localIdx].status = status;
        localStorage.setItem('lunnarLocalAds', JSON.stringify(localAds));
        fetchAdminAds();
        fetchAds();
        if (window.location.hash === '#view-profile') renderProfile();
        return;
    }

    // Otherwise try API
    try {
        const res = await fetch(`${API_BASE_URL}/admin/ads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            fetchAdminAds();
            fetchAds();
            if (window.location.hash === '#view-profile') renderProfile();
        }
    } catch (err) {
        console.error('Moderation error:', err);
        showToast('Hiba a moderálás során. Ha ez egy szerver-oldali hirdetés, a szervernek futnia kell!', 'error');
    }
}

async function deleteAd(id) {
    if (!confirm('Biztosan törölni szeretnéd ezt a hirdetést?')) return;

    // Local ad check
    const localAds = JSON.parse(localStorage.getItem('lunnarLocalAds') || '[]');
    const localIdx = localAds.findIndex(ad => ad.id === id);

    if (localIdx !== -1) {
        localAds.splice(localIdx, 1);
        localStorage.setItem('lunnarLocalAds', JSON.stringify(localAds));
        fetchAdminAds();
        fetchAds();
        if (window.location.hash === '#view-profile') renderProfile();
        return;
    }

    // API ad check
    try {
        const res = await fetch(`${API_BASE_URL}/admin/ads/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            fetchAdminAds();
            fetchAds();
            if (window.location.hash === '#view-profile') renderProfile();
        }
    } catch (err) {
        showToast('Hiba a törlés során. A szervernek futnia kell!', 'error');
    }
}

// ===== ADMIN CONFIG =====
const ADMIN_EMAIL = 'bubuproaa11@gmail.com'; // Ezzel az email címmel lehet admin belépést kezdeményezni
const ADMIN_HASH = 'lh_15l1om_bGV2aTEyMw=='; // A 'levi123' jelszó titkosított formája

function toggleAdmin() {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) return;

    if (adminPanel.style.display === 'none') {
        // 1. Check if logged in
        if (!token || !currentUser) {
            showToast('Az adminisztrációhoz be kell jelentkezned!', 'error');
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            return;
        }

        // 2. Check if admin email matches
        if (currentUser.email !== ADMIN_EMAIL) {
            showToast('Nincs jogosultságod az adminisztrációs panelhez!', 'error');
            console.warn(`[Security] Unauthorized admin access attempt by: ${currentUser.email}`);
            return;
        }

        // 3. Prompt for password
        const pw = prompt('Kérjük, add meg az admin jelszót:');
        if (!pw) return;

        if (simpleHash(pw) === ADMIN_HASH) {
            adminPanel.style.display = 'block';
            fetchAdminAds();
            adminPanel.scrollIntoView({ behavior: 'smooth' });
            showToast('Adminisztrációs panel megnyitva.', 'success');
        } else {
            showToast('Helytelen jelszó!', 'error');
            console.warn(`[Security] Failed admin password attempt for: ${currentUser.email}`);
        }
    } else {
        adminPanel.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ===== TOAST NOTIFICATION SYSTEM =====
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.classList.add('removing'); setTimeout(()=>this.parentElement.remove(), 300)">✕</button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// ===== LOCAL AUTH HELPERS =====
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return 'lh_' + Math.abs(hash).toString(36) + '_' + btoa(str).slice(0, 12);
}

function getUsers() {
    return JSON.parse(localStorage.getItem('lunnarUsers') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('lunnarUsers', JSON.stringify(users));
}

function generateLocalToken(userId) {
    return 'lt_' + userId + '_' + Date.now().toString(36);
}

// ===== AUTH LOGIC =====

// ========================================================
// EMAILJS BEÁLLÍTÁS
// 1. Menj: https://www.emailjs.com és regisztrálj (ingyenes)
// 2. Add Services → Gmail (vagy más) → másold az Service ID-t
// 3. Add Email Templates (KETTŐ sablon kell):
//    a) Hitelesítési sablon (reg_verify_template): 
//       To: {{to_email}}, Subject: "Lunnar – Fiók hitelesítés"
//       Body: "Hitelesítési kódod: {{code}}"
//    b) Jelszó visszaállítás sablon (reset_pw_template):
//       To: {{to_email}}, Subject: "Lunnar – Jelszó visszaállítás"
//       Body: "Visszaállítási kódod: {{code}}"
// 4. Account → General → másold a Public Key-t
// 5. Töltsd ki az alábbi értékeket:
// ========================================================
const EMAILJS_CONFIG = {
    PUBLIC_KEY: 'O6bdBo6yyIOOiouPr',       // pl. 'aBcDeFgHiJkLmNoP'
    SERVICE_ID: 'service_zlzjea5',        // pl. 'service_abc123'
    VERIFY_TEMPLATE_ID: 'template_nhph4mk',// pl. 'template_abc123'
    RESET_TEMPLATE_ID: 'template_hbxe8w3', // pl. 'template_xyz789'
};

// EmailJS inicializálás
(function initEmailJS() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init({ publicKey: EMAILJS_CONFIG.PUBLIC_KEY });
    }
})();

// Valódi email küldő függvény
async function sendEmailCode(toEmail, code, type = 'verify') {
    if (typeof emailjs === 'undefined') {
        showToast('Email szolgáltatás nem elérhető!', 'error');
        return false;
    }
    const templateId = type === 'verify'
        ? EMAILJS_CONFIG.VERIFY_TEMPLATE_ID
        : EMAILJS_CONFIG.RESET_TEMPLATE_ID;

    try {
        await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, templateId, {
            to_email: toEmail,
            code: code,
        });
        return true;
    } catch (err) {
        console.error('EmailJS hiba:', err);
        showToast('Email küldési hiba: ' + (err.text || err.message || 'Ismeretlen hiba'), 'error');
        return false;
    }
}

// In-memory stores for verification codes
let pendingVerifications = {}; // email -> { code, userData }
let pendingResets = {};        // email -> code

function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function initAuth() {
    // ===== ADMIN BOOTSTRAP / RECOVERY =====
    const users = getUsers();
    const adminUser = users.find(u => u.email === ADMIN_EMAIL);
    if (!adminUser) {
        users.push({
            id: 'admin_root',
            username: 'admin',
            email: ADMIN_EMAIL,
            passwordHash: ADMIN_HASH,
            createdAt: new Date().toISOString()
        });
        saveUsers(users);
    } else if (adminUser.passwordHash !== ADMIN_HASH) {
        adminUser.passwordHash = ADMIN_HASH;
        saveUsers(users);
    }

    const loginNavBtn = document.getElementById('login-nav-btn');
    const logoutNavBtn = document.getElementById('logout-nav-btn');
    const authModal = document.getElementById('auth-modal');
    const authClose = document.getElementById('auth-close');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const forgotModal = document.getElementById('forgot-modal');
    const verifyModal = document.getElementById('verify-modal');

    function updateAuthUI() {
        const userInfo = document.getElementById('user-info');
        const userDisplayName = document.getElementById('user-display-name');
        const userAvatarLetter = document.getElementById('user-avatar-letter');
        const adminNavLink = document.getElementById('admin-nav-link');

        if (token && currentUser) {
            if (loginNavBtn) loginNavBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'block';
            if (userDisplayName) userDisplayName.textContent = currentUser.username.toUpperCase();
            if (userAvatarLetter) userAvatarLetter.textContent = currentUser.username.charAt(0).toUpperCase();

            // Show admin link if user is administrator
            if (adminNavLink) {
                adminNavLink.style.display = (currentUser.email === ADMIN_EMAIL) ? 'block' : 'none';
            }
        } else {
            if (loginNavBtn) loginNavBtn.style.display = 'block';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    updateAuthUI();

    // Profile Dropdown Toggle
    const profileToggle = document.getElementById('profile-toggle');
    if (profileToggle) {
        profileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const userMenu = document.getElementById('user-info');
            if (userMenu) userMenu.classList.toggle('active');
        });
    }

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        const userMenu = document.getElementById('user-info');
        if (!userMenu) return;

        // If clicking outside the menu OR clicking a dropdown item link
        if (!userMenu.contains(e.target) || e.target.closest('.user-dropdown-item')) {
            userMenu.classList.remove('active');
        }
    });

    if (loginNavBtn) loginNavBtn.addEventListener('click', () => {
        if (!authModal) return;
        authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    if (logoutNavBtn) logoutNavBtn.addEventListener('click', () => {
        token = null;
        currentUser = null;
        localStorage.removeItem('lunnarToken');
        localStorage.removeItem('lunnarUser');
        localStorage.removeItem('lunnarFavorites'); // Clear local favorites on logout
        favorites = [];
        updateAuthUI();
        showToast('Sikeresen kijelentkeztél!', 'info');
        window.location.hash = '#home';
    });

    if (authClose) authClose.addEventListener('click', () => {
        authModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Click outside modal closes it
    if (authModal) authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tabBtns.forEach(b => b.style.opacity = '0.6');
            btn.style.opacity = '1';

            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            const targetContent = document.getElementById(btn.dataset.tab);
            if (targetContent) targetContent.style.display = 'block';
        });
    });

    // Handle switch links (Don't have an account? etc.)
    document.querySelectorAll('.auth-switch-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.dataset.tab;
            const tabBtn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
            if (tabBtn) tabBtn.click();
        });
    });

    // ===== REGISTRATION =====
    if (regForm) regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim().toLowerCase();
        const password = document.getElementById('reg-password').value;
        const passwordConfirm = document.getElementById('reg-password-confirm').value;
        const termsCheckbox = document.getElementById('reg-terms');
        const submitBtn = regForm.querySelector('.auth-submit-btn');

        // Validation
        if (username.length < 3) { showToast('A felhasználónév legalább 3 karakter legyen!', 'error'); return; }
        if (!email.includes('@') || !email.includes('.')) { showToast('Kérjük, adj meg egy érvényes email címet!', 'error'); return; }
        if (password.length < 6) { showToast('A jelszó legalább 6 karakter legyen!', 'error'); return; }
        if (!/[A-Z]/.test(password)) { showToast('A jelszónak tartalmaznia kell legalább egy nagybetűt!', 'error'); return; }
        if (!/[0-9]/.test(password)) { showToast('A jelszónak tartalmaznia kell legalább egy számot!', 'error'); return; }
        if (password !== passwordConfirm) { showToast('A két jelszó nem egyezik!', 'error'); return; }
        if (termsCheckbox && !termsCheckbox.checked) { showToast('El kell fogadnod az Általános Szerződési Feltételeket!', 'error'); return; }

        const users = getUsers();
        if (users.find(u => u.email === email)) { showToast('Ez az email cím már regisztrálva van!', 'error'); return; }
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) { showToast('Ez a felhasználónév már foglalt!', 'error'); return; }

        // Küldés indul – loading állapot
        if (submitBtn) { submitBtn.disabled = true; submitBtn.querySelector('span').textContent = 'KÜLDÉS...'; }

        const code = generateCode();
        pendingVerifications[email] = {
            code,
            userData: { username, email, password } // Store plain password for the server
        };

        // Valódi email küldés EmailJS-sel
        const sent = await sendEmailCode(email, code, 'verify');

        if (submitBtn) { submitBtn.disabled = false; submitBtn.querySelector('span').textContent = 'FIÓK LÉTREHOZÁSA'; }

        if (!sent) {
            delete pendingVerifications[email];
            return; // Hiba toast már megjelent a sendEmailCode-ban
        }

        // Email elküldve – megnyitjuk a hitelesítési modalt
        authModal.classList.remove('active');
        document.getElementById('verify-email-display').textContent = email;
        document.getElementById('verify-code').value = '';
        verifyModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        showToast('Hitelesítési kódot elküldtük az email címedre! 📧 Ellenőrizd a postafiókodat.', 'success', 6000);
        regForm.reset();
        resetPasswordRequirements();
    });

    // ===== EMAIL VERIFICATION =====
    const verifyForm = document.getElementById('verify-form');
    if (verifyForm) verifyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const codeInput = document.getElementById('verify-code').value.trim();
        const emailDisplay = document.getElementById('verify-email-display').textContent;
        const pending = pendingVerifications[emailDisplay];

        if (!pending) { showToast('Hiba: nincs aktív hitelesítési kérelem.', 'error'); return; }
        if (codeInput !== pending.code) { showToast('Helytelen kód! Próbáld újra.', 'error'); return; }

        // Code matches – save user to BACKEND
        const userData = pending.userData;

        console.log('[AUTH] Regisztrációs adatok küldése a szervernek...', userData.email);
        fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        })
            .then(res => res.json())
            .then(data => {
                console.log('[AUTH] Szerver válasz:', data);
                delete pendingVerifications[emailDisplay];
                verifyModal.classList.remove('active');
                document.body.style.overflow = '';

                if (data.message.includes('Sikeres')) {
                    showToast('Fiókod sikeresen létrehozva! 🎉 Most már bejelentkezhetsz.', 'success', 6000);
                    // Open login modal and prefill email
                    authModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    document.querySelector('[data-tab="login-tab"]').click();
                    setTimeout(() => {
                        document.getElementById('login-email').value = emailDisplay;
                        document.getElementById('login-password').focus();
                    }, 100);
                } else {
                    showToast(data.message, 'error');
                }
            })
            .catch(err => {
                showToast('Hiba a regisztráció során: ' + err.message, 'error');
            });
    });

    // Resend code
    const resendBtn = document.getElementById('resend-code');
    if (resendBtn) resendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const emailDisplay = document.getElementById('verify-email-display').textContent;
        const pending = pendingVerifications[emailDisplay];
        if (!pending) { showToast('Nincs aktív hitelesítési kérelem.', 'error'); return; }

        const newCode = generateCode();
        pending.code = newCode;
        sendEmailCode(emailDisplay, newCode, 'verify').then(sent => {
            if (sent) showToast('Kódot újraküldtük! Ellenőrizd a postafiókodat.', 'success');
        });
    });

    // ===== LOGIN =====
    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        if (!email || !password) { showToast('Kérjük, töltsd ki az összes mezőt!', 'error'); return; }

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                token = data.token;
                currentUser = { 
                    username: data.username, 
                    email: email, 
                    id: data.userId,
                    isVerified: data.isVerified || false,
                    phone: data.phone || '',
                    sellerRating: data.sellerRating || 0,
                    totalRatings: data.totalRatings || 0
                };
                localStorage.setItem('lunnarToken', token);
                localStorage.setItem('lunnarUser', JSON.stringify(currentUser));

                // Sync Favorites: Merge server favorites with any existing local ones
                const serverFavorites = (data.favorites || []).map(String);
                const localFavorites = JSON.parse(localStorage.getItem('lunnarFavorites') || '[]').map(String);
                const mergedFavorites = Array.from(new Set([...serverFavorites, ...localFavorites]));
                favorites = mergedFavorites;
                localStorage.setItem('lunnarFavorites', JSON.stringify(favorites));
                syncFavoritesWithBackend(); // Push merged list back to server

                showToast(`Üdvözöljük, ${data.username}! 🎉`, 'success');
                authModal.classList.remove('active');
                document.body.style.overflow = '';
                loginForm.reset();
                updateAuthUI();
            } else {
                showToast(data.message || 'Hiba a bejelentkezés során', 'error');
            }
        } catch (err) {
            showToast('Szerver hiba: ' + err.message, 'error');
        }
    });

    // ===== FORGOT PASSWORD link =====
    const forgotLink = document.querySelector('.forgot-password');
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            authModal.classList.remove('active');
            document.getElementById('forgot-step-1').style.display = 'block';
            document.getElementById('forgot-step-2').style.display = 'none';
            document.getElementById('forgot-email').value = document.getElementById('login-email').value || '';
            document.getElementById('forgot-form').reset();
            forgotModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close forgot modal
    const forgotClose = document.getElementById('forgot-close');
    if (forgotClose) forgotClose.addEventListener('click', () => {
        forgotModal.classList.remove('active');
        document.body.style.overflow = '';
    });
    if (forgotModal) forgotModal.addEventListener('click', (e) => {
        if (e.target === forgotModal) { forgotModal.classList.remove('active'); document.body.style.overflow = ''; }
    });

    // Back to login from forgot
    const backToLoginBtn = document.getElementById('back-to-login-from-forgot');
    if (backToLoginBtn) backToLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        forgotModal.classList.remove('active');
        authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // STEP 1: Submit email for reset
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value.trim().toLowerCase();
        const submitBtn = forgotForm.querySelector('.auth-submit-btn');
        const users = getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            showToast('Nem található fiók ezzel az email címmel!', 'error');
            return;
        }

        // Loading állapot
        if (submitBtn) { submitBtn.disabled = true; submitBtn.querySelector('span').textContent = 'KÜLDÉS...'; }

        const code = generateCode();
        pendingResets[email] = code;

        // Valódi email küldés
        const sent = await sendEmailCode(email, code, 'reset');

        if (submitBtn) { submitBtn.disabled = false; submitBtn.querySelector('span').textContent = 'KÓD KÜLDÉSE'; }

        if (!sent) {
            delete pendingResets[email];
            return; // Hiba toast már megjelent
        }

        // Email elküldve – megjelenítjük a 2. lépést
        document.getElementById('forgot-step-1').style.display = 'none';
        document.getElementById('forgot-step-2').style.display = 'block';
        document.getElementById('forgot-code').value = '';
        document.getElementById('forgot-new-pw').value = '';
        resetForgotPasswordRequirements();

        showToast('Visszaállítási kódot elküldtük! 📧 Ellenőrizd a postafiókodat.', 'success', 6000);
    });

    // STEP 2: Verify code and set new password
    const forgotResetForm = document.getElementById('forgot-reset-form');
    if (forgotResetForm) forgotResetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value.trim().toLowerCase();
        const codeInput = document.getElementById('forgot-code').value.trim();
        const newPw = document.getElementById('forgot-new-pw').value;

        if (!pendingResets[email]) { showToast('Hiba: nincs aktív visszaállítási kérelem.', 'error'); return; }
        if (codeInput !== pendingResets[email]) { showToast('Helytelen kód! Próbáld újra.', 'error'); return; }
        if (newPw.length < 6) { showToast('A jelszó legalább 6 karakter legyen!', 'error'); return; }
        if (!/[A-Z]/.test(newPw)) { showToast('A jelszónak nagybetűt kell tartalmaznia!', 'error'); return; }
        if (!/[0-9]/.test(newPw)) { showToast('A jelszónak számot kell tartalmaznia!', 'error'); return; }

        const users = getUsers();
        const userIdx = users.findIndex(u => u.email === email);
        if (userIdx === -1) { showToast('Felhasználó nem található!', 'error'); return; }

        users[userIdx].passwordHash = simpleHash(newPw);
        saveUsers(users);
        delete pendingResets[email];

        forgotModal.classList.remove('active');
        document.body.style.overflow = '';
        showToast('Jelszavad sikeresen megváltozott! 🎉 Most már bejelentkezhetsz.', 'success', 6000);

        // Open login modal and prefill email
        authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.querySelector('[data-tab="login-tab"]').click();
        setTimeout(() => {
            document.getElementById('login-email').value = email;
            document.getElementById('login-password').focus();
        }, 100);
    });

    // ===== PASSWORD TOGGLES (all, including new modals) =====
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.target);
            if (target) {
                const isPassword = target.type === 'password';
                target.type = isPassword ? 'text' : 'password';
                btn.innerHTML = isPassword ? '👁' : '◌';
            }
        });
    });

    // ===== PASSWORD REQUIREMENTS — REGISTRATION =====
    const regPasswordInput = document.getElementById('reg-password');
    if (regPasswordInput) {
        regPasswordInput.addEventListener('input', () => {
            applyPasswordRequirements(regPasswordInput.value,
                document.getElementById('req-length'),
                document.getElementById('req-upper'),
                document.getElementById('req-number')
            );
        });
    }

    // ===== PASSWORD REQUIREMENTS — FORGOT PASSWORD RESET =====
    const forgotNewPwInput = document.getElementById('forgot-new-pw');
    if (forgotNewPwInput) {
        forgotNewPwInput.addEventListener('input', () => {
            applyPasswordRequirements(forgotNewPwInput.value,
                document.getElementById('freq-length'),
                document.getElementById('freq-upper'),
                document.getElementById('freq-number')
            );
        });
    }
}

// Shared helper: update requirement checkmarks
function applyPasswordRequirements(pw, elLength, elUpper, elNumber) {
    if (elLength) { elLength.classList.toggle('met', pw.length >= 6); }
    if (elUpper) { elUpper.classList.toggle('met', /[A-Z]/.test(pw)); }
    if (elNumber) { elNumber.classList.toggle('met', /[0-9]/.test(pw)); }
}

function resetPasswordRequirements() {
    ['req-length', 'req-upper', 'req-number'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('met');
    });
}

function resetForgotPasswordRequirements() {
    ['freq-length', 'freq-upper', 'freq-number'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('met');
    });
}

function initCompareListeners() {
    const openCompareBtn = document.getElementById('open-compare-btn');
    if (openCompareBtn) {
        openCompareBtn.addEventListener('click', openCompareModal);
    }

    const clearCompareBtn = document.getElementById('clear-compare-btn');
    if (clearCompareBtn) {
        clearCompareBtn.addEventListener('click', () => {
            compareList = [];
            renderCompareBar();
            document.querySelectorAll('.toggle-compare-btn').forEach(b => b.textContent = '+ ÖSSZEHASONLÍT');
        });
    }

    const compareClose = document.getElementById('compare-close');
    if (compareClose) {
        compareClose.addEventListener('click', () => {
            document.getElementById('compare-modal').classList.remove('active');
        });
    }
}

async function syncFavoritesWithBackend() {
    // Local-only: favorites are already in localStorage
    // Try backend sync if available, silently fail otherwise
    if (!token) return;
    try {
        await fetch(`${API_BASE_URL}/user/favorites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ favorites })
        });
    } catch (e) { /* Backend not available, that's fine */ }
}

async function renderProfile() {
    if (!token || !currentUser) return;

    // 1. Basic User Info
    const usernameEl = document.getElementById('profile-username');
    const emailEl = document.getElementById('profile-email');
    const avatarEl = document.getElementById('profile-avatar');

    if (usernameEl) usernameEl.textContent = currentUser.username.toUpperCase();
    if (emailEl) emailEl.textContent = currentUser.email;
    if (avatarEl) avatarEl.textContent = currentUser.username.charAt(0).toUpperCase();

    // 2. Stats Calculation
    const localAds = JSON.parse(localStorage.getItem('lunnarLocalAds') || '[]');
    const myAds = localAds.filter(ad => ad.ownerEmail === currentUser.email || ad.ownerId === currentUser.id);

    const favsIds = JSON.parse(localStorage.getItem('lunnarFavorites') || '[]');
    const favsActive = allCars.filter(c => {
        const idStr = c.id ? c.id.toString() : '';
        const _idStr = c._id ? c._id.toString() : '';
        return favsIds.includes(idStr) || favsIds.includes(_idStr);
    });

    const adsCountEl = document.getElementById('stat-ads-count');
    const favsCountEl = document.getElementById('stat-favs-count');

    if (adsCountEl) adsCountEl.textContent = myAds.length;
    if (favsCountEl) favsCountEl.textContent = favsActive.length;

    // 2.5 Update Verification & Ratings badges
    const verifiedBadge = document.getElementById('profile-verified-badge');
    const verifyBtn = document.getElementById('verify-account-btn');
    const ratingDisplay = document.getElementById('profile-rating-display');
    const ratingValue = document.getElementById('profile-rating-value');
    const ratingCount = document.getElementById('profile-rating-count');

    if (currentUser.isVerified) {
        if(verifiedBadge) verifiedBadge.style.display = 'inline-block';
        if(verifyBtn) verifyBtn.style.display = 'none';
    } else {
        if(verifiedBadge) verifiedBadge.style.display = 'none';
        if(verifyBtn) verifyBtn.style.display = 'block';
    }

    if (currentUser.totalRatings > 0) {
        if(ratingDisplay) ratingDisplay.style.display = 'block';
        if(ratingValue) ratingValue.textContent = Number(currentUser.sellerRating).toFixed(1);
        if(ratingCount) ratingCount.textContent = `(${currentUser.totalRatings} értékelés)`;
    } else {
        if(ratingDisplay) ratingDisplay.style.display = 'none';
    }

    // Hitelesítés logikája (Szimulált)
    if (verifyBtn) {
        verifyBtn.onclick = async () => {
            const code = prompt('Kérjük, add meg az SMS-ben kapott 6 számjegyű kódot (Szimuláció: írj be bármit):');
            if (code) {
                try {
                    const res = await fetch(`${API_BASE_URL}/auth/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ code })
                    });
                    if (res.ok) {
                        currentUser.isVerified = true;
                        localStorage.setItem('lunnarUser', JSON.stringify(currentUser));
                        showToast('Sikeres hitelesítés! Profilod megkapta az ellenőrzött jelvényt.', 'success');
                        renderProfile();
                    } else {
                        showToast('Hiba a hitelesítés során!', 'error');
                    }
                } catch(e) {
                    showToast('Hálózati hiba!', 'error');
                }
            }
        };
    }

    // Load actual server-side stats for views/favs
    fetch(`${API_BASE_URL}/user/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(stats => {
        const tViews = document.getElementById('stat-total-views');
        const tFavs = document.getElementById('stat-total-favs');
        if(tViews && stats.totalViews !== undefined) tViews.textContent = stats.totalViews;
        if(tFavs && stats.totalFavorites !== undefined) tFavs.textContent = stats.totalFavorites;
    })
    .catch(e => console.log('Hiba a statisztika lekérésekor', e));

    // 3. Render Listings & Favorites
    fetchMyAds();
    renderProfileFavorites();
    fetchSavedSearches();
}

let profileTabsInitialized = false;
function initProfileTabs() {
    if (profileTabsInitialized) return;
    const tabs = document.querySelectorAll('.profile-tab-btn');
    const contents = document.querySelectorAll('.profile-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.profileTab;

            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetContent = document.getElementById(`profile-tab-${target}`);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    // Profile Ads Search logic
    const adsSearchInput = document.getElementById('my-ads-search');
    if (adsSearchInput) {
        let timeout = null;
        adsSearchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                fetchMyAds(e.target.value);
            }, 300);
        });
    }

    profileTabsInitialized = true;
}


function renderProfileFavorites() {
    const grid = document.getElementById('my-favorites-list');
    if (!grid) return;

    const favIds = JSON.parse(localStorage.getItem('lunnarFavorites') || '[]');
    const favCars = allCars.filter(c => {
        const idStr = c.id ? c.id.toString() : '';
        const _idStr = c._id ? c._id.toString() : '';
        return favIds.includes(idStr) || favIds.includes(_idStr);
    });

    if (favCars.length === 0) {
        grid.innerHTML = '<div class="placeholder">NINCSENEK MÉG KEDVENCEID</div>';
        return;
    }

    renderCarsIn(favCars, grid, false);
}

async function fetchSavedSearches() {
    const grid = document.getElementById('my-searches-list');
    if (!grid) return;

    if (!token) return;

    try {
        const res = await fetch(`${API_BASE_URL}/user/saved-searches`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            renderSavedSearches(data.savedSearches);
            updateQuickSearchMenus(data.savedSearches);
        }
    } catch (e) { console.error('Hiba a mentett keresések lekérésekor', e); }
}

function updateQuickSearchMenus(searches) {
    const mainSelect = document.getElementById('quick-saved-searches');
    const sidebarSelect = document.getElementById('sidebar-quick-saved-searches');
    const mainContainer = document.getElementById('quick-saved-searches-container');
    const sidebarContainer = document.getElementById('sidebar-quick-searches-container');

    if (!searches || searches.length === 0) {
        if (mainContainer) mainContainer.style.display = 'none';
        if (sidebarContainer) sidebarContainer.style.display = 'none';
        return;
    }

    if (mainContainer) mainContainer.style.display = 'block';
    if (sidebarContainer) sidebarContainer.style.display = 'block';

    const optionsHTML = `
        <option value="">-- Válassz egy mentett keresést --</option>
        ${searches.map(s => `<option value='${JSON.stringify(s.params)}'>${s.name}</option>`).join('')}
    `;

    if (mainSelect) mainSelect.innerHTML = optionsHTML;
    if (sidebarSelect) sidebarSelect.innerHTML = optionsHTML;
}

function renderSavedSearches(searches) {
    const grid = document.getElementById('my-searches-list');
    if (!grid) return;

    if (!searches || searches.length === 0) {
        grid.innerHTML = '<div class="placeholder">NINCSENEK MENTETT KERESÉSEID</div>';
        return;
    }

    grid.innerHTML = searches.map(s => `
        <div class="saved-search-card glass-premium" style="padding:1.5rem; border-radius:12px; display:flex; justify-content:space-between; align-items:center; border: 1px solid rgba(255,255,255,0.05);">
            <div>
                <h4 style="margin:0; font-family:var(--font-heading); color:var(--text-color);">${s.name}</h4>
                <p style="margin:0.5rem 0 0; font-size:0.8rem; opacity:0.6;">
                    ${Object.entries(s.params).map(([k, v]) => `${translateKey(k)}: ${v}`).join(', ')}
                </p>
            </div>
            <div style="display:flex; gap:10px;">
                <button class="cta-mini" onclick='loadSavedSearch(${JSON.stringify(s.params)})' style="background:var(--accent-color); color:white;">Lefuttatás</button>
                <button class="cta-mini" onclick="deleteSavedSearch('${s._id}')" style="background:#ef4444; color:white;">Törlés</button>
            </div>
        </div>
    `).join('');
}

function translateKey(key) {
    const dict = {
        brand: 'Márka',
        model: 'Modell',
        minPrice: 'Min ár',
        maxPrice: 'Max ár',
        fuel: 'Üzemanyag',
        transmission: 'Váltó',
        minYear: 'Min év',
        maxYear: 'Max év',
        minHp: 'Min LE',
        maxHp: 'Max LE'
    };
    return dict[key] || key;
}

async function fetchMyAds(searchQuery = '') {
    if (!token || !currentUser) return;
    const grid = document.getElementById('my-ads-list');
    if (!grid) return;

    grid.innerHTML = '<div class="placeholder">BETÖLTÉS...</div>';

    let ads = [];
    try {
        const res = await fetch(`${API_BASE_URL}/user/ads`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) ads = await res.json();
    } catch (err) {
        console.warn('Hiba a hirdetések lekérésekor a szerverről');
    }

    const localAds = JSON.parse(localStorage.getItem('lunnarLocalAds') || '[]');
    const userLocalAds = localAds.filter(ad => ad.ownerEmail === currentUser.email || ad.ownerId === currentUser.id);

    // Merge: Server ads + local ads (filter out duplicates if they exist by ID)
    const combinedAds = [...ads];
    userLocalAds.forEach(local => {
        if (!combinedAds.find(s => s._id === local.id || s.id === local.id)) {
            combinedAds.push(local);
        }
    });

    ads = combinedAds;

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        ads = ads.filter(ad =>
            (ad.brand && ad.brand.toLowerCase().includes(query)) ||
            (ad.model && ad.model.toLowerCase().includes(query)) ||
            (ad.city && ad.city.toLowerCase().includes(query))
        );
    }

    if (ads.length === 0) {
        grid.innerHTML = searchQuery
            ? '<div class="placeholder">NINCS A KERESÉSNEK MEGFELELŐ HIRDETÉS</div>'
            : '<div class="placeholder">NINCSENEK MÉG HIRDETÉSEID</div>';
        return;
    }

    renderCarsIn(ads, grid, true);
}

function renderCarCard(car, isProfileView = false) {
    const isFavorite = favorites.includes(car.id?.toString()) || favorites.includes(car._id?.toString());
    const firstImg = car.images && car.images.length > 0 ? car.images[0] : (car.img || 'https://via.placeholder.com/400x300?text=Nincs+kép');
    const price = typeof formatPrice === 'function' ? formatPrice(car.price) : car.price + ' Ft';
    const km = typeof formatKm === 'function' ? formatKm(car.km) : car.km + ' km';

    const isOwner = currentUser && (
        car.ownerEmail === currentUser.email ||
        car.ownerId === currentUser.id ||
        car.email === currentUser.email ||
        car.seller?.toLowerCase().includes(currentUser.name?.toLowerCase()) ||
        currentUser.email === ADMIN_EMAIL
    );

    return `
        <div class="car-card glass-premium fade-in ${car.isPremium ? 'premium-ad' : ''}" data-id="${car._id || car.id}" style="${car.isPremium ? 'border: 2px solid #fbbf24; position: relative;' : ''}">
            ${car.isPremium ? '<div style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); background:#fbbf24; color:#000; padding:4px 12px; border-radius:12px; font-weight:bold; font-size:0.75rem; z-index:10; box-shadow:0 4px 10px rgba(251,191,36,0.3);">KIEMELT</div>' : ''}
            <div class="car-image" onclick="window.location.hash='#ad/${car._id || car.id}'">
                <img src="${firstImg}" alt="${car.brand} ${car.model}" loading="lazy">
                <button class="car-fav ${isFavorite ? 'active' : ''}" data-fav-id="${car._id || car.id}" title="Kedvenc">
                    ${isFavorite ? '❤️' : '🤍'}
                </button>
                <div class="car-overlay"><span>RÉSZLETEK</span></div>
            </div>
            <div class="car-info">
                <div class="car-header">
                    <h3 class="car-title" onclick="window.location.hash='#ad/${car._id || car.id}'">${car.brand} ${car.model}</h3>
                    <div class="car-price">${price}</div>
                </div>
                <div class="car-specs">
                    <span title="Évjárat">📅 ${car.year}</span>
                    <span title="Kilométer">🛣️ ${km}</span>
                    <span title="Üzemanyag">⛽ ${car.fuel}</span>
                    <span title="Váltó">⚙️ ${car.transmission || 'N/A'}</span>
                    <span title="Teljesítmény">⚡ ${car.hp || '?'} LE</span>
                </div>
                
                <div class="car-footer-meta">
                    <span>📍 ${car.city || 'Nincs megadva'}</span>
                </div>

                ${isProfileView ? `
                <div class="car-status-badge">
                    Státusz: <span class="badge-status status-${car.status || 'approved'}">${car.status || 'approved'}</span>
                </div>` : ''}

                ${isProfileView && isOwner ? `
                <div class="card-management-actions" style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:1rem;">
                    ${(currentUser && currentUser.email === ADMIN_EMAIL && car.status === 'pending') ? `
                        <button class="admin-btn approve" onclick="event.stopPropagation(); moderateAd('${car._id || car.id}', 'approved')" style="flex:1; padding: 0.5rem; font-size: 0.75rem;">Elfogad</button>
                        <button class="admin-btn reject" onclick="event.stopPropagation(); moderateAd('${car._id || car.id}', 'rejected')" style="flex:1; padding: 0.5rem; font-size: 0.75rem;">Elutasít</button>
                    ` : `
                        <button class="admin-btn edit" onclick="event.stopPropagation(); editAd('${car._id || car.id}')" style="flex:1; padding: 0.5rem; font-size: 0.75rem;">Szerkesztés</button>
                        ${!car.isPremium ? `<button class="admin-btn" onclick="event.stopPropagation(); makeAdPremium('${car._id || car.id}')" style="flex:1; padding: 0.5rem; background:#fbbf24; color:#000; font-size: 0.75rem; border:none; font-weight:bold;">🌟 Kiemelés (5000Ft)</button>` : `<div style="flex:1; padding: 0.5rem; background:#fbbf24; color:#000; font-size: 0.75rem; text-align:center; border-radius:4px; font-weight:bold;">🌟 Kiemelve</div>`}
                    `}
                    <button class="admin-btn delete" onclick="event.stopPropagation(); deleteAd('${car._id || car.id}')" style="flex:1; padding: 0.5rem; background:#dc2626; font-size: 0.75rem; border:none;">Törlés</button>
                </div>
                ` : `
                <div class="card-bottom-actions" style="margin-top: 1rem; display: flex; justify-content: flex-end;">
                    <button class="cta-button secondary toggle-compare-btn" data-compare-id="${car._id || car.id}" style="padding: 0.3rem 0.8rem; font-size: 0.7rem;">+ ÖSSZEHASONLÍT</button>
                </div>
                `}
            </div>
        </div>
    `;
}

async function editAd(id) {
    // 1. Find the ad
    const localAds = JSON.parse(localStorage.getItem('lunnarLocalAds') || '[]');
    let ad = localAds.find(a => a.id === id || a._id === id);

    // If not in local, it might be in allCars (from API)
    if (!ad) ad = allCars.find(a => a.id === id || a._id === id);

    if (!ad) {
        showToast('Hirdetés nem található!', 'error');
        return;
    }

    // 2. Open modal and fill data
    editingAdId = id;
    const modal = document.getElementById('submission-modal');
    const modalTitle = modal.querySelector('.modal-title');
    if (modalTitle) modalTitle.textContent = 'HIRDETÉS SZERKESZTÉSE';

    // Fill fields
    const subBrand = document.getElementById('sub-brand');
    if (subBrand) {
        subBrand.value = ad.brand;
        subBrand.dispatchEvent(new Event('change'));
    }

    // Wait for model cascade
    setTimeout(() => {
        const subModel = document.getElementById('sub-model');
        if (subModel) subModel.value = ad.model;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        };

        setVal('sub-year', ad.year);
        setVal('sub-price', ad.price);
        setVal('sub-fuel', ad.fuel);
        setVal('sub-transmission', ad.transmission);
        setVal('sub-km', ad.km);
        setVal('sub-hp', ad.hp);
        setVal('sub-ccm', ad.ccm);
        setVal('sub-city', ad.city);
        setVal('sub-phone', ad.phone || '');
        setVal('sub-email', ad.email || '');
        setVal('sub-desc', ad.description || '');

        // Handle images - we need to access the variable in initSubmission closure scope or globalize it
        if (typeof window.setSubmissionImages === 'function') {
            window.setSubmissionImages([...(ad.images || [ad.img])]);
        }
    }, 100);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}


// Global exposure for onclick
window.moderateAd = moderateAd;
window.deleteAd = deleteAd;
window.toggleAdmin = toggleAdmin;
window.editAd = editAd;

// ===== SIDEBAR SEARCH =====
function initSidebarSearch() {
    const toggle = document.getElementById('nav-search-btn');
    const sidebar = document.getElementById('sidebar-search');
    const closeBtn = document.getElementById('sidebar-search-close');
    const submitBtn = document.getElementById('sidebar-search-submit');
    const resetBtn = document.getElementById('sidebar-search-reset');
    const sidebarBrand = document.getElementById('sidebar-brand');
    const sidebarModel = document.getElementById('sidebar-model');

    if (!toggle || !sidebar) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    // Populate brand select
    const sortedBrands = Object.keys(BRANDS_DATA).sort();
    sidebarBrand.innerHTML = '<option value="">Összes márka</option>' +
        sortedBrands.map(b => `<option value="${b}">${b}</option>`).join('');

    // Initialize custom selects for sidebar
    sidebar.querySelectorAll('select').forEach(s => new CustomSelect(s));

    // Brand → Model cascade
    sidebarBrand.addEventListener('change', () => {
        const brand = sidebarBrand.value;
        if (brand && BRANDS_DATA[brand]) {
            sidebarModel.disabled = false;
            const groups = getModelGroups(brand, BRANDS_DATA[brand].models);
            let html = '<option value="">Összes modell</option>';

            Object.entries(groups).forEach(([groupName, models]) => {
                html += `<optgroup label="${groupName}">`;
                html += `<option value="group:${groupName}">${groupName} (mind)</option>`;
                models.forEach(m => {
                    html += `<option value="${m}">${m}</option>`;
                });
                html += `</optgroup>`;
            });
            sidebarModel.innerHTML = html;
        } else {
            sidebarModel.disabled = true;
            sidebarModel.innerHTML = '<option value="">Előbb válassz márkát</option>';
        }

        sidebarModel.value = "";
        sidebarModel.selectedIndex = 0;

        // Force the CustomSelect widget to fully rebuild
        if (sidebarModel._customSelect) {
            sidebarModel._customSelect.rebuild();
        }
    });

    // Open/Close sidebar
    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    toggle.addEventListener('click', openSidebar);
    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Sync sidebar values to main form and search
    submitBtn.addEventListener('click', () => {
        // Sync brand
        const mainBrand = document.getElementById('brand-select');
        mainBrand.value = sidebarBrand.value;
        mainBrand.dispatchEvent(new Event('change'));

        // Wait for model select to update, then sync model
        setTimeout(() => {
            const mainModel = document.getElementById('model-select');
            if (sidebarModel.value) mainModel.value = sidebarModel.value;
            mainModel.dispatchEvent(new Event('change'));

            // Sync fuel
            document.getElementById('fuel-select').value = document.getElementById('sidebar-fuel').value;

            // Sync price
            document.getElementById('price-from').value = document.getElementById('sidebar-price-from').value;
            document.getElementById('price-to').value = document.getElementById('sidebar-price-to').value;

            // Sync year
            document.getElementById('year-from').value = document.getElementById('sidebar-year-from').value;
            document.getElementById('year-to').value = document.getElementById('sidebar-year-to').value;

            // Sync km
            document.getElementById('km-from').value = document.getElementById('sidebar-km-from').value;
            document.getElementById('km-to').value = document.getElementById('sidebar-km-to').value;

            // Sync Distance
            document.getElementById('city-search').value = document.getElementById('sidebar-city').value;
            document.getElementById('distance-select').value = document.getElementById('sidebar-distance').value;

            filterCars();
            closeSidebar();
            document.getElementById('listings').scrollIntoView({ behavior: 'smooth' });
        }, 100);
    });

    // Reset
    resetBtn.addEventListener('click', () => {
        sidebarBrand.value = '';
        sidebarModel.disabled = true;
        sidebarModel.innerHTML = '<option value="">Előbb válassz márkát</option>';
        document.getElementById('sidebar-fuel').value = '';
        document.getElementById('sidebar-price-from').value = '';
        document.getElementById('sidebar-price-to').value = '';
        document.getElementById('sidebar-year-from').value = '';
        document.getElementById('sidebar-year-to').value = '';
        document.getElementById('sidebar-km-from').value = '';
        document.getElementById('sidebar-km-to').value = '';
        document.getElementById('sidebar-city').value = '';
        document.getElementById('sidebar-distance').value = '';

        // Also reset main form
        const mainForm = document.getElementById('car-search-form');
        if (mainForm) mainForm.reset();
        const modelSelect = document.getElementById('model-select');
        modelSelect.disabled = true;
        modelSelect.innerHTML = '<option value="">Előbb válassz márkát</option>';
        if (modelSelect._customSelect) modelSelect._customSelect.rebuild();

        filteredCars = [...allCars];
        renderCars(filteredCars);
        updateSearchCount();
    });

    // Escape key closes sidebar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
    });
}

// ===== AI CHATBOT =====
function initAiChat() {
    const toggle = document.getElementById('ai-chat-toggle');
    const closeBtn = document.getElementById('ai-chat-close');
    const windowEl = document.getElementById('ai-chat-window');
    const input = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-chat-send');
    const messages = document.getElementById('ai-chat-messages');

    if (!toggle || !windowEl) return;

    // Toggle window
    toggle.addEventListener('click', () => {
        windowEl.classList.toggle('open');
        if (windowEl.classList.contains('open')) {
            input.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        windowEl.classList.remove('open');
    });

    // Send message on Enter or Click
    const sendMessage = () => {
        const text = input.value.trim();
        if (!text) return;

        appendMessage(text, 'user-message', false);
        input.value = '';

        // Show typing indicator
        const typing = document.createElement('div');
        typing.className = 'message ai-message ai-typing';
        typing.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;

        // Process with slight delay for natural feel
        setTimeout(() => {
            if (typing.parentElement) typing.remove();
            processChatQuery(text);
        }, 400 + Math.random() * 400);
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function appendMessage(text, className, isHtml = true) {
        const msg = document.createElement('div');
        msg.className = `message ${className}`;
        if (isHtml) {
            // Convert \n to <br> and allow safe HTML
            msg.innerHTML = text.replace(/\n/g, '<br>');
        } else {
            msg.textContent = text;
        }
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    async function processChatQuery(text) {
        // Use LUNNAR_AI engine
        const result = await LUNNAR_AI.generateResponse(text);

        if (result.filters && result.filters.hasFilters) {
            const { hasFilters, ...cleanFilters } = result.filters;
            applyDetectedFilters(cleanFilters);
            appendMessage(result.reply, 'ai-message', true);
        } else {
            appendMessage(result.reply, 'ai-message', true);
        }
    }

    // ===== APPLY FILTERS FROM AI =====
    function applyDetectedFilters(filters) {
        resetMainFilters();

        if (filters.brand) {
            const bSel = document.getElementById('brand-select');
            const exactBrand = Object.keys(BRANDS_DATA).find(b => b.toLowerCase() === filters.brand.toLowerCase());
            if (exactBrand) {
                bSel.value = exactBrand;
                bSel.dispatchEvent(new Event('change'));
                if (filters.model) {
                    setTimeout(() => {
                        const mSel = document.getElementById('model-select');
                        const models = BRANDS_DATA[exactBrand]?.models || [];
                        const exactModel = models.find(m => m.toLowerCase() === filters.model.toLowerCase());
                        if (exactModel) {
                            mSel.value = exactModel;
                            if (mSel._customSelect) mSel._customSelect.rebuild();
                        }
                        filterCars();
                    }, 150);
                }
            }
        }

        if (filters.fuel) { const s = document.getElementById('fuel-select'); if (s) s.value = filters.fuel; }
        if (filters.transmission) { const s = document.getElementById('transmission-select'); if (s) s.value = filters.transmission; }
        if (filters.bodyType) { const s = document.getElementById('body-select'); if (s) s.value = filters.bodyType; }
        if (filters.color) { const s = document.getElementById('color-select'); if (s) s.value = filters.color; }
        if (filters.yearFrom) {
            const ySel = document.getElementById('year-from');
            if (ySel) {
                let exists = Array.from(ySel.options).some(o => o.value === String(filters.yearFrom));
                if (!exists) {
                    const opt = new Option(String(filters.yearFrom), filters.yearFrom);
                    let inserted = false;
                    for (let i = 1; i < ySel.options.length; i++) {
                        if (parseInt(ySel.options[i].value) < filters.yearFrom) {
                            ySel.insertBefore(opt, ySel.options[i]);
                            inserted = true;
                            break;
                        }
                    }
                    if (!inserted) ySel.add(opt);
                }
                ySel.value = filters.yearFrom;
            }
        }
        if (filters.kmTo) {
            const kmSel = document.getElementById('km-to');
            if (kmSel) {
                let exists = Array.from(kmSel.options).some(o => o.value === String(filters.kmTo));
                if (!exists) kmSel.add(new Option(filters.kmTo.toLocaleString() + ' km', filters.kmTo));
                kmSel.value = filters.kmTo;
            }
        }
        if (filters.priceTo) {
            const pSel = document.getElementById('price-to');
            if (pSel) {
                let exists = Array.from(pSel.options).some(o => parseInt(o.value) === filters.priceTo);
                if (!exists) pSel.add(new Option(formatPrice(filters.priceTo), filters.priceTo));
                pSel.value = filters.priceTo;
            }
        }

        document.querySelectorAll('#car-search-form select').forEach(s => {
            if (s._customSelect) s._customSelect.rebuild();
        });

        filterCars();
        document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' });
    }

    function resetMainFilters() {
        const form = document.getElementById('car-search-form');
        if (form) {
            form.reset();
            form.querySelectorAll('select').forEach(sel => {
                if (sel._customSelect) sel._customSelect.rebuild();
            });
        }
        const modelSelect = document.getElementById('model-select');
        if (modelSelect) {
            modelSelect.disabled = true;
            modelSelect.innerHTML = '<option value="">Előbb válassz márkát</option>';
            if (modelSelect._customSelect) modelSelect._customSelect.rebuild();
        }
    }
}


function requestUserLocation(isAuto = false) {
    if (!navigator.geolocation) {
        if (!isAuto) showToast('A böngésződ nem támogatja a helymeghatározást.', 'warning');
        return;
    }

    const mainBtn = document.getElementById('geo-btn');
    const sidebarBtn = document.getElementById('sidebar-geo-btn');
    const mainInput = document.getElementById('city-search');
    const sidebarInput = document.getElementById('sidebar-city');

    if (mainBtn) mainBtn.textContent = '⏳';
    if (sidebarBtn) sidebarBtn.textContent = '⏳';

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            window.userCoords = { lat: pos.coords.latitude, ln: pos.coords.longitude };
            if (mainInput) mainInput.value = 'Jelenlegi helyzetem';
            if (sidebarInput) sidebarInput.value = 'Jelenlegi helyzetem';
            if (mainBtn) mainBtn.textContent = '📍';
            if (sidebarBtn) sidebarBtn.textContent = '📍';
            if (typeof filterCars === 'function') filterCars();
        },
        (err) => {
            console.warn('Geolocation error:', err);
            if (mainBtn) mainBtn.textContent = '📍';
            if (sidebarBtn) sidebarBtn.textContent = '📍';
            if (!isAuto) showToast('Kérlek engedélyezd a helymeghatározást a böngésződben!', 'warning');
        }
    );
}

function initGeolocation() {
    const geoBtn = document.getElementById('geo-btn');
    const sidebarGeoBtn = document.getElementById('sidebar-geo-btn');

    if (geoBtn) geoBtn.addEventListener('click', () => requestUserLocation(false));
    if (sidebarGeoBtn) sidebarGeoBtn.addEventListener('click', () => requestUserLocation(false));

    // Auto-request on load
    requestUserLocation(true);
}

// ===== RANGE SLIDERS =====
function initRangeSliders() {
    const setupRange = (containerId, fromId, toId, fromValId, toValId, suffix = '') => {
        const container = document.getElementById(containerId);
        const fromInput = document.getElementById(fromId);
        const toInput = document.getElementById(toId);
        const fromDisplay = document.getElementById(fromValId);
        const toDisplay = document.getElementById(toValId);
        const track = container.querySelector('.slider-track');

        if (!fromInput || !toInput) return;

        const updateTrack = () => {
            const min = parseInt(fromInput.min);
            const max = parseInt(fromInput.max);
            const v1 = parseInt(fromInput.value);
            const v2 = parseInt(toInput.value);

            const p1 = ((v1 - min) / (max - min)) * 100;
            const p2 = ((v2 - min) / (max - min)) * 100;

            track.style.left = Math.min(p1, p2) + '%';
            track.style.width = Math.abs(p2 - p1) + '%';

            if (fromValId.includes('price')) {
                fromDisplay.textContent = formatPrice(v1) + suffix;
                toDisplay.textContent = v2 >= max ? formatPrice(v2) + '+' + suffix : formatPrice(v2) + suffix;
            } else {
                fromDisplay.textContent = v1 + suffix;
                toDisplay.textContent = v2 + suffix;
            }
        };

        const handleInput = (e) => {
            let v1 = parseInt(fromInput.value);
            let v2 = parseInt(toInput.value);

            // Prevent overlapping with small gap
            if (e.target === fromInput && v1 > v2) fromInput.value = v2;
            if (e.target === toInput && v2 < v1) toInput.value = v1;

            updateTrack();
            filterCars();
        };

        fromInput.addEventListener('input', handleInput);
        toInput.addEventListener('input', handleInput);
        updateTrack();
    };

    setupRange('price-range', 'price-from', 'price-to', 'price-from-val', 'price-to-val', '');
    setupRange('year-range', 'year-from', 'year-to', 'year-from-val', 'year-to-val', '');
}

// ===== RATING SYSTEM =====
function openRatingModal(sellerId, sellerName) {
    if (!token || !currentUser) {
        showToast('Az értékeléshez be kell jelentkezned!', 'error');
        return;
    }
    const modal = document.getElementById('rating-modal');
    if (!modal) return;
    
    document.getElementById('rating-seller-name').textContent = sellerName;
    
    // Clear previous stars
    const stars = modal.querySelectorAll('#star-rating-input span');
    stars.forEach(s => {
        s.classList.remove('active');
        s.style.color = 'var(--border-color)';
    });
    
    const submitBtn = document.getElementById('submit-rating-btn');
    submitBtn.disabled = true;

    let selectedRating = 0;
    stars.forEach((star, index) => {
        star.onclick = () => {
            selectedRating = parseInt(star.dataset.value);
            stars.forEach(s => { s.classList.remove('active'); s.style.color = 'var(--border-color)'; });
            for(let i=0; i<selectedRating; i++) {
                stars[i].classList.add('active');
                stars[i].style.color = '#fbbf24'; // Arany szín a csillagoknak
            }
            submitBtn.disabled = false;
        };
    });

    submitBtn.onclick = async () => {
        if (selectedRating === 0) {
            showToast('Kérjük, válassz csillagot!', 'error');
            return;
        }
        submitBtn.disabled = true;
        submitBtn.textContent = 'KÜLDÉS...';
        
        try {
            const res = await fetch(`${API_BASE_URL}/users/${sellerId}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ score: selectedRating })
            });

            const data = await res.json();
            if (res.ok) {
                showToast('Értékelés sikeresen mentve!', 'success');
                modal.classList.remove('active');
            } else {
                showToast(data.message || 'Hiba történt az értékelés során', 'error');
            }
        } catch (err) {
            showToast('Hálózati hiba az értékelés küldésekor', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'ÉRTÉKELÉS BEKÜLDÉSE';
        }
    };

    modal.classList.add('active');
}

document.getElementById('rating-close')?.addEventListener('click', () => {
    document.getElementById('rating-modal')?.classList.remove('active');
});

// ===== PREMIUM ADS (SIMULATED TIER) =====
async function makeAdPremium(adId) {
    if (!token || !currentUser) return;
    if (!confirm('A prémium kiemelés díja 5000 Ft (Demó: gombnyomásra szimulált egyenleglevonás). Folytatod?')) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/ads/${adId}/premium`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            showToast('Hálózati fizetés sikeres! A hirdetésed prémium lett. Várj...', 'success');
            // Refresh logic depending on view
            setTimeout(() => {
                fetchAds();
                if (window.location.hash === '#view-profile') renderProfile();
            }, 1000);
        } else {
            showToast('Hiba a kiemelés során!', 'error');
        }
    } catch(e) {
        showToast('Hálózati fizetési hiba', 'error');
    }
}

window.makeAdPremium = makeAdPremium;
window.openRatingModal = openRatingModal;
window.openUserChat = openUserChat;

// ===== USER TO USER CHAT & AI INTEGRATION =====
let activeChatAdId = null;
let activeChatReceiverId = null;

function openUserChat(adId, receiverId, sellerName, paramAdTitle) {
    if (!token || !currentUser) {
        showToast('A chat használatához be kell jelentkezned!', 'error');
        return;
    }
    const modal = document.getElementById('user-chat-modal');
    if (!modal) return;
    
    activeChatAdId = adId;
    activeChatReceiverId = receiverId; // Helyes ObjectID mostantól
    
    document.getElementById('user-chat-title').textContent = paramAdTitle;
    document.getElementById('user-chat-seller-name').textContent = sellerName;
    
    const messagesContainer = document.getElementById('user-chat-messages');
    messagesContainer.innerHTML = '<div class="placeholder">Üzenetek betöltése...</div>';
    
    modal.classList.add('active');
    
    fetchChatMessages();
}

function closeUserChat() {
    document.getElementById('user-chat-modal')?.classList.remove('active');
    activeChatAdId = null;
    activeChatReceiverId = null;
}

document.getElementById('user-chat-close')?.addEventListener('click', closeUserChat);

async function fetchChatMessages() {
    if (!activeChatAdId) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/messages?adId=${activeChatAdId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const messages = await res.json();
        renderUserChatMessages(messages);
    } catch (err) {
        console.warn('Hiba az üzenetek lekérésekor');
        document.getElementById('user-chat-messages').innerHTML = '<div class="placeholder">Nem sikerült betölteni az üzeneteket.</div>';
    }
}

function renderUserChatMessages(messages) {
    const container = document.getElementById('user-chat-messages');
    container.innerHTML = '';
    
    if (messages.length === 0) {
        container.innerHTML = '<div style="text-align:center; opacity:0.6; padding:1rem; font-size:0.8rem;">Itt kezdheted el a beszélgetést az eladóval.</div>';
    } else {
        messages.forEach(msg => {
            const isMe = msg.senderId === currentUser.id;
            const el = document.createElement('div');
            el.className = `message ${isMe ? 'user-message' : 'ai-message'}`;
            el.style.backgroundColor = isMe ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)';
            el.style.color = isMe ? '#000' : 'var(--text-color)';
            el.textContent = msg.content;
            container.appendChild(el);
        });
    }
    container.scrollTop = container.scrollHeight;
}

document.getElementById('user-chat-send')?.addEventListener('click', sendUserChatMessage);
document.getElementById('user-chat-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendUserChatMessage();
});

async function sendUserChatMessage() {
    const input = document.getElementById('user-chat-input');
    const text = input.value.trim();
    if (!text) return;
    
    input.value = '';
    
    // Add locally immediately
    const container = document.getElementById('user-chat-messages');
    if(container.innerHTML.includes('Itt kezdheted el')) container.innerHTML = '';
    
    const el = document.createElement('div');
    el.className = 'message user-message';
    el.style.backgroundColor = 'var(--primary-color)';
    el.style.color = '#000';
    el.textContent = text;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    
    try {
        await fetch(`${API_BASE_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
                receiverId: activeChatReceiverId, // Can be matched safely on backend
                adId: activeChatAdId,
                content: text
            })
        });
    } catch (err) {
        showToast('Hálózati hiba az üzenet küldésekor', 'error');
    }
}

window.openUserChat = openUserChat;

// AI Assistant Action in User Chat
document.getElementById('user-chat-ai-action')?.addEventListener('click', async () => {
    const container = document.getElementById('user-chat-messages');
    
    // Add simple AI message
    const elId = 'ai-typing-' + Date.now();
    const el = document.createElement('div');
    el.id = elId;
    el.className = 'message ai-message';
    el.style.backgroundColor = 'rgba(255,255,255,0.05)';
    el.innerHTML = '<i>Lunnar AI Asszisztens kapcsolódik...</i>';
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    
    setTimeout(() => {
        const ad = allCars.find(c => c._id === activeChatAdId || c.id === activeChatAdId);
        const elRe = document.getElementById(elId);
        if (elRe) {
            elRe.innerHTML = `👋 Helló! Én a Lunnar AI Asszisztensed vagyok. Úgy látom az eladó jelenleg nem válaszol. <br><br><b>Amit a hirdetésből tudok a járműről:</b><br>- Típus: ${ad.brand} ${ad.model}<br>- Évjárat: ${ad.year}<br>- Kilométer: ${ad.km} km<br>- Ár: ${formatPrice(ad.price)}<br>- Motor: ${ad.hp} LE, ${ad.fuel}<br><br>Kérdésed van ezekkel kapcsolatban? Tedd fel a fő AI Chat modulban a bal alsó sarokból!`;
        }
    }, 1500);
});

// ===== VISUAL EXTRA & SOCIAL FEATURES =====
async function submitComment(adId) {
    const textInput = document.getElementById('new-comment-text');
    if(!textInput) return;
    const text = textInput.value.trim();
    if(!text) {
        showToast('Kérlek írj be egy hozzászólást', 'error');
        return;
    }

    const btn = textInput.nextElementSibling;
    btn.disabled = true;
    btn.textContent = 'KÜLDÉS...';

    try {
        const res = await fetch(`${API_BASE_URL}/ads/${adId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ text })
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast('Hozzászólás elküldve!', 'success');
            // Refresh ad
            const adIndex = allCars.findIndex(c => c._id === adId || c.id === adId);
            if(adIndex > -1) {
                allCars[adIndex].comments = data.comments;
            }
            renderAdDetail(adId);
        } else {
            showToast(data.message || 'Hiba a küldés során', 'error');
        }
    } catch(err) {
        showToast('Hálózati hiba', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'KÜLDÉS';
    }
}

function extractDominantColor(imageSrc) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 50;
            canvas.height = 50;
            try {
                ctx.drawImage(img, 0, 0, 50, 50);
                const data = ctx.getImageData(0, 0, 50, 50).data;
                let r=0,g=0,b=0, count=0;
                for(let i=0; i<data.length; i+=4) {
                    if (data[i+3] > 128) {
                        r += data[i]; g += data[i+1]; b += data[i+2]; count++;
                    }
                }
                if(count > 0) resolve(`rgba(${Math.round(r/count)}, ${Math.round(g/count)}, ${Math.round(b/count)}, 0.4)`);
                else resolve('transparent');
            } catch(e) {
                resolve('transparent');
            }
        };
        img.onerror = () => resolve('transparent');
        img.src = imageSrc;
    });
}

window.submitComment = submitComment;

// ===== INIT EVERYTHING =====
async function init() {
    initStars();
    typeSubtitle();
    initNeural();
    initBrands();
    await fetchAds();
    initSearch();
    initModal();
    initSubmission();
    initAuth();
    initHeaderScroll();
    initHamburger();
    initStats();
    initFadeIn();
    initProfileTabs();
    initSidebarSearch();
    initCompareListeners();
    initGeolocation();
    initAiChat();

    // Router
    window.addEventListener('hashchange', handleRouting);
    handleRouting();
}

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    resizeNeural();
    resizeStarCanvas();
});

// ===== VIN CHECK (EXTERNAL) =====
// carVertical integration via direct link in UI


// ===== SAVED SEARCHES =====
async function saveCurrentSearch() {
    if (!token) {
        showToast('A keresés mentéséhez be kell jelentkezned!', 'error');
        document.getElementById('login-nav-btn').click();
        return;
    }

    const form = document.getElementById('car-search-form');
    if (!form) return;

    const formData = new FormData(form);
    const searchParams = {};
    formData.forEach((value, key) => {
        if (value && value !== 'any' && value !== '0') searchParams[key] = value;
    });

    if (Object.keys(searchParams).length === 0) {
        showToast('Nincs kiválasztott szűrő a mentéshez.', 'warning');
        return;
    }

    const name = prompt('Adj nevet a keresésnek (pl. "Olcsó BMW-k"):', `Keresés ${new Date().toLocaleDateString()}`);
    if (!name) return;

    try {
        const res = await fetch(`${API_BASE_URL}/user/saved-searches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name, params: searchParams })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Keresés elmentve a profilodba! 📂', 'success');
            fetchSavedSearches(); // Refresh both profile list and quick menus
        } else {
            showToast(data.message || 'Hiba a mentés során', 'error');
        }
    } catch (err) {
        showToast('Hálózati hiba', 'error');
    }
}
window.saveCurrentSearch = saveCurrentSearch;

function loadSavedSearch(params) {
    const mainForm = document.getElementById('car-search-form');
    const sidebar = document.getElementById('sidebar-search');

    // Helper to fill inputs in a container
    const fillInputs = (container) => {
        if (!container) return;
        for (const key in params) {
            // Match name attribute for main form, or id suffix for sidebar
            let input = container.querySelector(`[name="${key}"]`);
            if (!input && container.id === 'sidebar-search') {
                // Sidebar uses IDs like 'sidebar-brand', 'sidebar-price-from' etc.
                const sidebarIdMap = {
                    brand: 'sidebar-brand',
                    model: 'sidebar-model',
                    fuel: 'sidebar-fuel',
                    minPrice: 'sidebar-price-from',
                    maxPrice: 'sidebar-price-to',
                    minYear: 'sidebar-year-from',
                    maxYear: 'sidebar-year-to',
                    minKm: 'sidebar-km-from',
                    maxKm: 'sidebar-km-to'
                };
                input = document.getElementById(sidebarIdMap[key]);
            }
            if (input) {
                input.value = params[key];
                // Trigger change for dependent selects (like model)
                if (key === 'brand') input.dispatchEvent(new Event('change'));
            }
        }
    };

    if (mainForm) {
        mainForm.reset();
        const detailedBox = document.getElementById('detailed-search-box');
        if (detailedBox) detailedBox.style.display = 'block';
        fillInputs(mainForm);
    }

    if (sidebar) {
        fillInputs(sidebar);
    }
    
    showToast('Keresési feltételek betöltve!', 'info');
    filterCars();
    window.location.hash = '#home'; // Jump to results
}

window.loadSavedSearch = loadSavedSearch;

async function deleteSavedSearch(id) {
    if (!confirm('Biztosan törölni szeretnéd ezt a mentett keresést?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/user/saved-searches/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            showToast('Keresés törölve');
            renderProfile();
        }
    } catch (e) { showToast('Hiba a törléskor', 'error'); }
}
window.deleteSavedSearch = deleteSavedSearch;


// ===== COMPARE SYSTEM =====
// (compareList is declared at the top)

function toggleCompare(carId, btn) {
    const idx = compareList.indexOf(carId);
    if (idx > -1) {
        compareList.splice(idx, 1);
        if (btn) btn.classList.remove('active');
        showToast('Eltávolítva az összehasonlításból');
    } else {
        if (compareList.length >= 3) {
            showToast('Maximum 3 autót hasonlíthatsz össze!', 'warning');
            return;
        }
        compareList.push(carId);
        if (btn) btn.classList.add('active');
        showToast('Hozzáadva az összehasonlításhoz', 'success');
    }
    localStorage.setItem('lunnarCompareList', JSON.stringify(compareList));
    renderCompareBar();
}

function renderCompareBar() {
    let bar = document.getElementById('compare-bar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'compare-bar';
        bar.className = 'compare-floating-bar';
        document.body.appendChild(bar);
    }

    if (compareList.length === 0) {
        bar.classList.remove('visible');
        return;
    }

    const compareCars = compareList.map(id => allCars.find(c => (c._id === id || c.id === id))).filter(Boolean);
    
    bar.innerHTML = `
        <div class="compare-bar-content">
            <div class="compare-items">
                ${compareCars.map(car => `
                    <div class="compare-item-mini">
                        <img src="${car.images && car.images[0] ? car.images[0] : car.img}" alt="">
                        <span>${car.brand}</span>
                        <button onclick="toggleCompare('${car._id || car.id}')">×</button>
                    </div>
                `).join('')}
            </div>
            <button class="cta-button primary" onclick="openCompareModal()" style="padding: 0.5rem 1rem; font-size: 0.8rem;">ÖSSZEHASONLÍTÁS (${compareList.length})</button>
        </div>
    `;
    bar.classList.add('visible');
}

function openCompareModal() {
    const modal = document.getElementById('car-modal');
    const container = document.getElementById('modal-details');
    if (!modal || !container) return;

    const cars = compareList.map(id => allCars.find(c => (c._id === id || c.id === id))).filter(Boolean);
    if (cars.length < 1) {
        showToast('Nincs kiválasztott autó!', 'warning');
        return;
    }

    container.innerHTML = `
        <div class="compare-modal-view">
            <h2 style="font-family:var(--font-heading); margin-bottom:2rem; text-align:center;">ÖSSZEHASONLÍTÁS</h2>
            <div class="compare-table-wrapper" style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; min-width:600px;">
                    <thead>
                        <tr>
                            <th style="padding:1rem; text-align:left; border-bottom:2px solid var(--border-color);">ADAT</th>
                            ${cars.map(c => `<th style="padding:1rem; border-bottom:2px solid var(--border-color);"><img src="${c.images[0]}" style="width:100px; height:60px; object-fit:cover; border-radius:4px;"><br>${c.brand} ${c.model}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td style="padding:0.8rem; border-bottom:1px solid var(--border-color); font-weight:bold;">Ár</td>${cars.map(c => `<td>${formatPrice(c.price)}</td>`).join('')}</tr>
                        <tr><td style="padding:0.8rem; border-bottom:1px solid var(--border-color); font-weight:bold;">Évjárat</td>${cars.map(c => `<td>${c.year}</td>`).join('')}</tr>
                        <tr><td style="padding:0.8rem; border-bottom:1px solid var(--border-color); font-weight:bold;">KM</td>${cars.map(c => `<td>${c.km} km</td>`).join('')}</tr>
                        <tr><td style="padding:0.8rem; border-bottom:1px solid var(--border-color); font-weight:bold;">Erő</td>${cars.map(c => `<td>${c.hp} LE</td>`).join('')}</tr>
                        <tr><td style="padding:0.8rem; border-bottom:1px solid var(--border-color); font-weight:bold;">Váltó</td>${cars.map(c => `<td>${c.transmission}</td>`).join('')}</tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

window.toggleCompare = toggleCompare;
window.openCompareModal = openCompareModal;

// Initialize bar on load
setTimeout(renderCompareBar, 1000);

init();
