// ====== PARTICLE SYSTEM (From previous iterations) ======
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- CONFIG SYSTEM ---
const CONFIG = {
    particleCount: 250, connectDistance: 12000, mouseRadius: 180, trailOpacity: 0.25,
    autoHueShift: true, baseHue: 0, mouseConnectDist: 25000,
    particleSpeed: 1.0, burstForce: 2.0, baseSize: 3, depthIntensity: 1.5
};

// Config UI Binding (keeping it clean)
document.getElementById('config-toggle-btn').addEventListener('click', () => {
    document.getElementById('config-panel').classList.toggle('open');
});
document.getElementById('close-config-btn').addEventListener('click', () => {
    document.getElementById('config-panel').classList.remove('open');
});

['particle-count', 'connect-dist', 'mouse-radius', 'trail-opacity', 'base-hue', 'particle-speed', 'burst-force', 'particle-size', 'depth-intensity'].forEach(id => {
    const input = document.getElementById(id);
    const label = document.getElementById(id.split('-')[0] + '-val') || document.getElementById(id.split('-')[1] + '-val');
    if (label && input) {
        input.addEventListener('input', (e) => {
            label.innerText = e.target.step && e.target.step.includes('.') ? parseFloat(e.target.value).toFixed(1) : e.target.value;
        });
    }
});

document.getElementById('auto-hue').addEventListener('change', (e) => {
    const manualGroup = document.getElementById('manual-hue-group');
    manualGroup.style.opacity = e.target.checked ? '0.5' : '1';
    manualGroup.style.pointerEvents = e.target.checked ? 'none' : 'auto';
});

document.getElementById('apply-config-btn').addEventListener('click', () => {
    CONFIG.particleCount = parseInt(document.getElementById('particle-count').value);
    CONFIG.connectDistance = parseInt(document.getElementById('connect-dist').value);
    CONFIG.mouseRadius = parseInt(document.getElementById('mouse-radius').value);
    CONFIG.trailOpacity = parseFloat(document.getElementById('trail-opacity').value);
    CONFIG.autoHueShift = document.getElementById('auto-hue').checked;
    CONFIG.baseHue = parseInt(document.getElementById('base-hue').value);
    CONFIG.particleSpeed = parseFloat(document.getElementById('particle-speed').value);
    CONFIG.burstForce = parseFloat(document.getElementById('burst-force').value);
    CONFIG.baseSize = parseInt(document.getElementById('particle-size').value);
    CONFIG.depthIntensity = parseFloat(document.getElementById('depth-intensity').value);
    CONFIG.mouseConnectDist = CONFIG.connectDistance * 2;
    if (!CONFIG.autoHueShift) hue = CONFIG.baseHue;
    
    document.getElementById('config-panel').classList.remove('open');
    initParticles(); 
});

let particlesArray = [];
let hue = CONFIG.baseHue; 
let mouse = { x: null, y: null, burstRadius: 0, isBursting: false };

window.addEventListener('mousemove', (event) => {
    mouse.x = event.x; mouse.y = event.y;
});
window.addEventListener('mousedown', (event) => {
    if (event.target.closest('.glass-panel') || event.target.closest('.drawer') || event.target.closest('.top-left-btn') || event.target.closest('.top-right-btn') || document.getElementById('enter-overlay').style.opacity == '0') {
        if(event.target.closest('.glass-panel') || event.target.closest('.drawer') || event.target.closest('.top-left-btn') || event.target.closest('.top-right-btn')) return;
    }
    mouse.isBursting = true; mouse.burstRadius = 0;
});

class Particle {
    constructor() {
        this.size = (Math.random() * CONFIG.baseSize) + 1;
        this.x = Math.random() * (canvas.width - this.size * 2) + this.size;
        this.y = Math.random() * (canvas.height - this.size * 2) + this.size;
        this.directionX = (Math.random() * 2) - 1; this.directionY = (Math.random() * 2) - 1;
        this.colorOffset = Math.random() * 60;
        this.density = (Math.random() * 30) + 1;
        this.z = Math.random(); 
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.shadowBlur = this.z * 15 * CONFIG.depthIntensity;
        ctx.shadowColor = `hsl(${hue + this.colorOffset}, 100%, 50%)`;
        ctx.fillStyle = `hsl(${hue + this.colorOffset}, 100%, 70%)`;
        ctx.fill(); ctx.shadowBlur = 0;
    }
    update() {
        this.x += this.directionX * (this.z * CONFIG.depthIntensity + 0.2) * CONFIG.particleSpeed;
        this.y += this.directionY * (this.z * CONFIG.depthIntensity + 0.2) * CONFIG.particleSpeed;
        if (this.x < 0 || this.x > canvas.width) this.directionX = -this.directionX;
        if (this.y < 0 || this.y > canvas.height) this.directionY = -this.directionY;

        if (mouse.x != null) {
            let dx = mouse.x - this.x; let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < CONFIG.mouseRadius) {
                let force = (CONFIG.mouseRadius - distance) / CONFIG.mouseRadius;
                this.x -= (dx / distance) * force * this.density;
                this.y -= (dy / distance) * force * this.density;
            }
            if (mouse.isBursting) {
                let burstDist = Math.abs(distance - mouse.burstRadius);
                if (burstDist < 30) {
                    this.directionX -= (dx / distance) * (this.z + 0.5) * CONFIG.burstForce;
                    this.directionY -= (dy / distance) * (this.z + 0.5) * CONFIG.burstForce;
                }
            }
        }
        this.draw();
    }
}

function initParticles() {
    particlesArray = [];
    for (let i = 0; i < CONFIG.particleCount; i++) particlesArray.push(new Particle());
}

function connectParticles() {
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) ** 2) + ((particlesArray[a].y - particlesArray[b].y) ** 2);
            if (distance < CONFIG.connectDistance) {
                let opacity = 1 - (distance / CONFIG.connectDistance);
                ctx.strokeStyle = `hsla(${hue + particlesArray[a].colorOffset}, 100%, 75%, ${opacity * 0.15})`;
                ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(particlesArray[a].x, particlesArray[a].y); ctx.lineTo(particlesArray[b].x, particlesArray[b].y); ctx.stroke();
            }
        }
        if (mouse.x != null) {
            let mouseDist = ((particlesArray[a].x - mouse.x) ** 2) + ((particlesArray[a].y - mouse.y) ** 2);
            if (mouseDist < CONFIG.mouseConnectDist) { 
                let opacity = 1 - (mouseDist / CONFIG.mouseConnectDist);
                ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${opacity * 0.4})`;
                ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(particlesArray[a].x, particlesArray[a].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
            }
        }
    }
}

function drawMouse() {
    if (mouse.x != null) {
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 10, 0, Math.PI * 2, false);
        ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`; ctx.lineWidth = 2; ctx.shadowBlur = 15; ctx.shadowColor = `hsl(${hue}, 100%, 60%)`; ctx.stroke(); ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2, false); ctx.fillStyle = '#ffffff'; ctx.fill();

        if (mouse.isBursting) {
            mouse.burstRadius += 12 * (CONFIG.burstForce / 2);
            ctx.beginPath(); ctx.arc(mouse.x, mouse.y, mouse.burstRadius, 0, Math.PI * 2, false);
            let burstOpacity = 1 - (mouse.burstRadius / 350);
            if (burstOpacity <= 0) { mouse.isBursting = false; burstOpacity = 0; }
            ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${burstOpacity})`; ctx.lineWidth = 3; ctx.stroke();
        }
    }
}

function animateParticles() {
    requestAnimationFrame(animateParticles);
    ctx.fillStyle = `rgba(5, 5, 5, ${CONFIG.trailOpacity})`; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) particlesArray[i].update();
    connectParticles(); drawMouse();
    if (CONFIG.autoHueShift) hue += 0.3;
}

window.addEventListener('resize', () => { canvas.width = innerWidth; canvas.height = innerHeight; initParticles(); });
document.getElementById('reset-btn').addEventListener('click', initParticles);
initParticles();
animateParticles();

// ====== ACCOUNT & BIOLINK SYSTEM ======

// Mock Database using LocalStorage
const getDB = () => JSON.parse(localStorage.getItem('zen_users')) || {};
const saveDB = (db) => localStorage.setItem('zen_users', JSON.stringify(db));

let currentUser = null; // Username of logged in user
let viewedUser = null;  // Username of profile being viewed

// UI Elements
const enterOverlay = document.getElementById('enter-overlay');
const authScreen = document.getElementById('auth-screen');
const profileLayer = document.getElementById('profile-layer');
const ownerControls = document.getElementById('owner-controls');
const editProfilePanel = document.getElementById('edit-profile-panel');
const logoutModal = document.getElementById('logout-modal');
const verifyScreen = document.getElementById('verify-screen');
const mockNotification = document.getElementById('mock-email-notification');

let pendingRegistration = null;

// Auth logic
document.getElementById('register-btn').addEventListener('click', () => {
    const user = document.getElementById('auth-username').value.trim();
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-password').value;
    const err = document.getElementById('auth-error');
    if(!user || !email || !pass) return err.innerText = "Please fill out all fields.";
    if(!email.includes('@')) return err.innerText = "Please enter a valid email address.";
    
    let db = getDB();
    if(db[user]) return err.innerText = "Username already exists. Please login.";
    
    // Start verification flow
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    pendingRegistration = { user, pass, email, code };
    
    authScreen.classList.add('hidden');
    verifyScreen.classList.remove('hidden');
    document.getElementById('verify-email-display').innerText = email;
    document.getElementById('verify-error').innerText = '';
    document.getElementById('verify-code').value = '';
    
    // Show mock email notification
    document.getElementById('mock-code-display').innerText = code;
    mockNotification.classList.remove('hidden');
    setTimeout(() => mockNotification.classList.add('hidden'), 10000);
});

document.getElementById('verify-cancel-btn').addEventListener('click', () => {
    pendingRegistration = null;
    verifyScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
    mockNotification.classList.add('hidden');
});

document.getElementById('verify-btn').addEventListener('click', () => {
    if(!pendingRegistration) return;
    const codeInput = document.getElementById('verify-code').value.trim();
    const err = document.getElementById('verify-error');
    
    if(codeInput !== pendingRegistration.code) {
        return err.innerText = "Invalid verification code. Check the notification.";
    }
    
    let db = getDB();
    db[pendingRegistration.user] = {
        password: pendingRegistration.pass,
        email: pendingRegistration.email,
        displayName: pendingRegistration.user,
        bio: "Welcome to my little slice of the internet. Move your mouse to interact with the particles.",
        avatarUrl: `https://api.dicebear.com/9.x/bottts/svg?seed=${pendingRegistration.user}`,
        views: 0,
        discord: "", github: "", twitter: "", instagram: "", youtube: "", tiktok: ""
    };
    saveDB(db);
    
    verifyScreen.classList.add('hidden');
    mockNotification.classList.add('hidden');
    loginUser(pendingRegistration.user);
    pendingRegistration = null;
});

document.getElementById('login-btn').addEventListener('click', () => {
    const user = document.getElementById('auth-username').value.trim();
    const pass = document.getElementById('auth-password').value;
    const err = document.getElementById('auth-error');
    if(!user || !pass) return err.innerText = "Please fill out all fields.";
    
    let db = getDB();
    if(!db[user] || db[user].password !== pass) return err.innerText = "Invalid username or password.";
    
    loginUser(user);
});

document.getElementById('view-guest-btn').addEventListener('click', (e) => {
    e.preventDefault();
    currentUser = null;
    viewedUser = null;
    
    // As requested: Just show the default Zen particles, do not load another user profile
    authScreen.classList.add('hidden');
    profileLayer.classList.add('hidden'); 
});

// Custom Logout Modal Logic
document.getElementById('logout-btn').addEventListener('click', () => {
    logoutModal.classList.remove('hidden');
});
document.getElementById('confirm-logout-no').addEventListener('click', () => {
    logoutModal.classList.add('hidden');
});
document.getElementById('confirm-logout-yes').addEventListener('click', () => {
    currentUser = null;
    viewedUser = null;
    logoutModal.classList.add('hidden');
    profileLayer.classList.add('hidden');
    editProfilePanel.classList.remove('open'); // Close edit drawer on logout
    authScreen.classList.remove('hidden');
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-error').innerText = '';
    document.getElementById('auth-error').style.color = '#ff5e5e';
});

// Click to enter logic
enterOverlay.addEventListener('click', () => {
    enterOverlay.style.opacity = '0';
    setTimeout(() => {
        enterOverlay.style.display = 'none';
        authScreen.classList.remove('hidden');
    }, 800);
});

function loginUser(username) {
    currentUser = username;
    viewedUser = username;
    showProfile(username);
}

function showProfile(username) {
    authScreen.classList.add('hidden');
    profileLayer.classList.remove('hidden');
    
    let db = getDB();
    let profile = db[username];

    if(profile) {
        // Increment view counter if not the owner
        if(currentUser !== username) {
            profile.views = (profile.views || 0) + 1;
            db[username] = profile;
            saveDB(db);
        }
    } else {
        return; // Profile doesn't exist (shouldn't happen with normal flow)
    }

    // Populate UI
    document.getElementById('display-name').innerText = profile.displayName;
    document.getElementById('display-bio').innerText = profile.bio;
    document.getElementById('display-avatar').src = profile.avatarUrl;
    document.getElementById('display-views').innerText = profile.views.toLocaleString();
    
    // Links
    const setLink = (id, url) => {
        const el = document.getElementById(id);
        if(url && url.trim() !== '') {
            el.href = url.startsWith('http') ? url : 'https://' + url;
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    }
    setLink('link-discord', profile.discord);
    setLink('link-github', profile.github);
    setLink('link-twitter', profile.twitter);
    setLink('link-instagram', profile.instagram);
    setLink('link-youtube', profile.youtube);
    setLink('link-tiktok', profile.tiktok);

    // Show/hide owner controls
    if(currentUser && currentUser === username) {
        ownerControls.classList.remove('hidden');
        document.getElementById('edit-display-name').value = profile.displayName;
        document.getElementById('edit-avatar').value = profile.avatarUrl;
        document.getElementById('edit-bio').value = profile.bio;
        document.getElementById('edit-discord').value = profile.discord || '';
        document.getElementById('edit-github').value = profile.github || '';
        document.getElementById('edit-twitter').value = profile.twitter || '';
        document.getElementById('edit-instagram').value = profile.instagram || '';
        document.getElementById('edit-youtube').value = profile.youtube || '';
        document.getElementById('edit-tiktok').value = profile.tiktok || '';
    } else {
        ownerControls.classList.add('hidden');
    }
}

// Edit Profile logic
document.getElementById('edit-profile-btn').addEventListener('click', () => {
    editProfilePanel.classList.add('open');
});
document.getElementById('close-profile-btn').addEventListener('click', () => {
    editProfilePanel.classList.remove('open');
});

document.getElementById('save-profile-btn').addEventListener('click', () => {
    if(!currentUser) return;
    let db = getDB();
    if(!db[currentUser]) return;

    db[currentUser].displayName = document.getElementById('edit-display-name').value;
    db[currentUser].avatarUrl = document.getElementById('edit-avatar').value;
    db[currentUser].bio = document.getElementById('edit-bio').value;
    db[currentUser].discord = document.getElementById('edit-discord').value;
    db[currentUser].github = document.getElementById('edit-github').value;
    db[currentUser].twitter = document.getElementById('edit-twitter').value;
    db[currentUser].instagram = document.getElementById('edit-instagram').value;
    db[currentUser].youtube = document.getElementById('edit-youtube').value;
    db[currentUser].tiktok = document.getElementById('edit-tiktok').value;

    saveDB(db);
    editProfilePanel.classList.remove('open');
    showProfile(currentUser); // Refresh UI
});
