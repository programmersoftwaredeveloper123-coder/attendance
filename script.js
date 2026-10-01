/* ==========================================================
   OUR LANGUAGE: DAILY GROUP ATTENDANCE - JAVASCRIPT ENGINE
   Developed and Designed by Son of Israel
   ========================================================== */

(function () {
    'use strict';

    // --- LOCAL STORAGE KEYS ---
    const STORAGE_KEYS = {
        USERS: 'our_language_users_v1',
        ADMINS: 'our_language_admins_v1',
        CURRENT_USER: 'our_language_current_user_v1',
        CURRENT_ADMIN: 'our_language_current_admin_v1',
        ATTENDANCE: 'our_language_attendance_v1',
        STUDY_REPORTS: 'our_language_study_reports_v1',
        MATERIALS: 'our_language_materials_v1',
        MESSAGES: 'our_language_messages_v1',
        ADMIN_MESSAGES: 'our_language_admin_messages_v1',
        ACTIVITY_LOG: 'our_language_activity_log_v1',
        NOTIFICATIONS: 'our_language_notifications_v1',
        SETTINGS: 'our_language_settings_v1'
    };

    // --- STATE MANAGEMENT ---
    let state = {
        currentUser: null,
        currentAdmin: null,
        users: [],
        admins: [],
        attendance: [],
        studyReports: [],
        materials: [],
        messages: [],
        adminMessages: [],
        activityLog: [],
        notifications: [],
        settings: {
            theme: 'clean-white',
            font: 'inter',
            fontSize: 'medium',
            language: 'en',
            soundAssistance: false
        },
        sessionStartTime: null,
        sessionTimerInterval: null
    };

    // --- INITIALIZATION ---
    document.addEventListener('DOMContentLoaded', () => {
        loadDataFromStorage();
        applySettings();
        initLiveClock();
        initNavigation();
        initAuthForms();
        initDashboardLogic();
        initAttendanceLogic();
        initStudyReportLogic();
        initMaterialsLogic();
        initChatLogic();
        initAdminChatLogic();
        initCalendarLogic();
        initProfileLogic();
        initSettingsLogic();
        initPWAInstallPrompt();
        checkActiveSessionOnLoad();
    });

    // --- STORAGE HELPERS ---
    function loadDataFromStorage() {
        try {
            state.users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
            state.admins = JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMINS)) || [];
            state.currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null;
            state.currentAdmin = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN)) || null;
            state.attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
            state.studyReports = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDY_REPORTS)) || [];
            state.materials = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATERIALS)) || [];
            state.messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES)) || [];
            state.adminMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_MESSAGES)) || [];
            state.activityLog = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG)) || [];
            state.notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
            
            const savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
            if (savedSettings) {
                state.settings = { ...state.settings, ...savedSettings };
            }
        } catch (e) {
            console.error('Error loading data from localStorage', e);
        }
    }

    function saveData(key) {
        try {
            switch(key) {
                case 'users': localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(state.users)); break;
                case 'admins': localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(state.admins)); break;
                case 'currentUser': localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(state.currentUser)); break;
                case 'currentAdmin': localStorage.setItem(STORAGE_KEYS.CURRENT_ADMIN, JSON.stringify(state.currentAdmin)); break;
                case 'attendance': localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(state.attendance)); break;
                case 'studyReports': localStorage.setItem(STORAGE_KEYS.STUDY_REPORTS, JSON.stringify(state.studyReports)); break;
                case 'materials': localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(state.materials)); break;
                case 'messages': localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(state.messages)); break;
                case 'adminMessages': localStorage.setItem(STORAGE_KEYS.ADMIN_MESSAGES, JSON.stringify(state.adminMessages)); break;
                case 'activityLog': localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(state.activityLog)); break;
                case 'notifications': localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(state.notifications)); break;
                case 'settings': localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings)); break;
            }
        } catch (e) {
            console.error('Error saving data to localStorage', e);
        }
    }

    function logActivity(action, details) {
        const logEntry = {
            id: 'act_' + Date.now(),
            timestamp: getTanzaniaDateTimeString(),
            action: action,
            details: details
        };
        state.activityLog.unshift(logEntry);
        saveData('activityLog');
    }

    // --- TIME & CLOCK (Tanzania Timezone: Africa/Dar_es_Salaam) ---
    function getTanzaniaDate() {
        return new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Dar_es_Salaam' }));
    }

    function getTanzaniaDateTimeString() {
        const d = getTanzaniaDate();
        return d.toISOString();
    }

    function initLiveClock() {
        const timeEl = document.getElementById('live-time');
        const dateEl = document.getElementById('live-date');
        if (!timeEl || !dateEl) return;

        function updateClock() {
            const now = getTanzaniaDate();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            timeEl.textContent = `${hours}:${minutes}:${seconds}`;

            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateEl.textContent = now.toLocaleDateString('en-US', options);
        }

        updateClock();
        setInterval(updateClock, 1000);
    }

    // --- TOAST NOTIFICATIONS & ACCESSIBILITY ---
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        // Sound assistance if enabled
        if (state.settings.soundAssistance && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            window.speechSynthesis.speak(utterance);
        }

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // --- AUTHENTICATION & SESSION MANAGEMENT ---
    function checkActiveSessionOnLoad() {
        if (document.body.classList.contains('user-body')) {
            if (state.currentUser) {
                showUserDashboard();
            } else {
                showUserAuth();
            }
        } else if (document.body.classList.contains('admin-body')) {
            if (state.currentAdmin) {
                showAdminDashboard();
            } else {
                showAdminAuth();
            }
        }
    }

    function showUserAuth() {
        const authView = document.getElementById('auth-view');
        const dashView = document.getElementById('main-dashboard-view');
        if (authView) authView.style.display = 'flex';
        if (dashView) dashView.style.display = 'none';
    }

    function showUserDashboard() {
        const authView = document.getElementById('auth-view');
        const dashView = document.getElementById('main-dashboard-view');
        if (authView) authView.style.display = 'none';
        if (dashView) dashView.style.display = 'flex';

        populateUserData();
        recordDailyAttendanceOnLogin();
        startSessionTimer();
    }

    function showAdminAuth() {
        const authView = document.getElementById('admin-auth-view');
        const dashView = document.getElementById('admin-dashboard-view');
        if (authView) authView.style.display = 'flex';
        if (dashView) dashView.style.display = 'none';
    }

    function showAdminDashboard() {
        const authView = document.getElementById('admin-auth-view');
        const dashView = document.getElementById('admin-dashboard-view');
        if (authView) authView.style.display = 'none';
        if (dashView) dashView.style.display = 'flex';

        populateAdminData();
    }

    // --- ATTENDANCE & 18:00 RULE ---
    function recordDailyAttendanceOnLogin() {
        if (!state.currentUser) return;
        const now = getTanzaniaDate();
        const dateStr = now.toISOString().split('T')[0];
        
        let existing = state.attendance.find(a => a.userId === state.currentUser.id && a.date === dateStr);
        if (!existing) {
            const loginTimeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
            
            // Attendance rule: before 18:00 is PRESENT, after 18:00 is ABSENT
            const status = now.getHours() < 18 ? 'PRESENT' : 'ABSENT';

            const newRecord = {
                id: 'att_' + Date.now(),
                userId: state.currentUser.id,
                userName: state.currentUser.fullName,
                cluster: state.currentUser.cluster,
                date: dateStr,
                loginTime: loginTimeStr,
                logoutTime: 'Active',
                duration: '00:00:00',
                status: status
            };
            state.attendance.push(newRecord);
            saveData('attendance');
            logActivity('User Attendance Recorded', `${state.currentUser.fullName} logged in (${status})`);
        }
    }

    function startSessionTimer() {
        state.sessionStartTime = new Date();
        if (state.sessionTimerInterval) clearInterval(state.sessionTimerInterval);

        state.sessionTimerInterval = setInterval(() => {
            if (!state.sessionStartTime) return;
            const now = new Date();
            const diffSec = Math.floor((now - state.sessionStartTime) / 1000);
            const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
            const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
            const secs = String(diffSec % 60).padStart(2, '0');
            const durStr = `${hrs}:${mins}:${secs}`;

            const durationEl = document.getElementById('dash-session-duration');
            const attDurationEl = document.getElementById('att-session-duration-display');
            if (durationEl) durationEl.textContent = durStr;
            if (attDurationEl) attDurationEl.textContent = durStr;
        }, 1000);
    }

    // --- AUTH FORMS & VALIDATION ---
    function initAuthForms() {
        // Tab switching for user auth
        document.querySelectorAll('.auth-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = btn.getAttribute('data-target');
                const parentCard = btn.closest('.auth-card');
                parentCard.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
                parentCard.querySelectorAll('.auth-form-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) targetPanel.classList.add('active');
            });
        });

        // Toggle password visibility
        document.querySelectorAll('.toggle-password-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.previousElementSibling;
                if (input.type === 'password') {
                    input.type = 'text';
                    btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
                } else {
                    input.type = 'password';
                    btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
                }
            });
        });

        // User Login Submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const usernameInput = document.getElementById('login-username').value.trim();
                const passwordInput = document.getElementById('login-password').value;

                if (!usernameInput || !passwordInput) {
                    showToast('Please fill in all login fields.', 'error');
                    return;
                }

                const user = state.users.find(u => u.username === usernameInput || u.email === usernameInput);
                if (user && user.password === passwordInput) {
                    state.currentUser = user;
                    saveData('currentUser');
                    logActivity('User Login', `${user.fullName} logged into the system.`);
                    showToast('Login successful! Welcome back.');
                    showUserDashboard();
                } else {
                    showToast('Invalid username/email or password.', 'error');
                }
            });
        }

        // User Registration Submission
        const regForm = document.getElementById('register-form');
        if (regForm) {
            const pwdInput = document.getElementById('reg-password');
            const strengthBar = document.getElementById('strength-bar');

            pwdInput.addEventListener('input', () => {
                const val = pwdInput.value;
                let strength = 0;
                if (val.length >= 8) strength += 25;
                if (/[A-Z]/.test(val)) strength += 25;
                if (/[0-9]/.test(val)) strength += 25;
                if (/[^A-Za-z0-9]/.test(val)) strength += 25;

                strengthBar.style.width = strength + '%';
                strengthBar.style.backgroundColor = strength < 50 ? '#dc2626' : strength < 100 ? '#ca8a04' : '#16a34a';
            });

            regForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fullName = document.getElementById('reg-fullname').value.trim();
                const cluster = document.getElementById('reg-cluster').value;
                const countryCode = document.getElementById('reg-country-code').value;
                const phone = document.getElementById('reg-phone').value.trim();
                const email = document.getElementById('reg-email').value.trim();
                const username = document.getElementById('reg-username').value.trim();
                const password = document.getElementById('reg-password').value;
                const repeatPassword = document.getElementById('reg-repeat-password').value;

                if (!fullName || !cluster || !phone || !email || !username || !password) {
                    showToast('Please complete all required registration fields.', 'error');
                    return;
                }

                if (password !== repeatPassword) {
                    showToast('Passwords do not match.', 'error');
                    return;
                }

                if (state.users.some(u => u.username === username)) {
                    showToast('Username already taken.', 'error');
                    return;
                }

                if (state.users.some(u => u.email === email)) {
                    showToast('Email already registered.', 'error');
                    return;
                }

                // Simulate Email Verification Flow frontend architecture
                // BACKEND INTEGRATION POINT: Trigger real SMTP verification email here
                document.getElementById('register-form-container').classList.remove('active');
                const verifyPanel = document.getElementById('verify-form-container');
                verifyPanel.style.display = 'block';
                document.getElementById('verify-email-display').textContent = email;

                window.pendingRegistrationUser = {
                    id: 'usr_' + Date.now(),
                    fullName, cluster, countryCode, phone, email, username, password,
                    avatar: '',
                    registrationDate: getTanzaniaDateTimeString()
                };

                showToast('Verification code simulated and sent to email.');
            });
        }

        // Email Verification Form Submission
        const verifyForm = document.getElementById('verify-form');
        if (verifyForm) {
            verifyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const code = document.getElementById('verify-code').value.trim();
                if (code.length !== 6) {
                    showToast('Please enter a valid 6-digit verification code.', 'error');
                    return;
                }

                if (window.pendingRegistrationUser) {
                    state.users.push(window.pendingRegistrationUser);
                    saveData('users');
                    logActivity('User Registered', `${window.pendingRegistrationUser.fullName} registered successfully.`);
                    showToast('Account verified successfully! You can now log in.');
                    
                    document.getElementById('verify-form-container').style.display = 'none';
                    document.getElementById('login-form-container').classList.add('active');
                    document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
                    document.querySelector('.auth-tab-btn[data-target="login-form-container"]').classList.add('active');
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                state.currentUser = null;
                localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
                if (state.sessionTimerInterval) clearInterval(state.sessionTimerInterval);
                showToast('Logged out successfully.');
                showUserAuth();
            });
        }

        // Admin Auth
        const adminLoginForm = document.getElementById('admin-login-form');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('admin-login-email').value.trim();
                const password = document.getElementById('admin-login-password').value;

                const admin = state.admins.find(a => a.email === email && a.password === password);
                if (admin || (email === 'admin@ourlanguage.com' && password === 'Admin@1234')) {
                    state.currentAdmin = admin || { id: 'adm_default', name: 'Super Admin', email: 'admin@ourlanguage.com' };
                    saveData('currentAdmin');
                    logActivity('Admin Login', 'Administrator logged into admin portal.');
                    showToast('Admin login successful.');
                    showAdminDashboard();
                } else {
                    showToast('Invalid admin credentials.', 'error');
                }
            });
        }

        const adminRegForm = document.getElementById('admin-register-form');
        if (adminRegForm) {
            adminRegForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('admin-reg-name').value.trim();
                const email = document.getElementById('admin-reg-email').value.trim();
                const phone = document.getElementById('admin-reg-phone').value.trim();
                const password = document.getElementById('admin-reg-password').value;

                if (!name || !email || !password) {
                    showToast('Please fill all admin registration fields.', 'error');
                    return;
                }

                const newAdmin = { id: 'adm_' + Date.now(), name, email, phone, password };
                state.admins.push(newAdmin);
                saveData('admins');
                logActivity('Admin Registered', `${name} registered as administrator.`);
                showToast('Admin account registered successfully.');
                document.getElementById('admin-register-panel').classList.remove('active');
                document.getElementById('admin-login-panel').classList.add('active');
            });
        }

        const adminLogoutBtn = document.getElementById('admin-logout-btn');
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', () => {
                state.currentAdmin = null;
                localStorage.removeItem(STORAGE_KEYS.CURRENT_ADMIN);
                showToast('Admin logged out.');
                showAdminAuth();
            });
        }
    }

    // --- NAVIGATION & UI BINDINGS ---
    function initNavigation() {
        // Sidebar toggle for mobile/desktop
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        const closeBtn = document.getElementById('sidebar-close-btn');

        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
        }
        if (closeBtn && sidebar) {
            closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));
        }

        // Section tab navigation
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSectionId = link.getAttribute('data-section');
                
                document.querySelectorAll('.sidebar-nav .nav-link').forEach(l => l.classList.remove('active'));
                document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));

                link.classList.add('active');
                const targetSec = document.getElementById(targetSectionId);
                if (targetSec) targetSec.classList.add('active');

                if (window.innerWidth <= 768 && sidebar) {
                    sidebar.classList.remove('open');
                }
            });
        });
    }

    function populateUserData() {
        if (!state.currentUser) return;
        
        const nameEls = [
            document.getElementById('sidebar-username-display'),
            document.getElementById('header-user-name'),
            document.getElementById('welcome-message-heading'),
            document.getElementById('profile-card-name')
        ];
        nameEls.forEach(el => {
            if (el) el.textContent = el.id.includes('welcome') ? `Welcome, ${state.currentUser.fullName}` : state.currentUser.fullName;
        });

        const clusterEls = [
            document.getElementById('sidebar-cluster-display'),
            document.getElementById('dash-cluster-val'),
            document.getElementById('profile-card-cluster'),
            document.getElementById('report-cluster')
        ];
        clusterEls.forEach(el => {
            if (el) {
                if (el.tagName === 'INPUT') el.value = state.currentUser.cluster;
                else el.textContent = state.currentUser.cluster;
            }
        });

        const usernameEls = [document.getElementById('profile-card-username')];
        usernameEls.forEach(el => { if (el) el.textContent = '@' + state.currentUser.username; });

        // Avatars
        const avatarSrc = state.currentUser.avatar || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23ccc\'><path d=\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z\'/></svg>';
        document.querySelectorAll('#sidebar-user-avatar, #header-user-avatar, #profile-view-avatar').forEach(img => {
            if (img) img.src = avatarSrc;
        });

        // Populate edit profile form
        if (document.getElementById('edit-fullname')) {
            document.getElementById('edit-fullname').value = state.currentUser.fullName;
            document.getElementById('edit-email').value = state.currentUser.email;
            document.getElementById('edit-phone').value = state.currentUser.phone;
            document.getElementById('edit-cluster').value = state.currentUser.cluster;
        }

        updateDashboardCounters();
        renderAttendanceHistory();
        renderStudyReportsHistory();
        renderMaterialsList();
    }

    function updateDashboardCounters() {
        if (!state.currentUser) return;
        const userReports = state.studyReports.filter(r => r.userId === state.currentUser.id);
        const repCountEl = document.getElementById('dash-reports-count');
        if (repCountEl) repCountEl.textContent = userReports.length;

        const matCountEl = document.getElementById('dash-materials-count');
        if (matCountEl) matCountEl.textContent = state.materials.length;
    }

    // --- DASHBOARD LOGIC ---
    function initDashboardLogic() {
        // Dashboard specific interactions if any
    }

    // --- ATTENDANCE LOGIC ---
    function initAttendanceLogic() {
        // Attendance views populated via renderAttendanceHistory
    }

    function renderAttendanceHistory() {
        if (!state.currentUser) return;
        const tbody = document.getElementById('full-attendance-tbody');
        const dashTbody = document.getElementById('session-audit-tbody');
        const userAtt = state.attendance.filter(a => a.userId === state.currentUser.id);

        if (userAtt.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center">No attendance records yet.</td></tr>';
            if (dashTbody) dashTbody.innerHTML = '<tr><td colspan="5" class="text-center">No session history available yet.</td></tr>';
            return;
        }

        const html = userAtt.map(a => `
            <tr>
                <td>${a.date}</td>
                <td>${a.loginTime}</td>
                <td>${a.logoutTime}</td>
                <td>${a.duration}</td>
                <td><span class="status-badge ${a.status.toLowerCase()}">${a.status}</span></td>
            </tr>
        `).join('');

        if (tbody) tbody.innerHTML = html;
        if (dashTbody) dashTbody.innerHTML = html;
    }

    // --- DAILY STUDY REPORT LOGIC ---
    function initStudyReportLogic() {
        const hasChallengeSelect = document.getElementById('report-has-challenge');
        const challengeGroup = document.getElementById('challenge-desc-group');

        if (hasChallengeSelect && challengeGroup) {
            hasChallengeSelect.addEventListener('change', () => {
                if (hasChallengeSelect.value === 'YES') {
                    challengeGroup.style.display = 'block';
                } else {
                    challengeGroup.style.display = 'none';
                }
            });
        }

        const form = document.getElementById('study-report-form');
        if (form) {
            // Set default date to today
            const dateInput = document.getElementById('report-date');
            if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!state.currentUser) return;

                const date = document.getElementById('report-date').value;
                const cluster = state.currentUser.cluster;
                const topic = document.getElementById('report-topic').value.trim();
                const description = document.getElementById('report-description').value.trim();
                const hasChallenge = document.getElementById('report-has-challenge').value;
                const challengeDesc = document.getElementById('report-challenge-desc').value.trim();

                if (!topic || !description) {
                    showToast('Please fill in all required report fields.', 'error');
                    return;
                }

                const newReport = {
                    id: 'rep_' + Date.now(),
                    userId: state.currentUser.id,
                    userName: state.currentUser.fullName,
                    cluster,
                    date,
                    topic,
                    description,
                    hasChallenge,
                    challengeDesc: hasChallenge === 'YES' ? challengeDesc : 'No challenge'
                };

                state.studyReports.push(newReport);
                saveData('studyReports');
                logActivity('Study Report Submitted', `${state.currentUser.fullName} submitted report on ${topic}`);
                showToast('Study report saved successfully.');
                form.reset();
                if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
                populateUserData();
            });
        }
    }

    function renderStudyReportsHistory() {
        if (!state.currentUser) return;
        const container = document.getElementById('study-reports-history-list');
        if (!container) return;

        const userReports = state.studyReports.filter(r => r.userId === state.currentUser.id);
        if (userReports.length === 0) {
            container.innerHTML = '<div class="empty-state">No study reports submitted yet.</div>';
            return;
        }

        container.innerHTML = userReports.map(r => `
            <div class="card mb-2" style="padding: 1rem;">
                <div class="space-between">
                    <strong>${r.topic}</strong>
                    <small class="text-muted">${r.date}</small>
                </div>
                <p style="margin: 0.5rem 0; font-size: 0.9rem;">${r.description}</p>
                <small><strong>Challenge:</strong> ${r.challengeDesc}</small>
            </div>
        `).join('');
    }

    // --- MATERIALS LOGIC ---
    function initMaterialsLogic() {
        const searchInput = document.getElementById('material-search-input');
        const typeFilter = document.getElementById('material-type-filter');

        if (searchInput) searchInput.addEventListener('input', renderMaterialsList);
        if (typeFilter) typeFilter.addEventListener('change', renderMaterialsList);
    }

    function renderMaterialsList() {
        const tbody = document.getElementById('materials-tbody');
        if (!tbody) return;

        const searchVal = document.getElementById('material-search-input')?.value.toLowerCase() || '';
        const typeVal = document.getElementById('material-type-filter')?.value || 'ALL';

        let filtered = state.materials.filter(m => {
            const matchesSearch = m.title.toLowerCase().includes(searchVal);
            const matchesType = typeVal === 'ALL' || m.fileType === typeVal;
            return matchesSearch && matchesType;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No materials available yet.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(m => `
            <tr>
                <td>${m.title}</td>
                <td><span class="cluster-badge">${m.fileType}</span></td>
                <td>${m.uploadDate}</td>
                <td>${m.fileSize}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="window.downloadMaterial('${m.id}')"><i class="fa-solid fa-download"></i> Download</button>
                </td>
            </tr>
        `).join('');
    }

    window.downloadMaterial = function (id) {
        const mat = state.materials.find(m => m.id === id);
        if (!mat) return;
        // BACKEND INTEGRATION POINT: Connect secure file storage download URL
        showToast(`Downloading ${mat.title}...`);
        const a = document.createElement('a');
        a.href = mat.fileData;
        a.download = mat.title + '.' + (mat.fileType === 'PDF' ? 'pdf' : mat.fileType === 'WORD' ? 'docx' : 'pptx');
        document.body.appendChild(a);
        a.click();
        a.remove();
        logActivity('Material Downloaded', `${state.currentUser.fullName} downloaded ${mat.title}`);
    };

    // --- CHAT SYSTEM LOGIC ---
    function initChatLogic() {
        const searchInput = document.getElementById('chat-user-search');
        if (searchInput) {
            searchInput.addEventListener('input', renderChatUsersList);
        }

        const chatForm = document.getElementById('chat-input-form');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('chat-message-input');
                const text = input.value.trim();
                if (!text || !window.activeChatUserId || !state.currentUser) return;

                const newMsg = {
                    id: 'msg_' + Date.now(),
                    senderId: state.currentUser.id,
                    receiverId: window.activeChatUserId,
                    text: text,
                    timestamp: getTanzaniaDateTimeString()
                };

                state.messages.push(newMsg);
                saveData('messages');
                input.value = '';
                renderActiveChatMessages();
            });
        }
        renderChatUsersList();
    }

    function renderChatUsersList() {
        if (!state.currentUser) return;
        const container = document.getElementById('chat-users-list');
        if (!container) return;

        const otherUsers = state.users.filter(u => u.id !== state.currentUser.id);
        if (otherUsers.length === 0) {
            container.innerHTML = '<div class="empty-state-small">No other users registered yet.</div>';
            return;
        }

        container.innerHTML = otherUsers.map(u => `
            <div class="chat-user-item ${window.activeChatUserId === u.id ? 'active' : ''}" onclick="window.openChatUser('${u.id}')">
                <img src="${u.avatar || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23ccc\'><path d=\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z\'/></svg>'}" alt="Avatar">
                <div>
                    <strong>${u.fullName}</strong>
                    <small class="text-muted d-block">@${u.username}</small>
                </div>
            </div>
        `).join('');
    }

    window.openChatUser = function (userId) {
        window.activeChatUserId = userId;
        const recipient = state.users.find(u => u.id === userId);
        if (recipient) {
            document.getElementById('chat-active-name').textContent = recipient.fullName;
            document.getElementById('chat-active-status').textContent = 'Online';
            document.getElementById('chat-input-form').style.display = 'flex';
            renderChatUsersList();
            renderActiveChatMessages();
        }
    };

    function renderActiveChatMessages() {
        const box = document.getElementById('chat-messages-box');
        if (!box || !window.activeChatUserId || !state.currentUser) return;

        const chatMsgs = state.messages.filter(m => 
            (m.senderId === state.currentUser.id && m.receiverId === window.activeChatUserId) ||
            (m.senderId === window.activeChatUserId && m.receiverId === state.currentUser.id)
        );

        if (chatMsgs.length === 0) {
            box.innerHTML = '<div class="empty-state">No messages yet. Start the conversation!</div>';
            return;
        }

        box.innerHTML = chatMsgs.map(m => {
            const isOutgoing = m.senderId === state.currentUser.id;
            return `
                <div class="chat-message ${isOutgoing ? 'outgoing' : 'incoming'}">
                    <p>${m.text}</p>
                    <small class="text-muted" style="font-size: 0.65rem; display: block; margin-top: 4px;">${new Date(m.timestamp).toLocaleTimeString()}</small>
                </div>
            `;
        }).join('');
        box.scrollTop = box.scrollHeight;
    }

    // --- ADMIN CHAT LOGIC ---
    function initAdminChatLogic() {
        const form = document.getElementById('admin-chat-input-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('admin-chat-message-input');
                const text = input.value.trim();
                if (!text || !state.currentUser) return;

                const newMsg = {
                    id: 'adm_msg_' + Date.now(),
                    userId: state.currentUser.id,
                    userName: state.currentUser.fullName,
                    sender: 'user',
                    text: text,
                    timestamp: getTanzaniaDateTimeString()
                };

                state.adminMessages.push(newMsg);
                saveData('adminMessages');
                input.value = '';
                renderAdminChatMessages();
                logActivity('Support Message Sent', `${state.currentUser.fullName} sent message to admin.`);
            });
        }
        renderAdminChatMessages();
    }

    function renderAdminChatMessages() {
        if (!state.currentUser) return;
        const box = document.getElementById('admin-chat-messages-box');
        if (!box) return;

        const userMsgs = state.adminMessages.filter(m => m.userId === state.currentUser.id);
        if (userMsgs.length === 0) {
            box.innerHTML = '<div class="empty-state">No messages with admin yet. Send a message to initiate support.</div>';
            return;
        }

        box.innerHTML = userMsgs.map(m => {
            const isOutgoing = m.sender === 'user';
            return `
                <div class="chat-message ${isOutgoing ? 'outgoing' : 'incoming'}">
                    <p><strong>${isOutgoing ? 'You' : 'Admin'}:</strong> ${m.text}</p>
                    <small class="text-muted" style="font-size: 0.65rem; display: block; margin-top: 4px;">${new Date(m.timestamp).toLocaleTimeString()}</small>
                </div>
            `;
        }).join('');
        box.scrollTop = box.scrollHeight;
    }

    // --- CALENDAR LOGIC ---
    function initCalendarLogic() {
        let currentDate = getTanzaniaDate();

        function renderCalendar() {
            const grid = document.getElementById('calendar-days-grid');
            const title = document.getElementById('cal-month-year-display');
            if (!grid || !title) return;

            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            title.textContent = `${monthNames[month]} ${year}`;

            const firstDayIndex = new Date(year, month, 1).getDay();
            const totalDays = new Date(year, month + 1, 0).getDate();

            let html = '';
            for (let i = 0; i < firstDayIndex; i++) {
                html += `<div></div>`;
            }

            const today = getTanzaniaDate();
            for (let day = 1; day <= totalDays; day++) {
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                html += `<div class="calendar-day-cell ${isToday ? 'today' : ''}">${day}</div>`;
            }
            grid.innerHTML = html;
        }

        const prevBtn = document.getElementById('cal-prev-month');
        const nextBtn = document.getElementById('cal-next-month');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() - 1);
                renderCalendar();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() + 1);
                renderCalendar();
            });
        }

        renderCalendar();
    }

    // --- PROFILE & CAMERA LOGIC ---
    function initProfileLogic() {
        const fileInput = document.getElementById('avatar-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        const base64 = event.target.result;
                        if (state.currentUser) {
                            state.currentUser.avatar = base64;
                            saveData('currentUser');
                            // Update in users array
                            const idx = state.users.findIndex(u => u.id === state.currentUser.id);
                            if (idx !== -1) {
                                state.users[idx] = state.currentUser;
                                saveData('users');
                            }
                            populateUserData();
                            showToast('Profile picture updated successfully.');
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Camera Modal Logic
        const cameraModal = document.getElementById('camera-modal');
        const openCameraBtn = document.getElementById('open-camera-modal-btn');
        const closeCameraBtn = document.getElementById('close-camera-modal');
        const cancelCameraBtn = document.getElementById('cancel-camera-btn');
        const takeSnapshotBtn = document.getElementById('take-snapshot-btn');
        const video = document.getElementById('camera-video');

        let mediaStream = null;

        if (openCameraBtn && cameraModal) {
            openCameraBtn.addEventListener('click', async () => {
                cameraModal.style.display = 'flex';
                try {
                    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    if (video) video.srcObject = mediaStream;
                } catch (err) {
                    showToast('Unable to access device camera.', 'error');
                    cameraModal.style.display = 'none';
                }
            });
        }

        function closeCamera() {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                mediaStream = null;
            }
            if (cameraModal) cameraModal.style.display = 'none';
        }

        if (closeCameraBtn) closeCameraBtn.addEventListener('click', closeCamera);
        if (cancelCameraBtn) cancelCameraBtn.addEventListener('click', closeCamera);

        if (takeSnapshotBtn) {
            takeSnapshotBtn.addEventListener('click', () => {
                const canvas = document.getElementById('camera-canvas');
                if (!canvas || !video) return;
                canvas.width = video.videoWidth || 320;
                canvas.height = video.videoHeight || 240;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/png');

                if (state.currentUser) {
                    state.currentUser.avatar = dataUrl;
                    saveData('currentUser');
                    const idx = state.users.findIndex(u => u.id === state.currentUser.id);
                    if (idx !== -1) {
                        state.users[idx] = state.currentUser;
                        saveData('users');
                    }
                    populateUserData();
                    showToast('Snapshot captured and saved as profile photo.');
                }
                closeCamera();
            });
        }

        // Edit Profile Form Submission
        const editForm = document.getElementById('edit-profile-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!state.currentUser) return;

                state.currentUser.fullName = document.getElementById('edit-fullname').value.trim();
                state.currentUser.email = document.getElementById('edit-email').value.trim();
                state.currentUser.phone = document.getElementById('edit-phone').value.trim();
                state.currentUser.cluster = document.getElementById('edit-cluster').value;

                saveData('currentUser');
                const idx = state.users.findIndex(u => u.id === state.currentUser.id);
                if (idx !== -1) {
                    state.users[idx] = state.currentUser;
                    saveData('users');
                }
                populateUserData();
                showToast('Profile updated successfully.');
                logActivity('Profile Updated', `${state.currentUser.fullName} updated profile details.`);
            });
        }
    }

    // --- SETTINGS LOGIC ---
    function initSettingsLogic() {
        const themeSelect = document.getElementById('setting-theme-select');
        const fontSelect = document.getElementById('setting-font-select');
        const fontSizeSelect = document.getElementById('setting-fontsize-select');
        const langSelect = document.getElementById('setting-language-select');
        const soundToggle = document.getElementById('setting-sound-toggle');
        const soundLabel = document.getElementById('sound-status-label');

        if (themeSelect) themeSelect.value = state.settings.theme;
        if (fontSelect) fontSelect.value = state.settings.font;
        if (fontSizeSelect) fontSizeSelect.value = state.settings.fontSize;
        if (langSelect) langSelect.value = state.settings.language;
        if (soundToggle) {
            soundToggle.checked = state.settings.soundAssistance;
            if (soundLabel) soundLabel.textContent = state.settings.soundAssistance ? 'Enabled' : 'Disabled';
        }

        if (themeSelect) {
            themeSelect.addEventListener('change', () => {
                state.settings.theme = themeSelect.value;
                saveData('settings');
                applySettings();
            });
        }
        if (fontSelect) {
            fontSelect.addEventListener('change', () => {
                state.settings.font = fontSelect.value;
                saveData('settings');
                applySettings();
            });
        }
        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', () => {
                state.settings.fontSize = fontSizeSelect.value;
                saveData('settings');
                applySettings();
            });
        }
        if (langSelect) {
            langSelect.addEventListener('change', () => {
                state.settings.language = langSelect.value;
                saveData('settings');
                applySettings();
            });
        }
        if (soundToggle) {
            soundToggle.addEventListener('change', () => {
                state.settings.soundAssistance = soundToggle.checked;
                saveData('settings');
                if (soundLabel) soundLabel.textContent = soundToggle.checked ? 'Enabled' : 'Disabled';
            });
        }
    }

    function applySettings() {
        const root = document.documentElement;
        root.setAttribute('data-theme', state.settings.theme);
        root.setAttribute('data-font', state.settings.font);
        root.setAttribute('data-font-size', state.settings.fontSize);
        
        if (state.settings.language === 'ar') {
            root.setAttribute('dir', 'rtl');
        } else {
            root.setAttribute('dir', 'ltr');
        }
    }

    // --- PWA INSTALL PROMPT ---
    function initPWAInstallPrompt() {
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            const installBtn = document.getElementById('install-app-btn');
            if (installBtn) {
                installBtn.style.display = 'block';
                installBtn.addEventListener('click', () => {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            showToast('Thank you for installing Our Language!');
                        }
                        deferredPrompt = null;
                    });
                });
            }
        });
    }

    // ================= ADMIN PORTAL LOGIC =================
    function populateAdminData() {
        if (!state.currentAdmin) return;
        const nameEl = document.getElementById('admin-welcome-name');
        const headerName = document.getElementById('admin-header-name');
        if (nameEl) nameEl.textContent = state.currentAdmin.name;
        if (headerName) headerName.textContent = state.currentAdmin.name;

        // Statistics
        const totalUsersEl = document.getElementById('admin-stat-total-users');
        const presentUsersEl = document.getElementById('admin-stat-present-users');
        const absentUsersEl = document.getElementById('admin-stat-absent-users');
        const totalMatsEl = document.getElementById('admin-stat-total-materials');
        const totalRepsEl = document.getElementById('admin-stat-total-reports');
        const unreadMsgsEl = document.getElementById('admin-stat-unread-msgs');

        if (totalUsersEl) totalUsersEl.textContent = state.users.length;
        if (totalMatsEl) totalMatsEl.textContent = state.materials.length;
        if (totalRepsEl) totalRepsEl.textContent = state.studyReports.length;

        // Calculate present vs absent today based on 18:00 rule
        const todayStr = getTanzaniaDate().toISOString().split('T')[0];
        const todayAtt = state.attendance.filter(a => a.date === todayStr);
        const presentCount = todayAtt.filter(a => a.status === 'PRESENT').length;
        const absentCount = state.users.length - presentCount;

        if (presentUsersEl) presentUsersEl.textContent = presentCount;
        if (absentUsersEl) absentUsersEl.textContent = Math.max(0, absentCount);

        renderAdminUsersTable();
        renderAdminAttendanceTable();
        renderAdminReportsTable();
        renderAdminMaterialsManagement();
        renderAdminSupportChats();
        renderAdminActivityLog();
        initAdminUserModal();
    }

    function renderAdminUsersTable() {
        const tbody = document.getElementById('admin-users-tbody');
        if (!tbody) return;

        if (state.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No users registered yet.</td></tr>';
            return;
        }

        tbody.innerHTML = state.users.map(u => `
            <tr>
                <td><img src="${u.avatar || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23ccc\'><path d=\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z\'/></svg>'}" alt="Avatar" width="32" height="32" style="border-radius:50%;object-fit:cover;"></td>
                <td>${u.fullName}</td>
                <td>@${u.username}</td>
                <td>${u.email}</td>
                <td>${u.countryCode} ${u.phone}</td>
                <td><span class="cluster-badge">${u.cluster}</span></td>
                <td><span class="status-badge present">ACTIVE</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="window.adminEditUser('${u.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="window.adminDeleteUser('${u.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    window.adminDeleteUser = function (id) {
        if (confirm('Are you sure you want to remove this user?')) {
            state.users = state.users.filter(u => u.id !== id);
            saveData('users');
            logActivity('User Removed by Admin', `User ID ${id} deleted.`);
            showToast('User removed successfully.');
            populateAdminData();
        }
    };

    window.adminEditUser = function (id) {
        const u = state.users.find(user => user.id === id);
        if (!u) return;

        document.getElementById('admin-modal-title').textContent = 'Edit User';
        document.getElementById('modal-user-id').value = u.id;
        document.getElementById('modal-user-fullname').value = u.fullName;
        document.getElementById('modal-user-cluster').value = u.cluster;
        document.getElementById('modal-user-phone').value = u.phone;
        document.getElementById('modal-user-email').value = u.email;
        document.getElementById('modal-user-username').value = u.username;
        document.getElementById('modal-user-password').value = u.password;

        document.getElementById('admin-user-modal').style.display = 'flex';
    };

    function initAdminUserModal() {
        const openBtn = document.getElementById('open-add-user-modal-btn');
        const modal = document.getElementById('admin-user-modal');
        const closeBtn = document.getElementById('close-admin-user-modal');
        const form = document.getElementById('admin-user-modal-form');

        if (openBtn && modal) {
            openBtn.addEventListener('click', () => {
                document.getElementById('admin-modal-title').textContent = 'Add New User';
                form.reset();
                document.getElementById('modal-user-id').value = '';
                modal.style.display = 'flex';
            });
        }
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.style.display = 'none');
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('modal-user-id').value;
                const fullName = document.getElementById('modal-user-fullname').value.trim();
                const cluster = document.getElementById('modal-user-cluster').value;
                const phone = document.getElementById('modal-user-phone').value.trim();
                const email = document.getElementById('modal-user-email').value.trim();
                const username = document.getElementById('modal-user-username').value.trim();
                const password = document.getElementById('modal-user-password').value;

                if (id) {
                    // Edit existing
                    const idx = state.users.findIndex(u => u.id === id);
                    if (idx !== -1) {
                        state.users[idx] = { ...state.users[idx], fullName, cluster, phone, email, username, password };
                        saveData('users');
                        showToast('User updated successfully.');
                        logActivity('User Updated by Admin', `${fullName} account updated.`);
                    }
                } else {
                    // Add new
                    const newUser = {
                        id: 'usr_' + Date.now(),
                        fullName, cluster, countryCode: '+255', phone, email, username, password,
                        avatar: '', registrationDate: getTanzaniaDateTimeString()
                    };
                    state.users.push(newUser);
                    saveData('users');
                    showToast('User added successfully.');
                    logActivity('User Added by Admin', `${fullName} added to system.`);
                }

                modal.style.display = 'none';
                populateAdminData();
            });
        }
    }

    function renderAdminAttendanceTable() {
        const tbody = document.getElementById('admin-attendance-tbody');
        if (!tbody) return;

        if (state.attendance.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No attendance records yet.</td></tr>';
            return;
        }

        tbody.innerHTML = state.attendance.map(a => `
            <tr>
                <td>${a.userName}</td>
                <td><span class="cluster-badge">${a.cluster}</span></td>
                <td>${a.date}</td>
                <td>${a.loginTime}</td>
                <td>${a.logoutTime}</td>
                <td>${a.duration}</td>
                <td><span class="status-badge ${a.status.toLowerCase()}">${a.status}</span></td>
            </tr>
        `).join('');
    }

    function renderAdminReportsTable() {
        const tbody = document.getElementById('admin-reports-tbody');
        if (!tbody) return;

        if (state.studyReports.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No study reports submitted yet.</td></tr>';
            return;
        }

        tbody.innerHTML = state.studyReports.map(r => `
            <tr>
                <td>${r.userName}</td>
                <td><span class="cluster-badge">${r.cluster}</span></td>
                <td>${r.date}</td>
                <td>${r.topic}</td>
                <td>${r.description}</td>
                <td>${r.challengeDesc}</td>
            </tr>
        `).join('');
    }

    function renderAdminMaterialsManagement() {
        const uploadForm = document.getElementById('admin-upload-material-form');
        if (uploadForm) {
            // Remove previous event listeners by cloning
            const newForm = uploadForm.cloneNode(true);
            uploadForm.parentNode.replaceChild(newForm, uploadForm);

            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fileInput = document.getElementById('material-file');
                const titleInput = document.getElementById('material-title');
                const file = fileInput.files[0];
                const title = titleInput.value.trim();

                if (!file || !title) {
                    showToast('Please select a file and provide a title.', 'error');
                    return;
                }

                const ext = file.name.split('.').pop().toLowerCase();
                let fileType = 'PDF';
                if (['doc', 'docx'].includes(ext)) fileType = 'WORD';
                if (['ppt', 'pptx'].includes(ext)) fileType = 'POWERPOINT';

                const reader = new FileReader();
                reader.onload = function (event) {
                    const newMat = {
                        id: 'mat_' + Date.now(),
                        title,
                        fileType,
                        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                        uploadDate: getTanzaniaDate().toLocaleDateString(),
                        fileData: event.target.result
                    };

                    state.materials.push(newMat);
                    saveData('materials');
                    logActivity('Material Uploaded', `Admin uploaded material: ${title}`);
                    showToast('Material uploaded successfully.');
                    newForm.reset();
                    populateAdminData();
                };
                reader.readAsDataURL(file);
            });
        }

        const tbody = document.getElementById('admin-materials-tbody');
        if (tbody) {
            if (state.materials.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">No materials uploaded yet.</td></tr>';
                return;
            }

            tbody.innerHTML = state.materials.map(m => `
                <tr>
                    <td>${m.title}</td>
                    <td><span class="cluster-badge">${m.fileType}</span></td>
                    <td>${m.uploadDate}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="window.adminDeleteMaterial('${m.id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        }
    }

    window.adminDeleteMaterial = function (id) {
        if (confirm('Delete this material?')) {
            state.materials = state.materials.filter(m => m.id !== id);
            saveData('materials');
            logActivity('Material Removed', `Material ID ${id} removed by admin.`);
            showToast('Material removed.');
            populateAdminData();
        }
    };

    function renderAdminSupportChats() {
        const usersList = document.getElementById('admin-chat-users-list');
        if (!usersList) return;

        const activeUsersWithMsgs = [...new Set(state.adminMessages.map(m => m.userId))];
        if (activeUsersWithMsgs.length === 0) {
            usersList.innerHTML = '<div class="empty-state-small">No messages from users yet.</div>';
            return;
        }

        usersList.innerHTML = activeUsersWithMsgs.map(userId => {
            const user = state.users.find(u => u.id === userId);
            const userName = user ? user.fullName : 'Unknown User';
            return `
                <div class="chat-user-item ${window.adminActiveUserId === userId ? 'active' : ''}" onclick="window.adminOpenUserChat('${userId}')">
                    <div>
                        <strong>${userName}</strong>
                    </div>
                </div>
            `;
        }).join('');
    }

    window.adminOpenUserChat = function (userId) {
        window.adminActiveUserId = userId;
        const user = state.users.find(u => u.id === userId);
        if (user) {
            document.getElementById('admin-chat-active-name').textContent = user.fullName;
            document.getElementById('admin-chat-reply-form').style.display = 'flex';
            renderAdminActiveChatMessages();
        }
    };

    function renderAdminActiveChatMessages() {
        const box = document.getElementById('admin-chat-messages-box');
        if (!box || !window.adminActiveUserId) return;

        const msgs = state.adminMessages.filter(m => m.userId === window.adminActiveUserId);
        box.innerHTML = msgs.map(m => {
            const isOutgoing = m.sender === 'admin';
            return `
                <div class="chat-message ${isOutgoing ? 'outgoing' : 'incoming'}">
                    <p><strong>${isOutgoing ? 'Admin' : m.userName}:</strong> ${m.text}</p>
                    <small class="text-muted" style="font-size: 0.65rem; display: block; margin-top: 4px;">${new Date(m.timestamp).toLocaleTimeString()}</small>
                </div>
            `;
        }).join('');
        box.scrollTop = box.scrollHeight;

        const replyForm = document.getElementById('admin-chat-reply-form');
        const newReplyForm = replyForm.cloneNode(true);
        replyForm.parentNode.replaceChild(newReplyForm, replyForm);

        newReplyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('admin-chat-reply-input');
            const text = input.value.trim();
            if (!text) return;

            const user = state.users.find(u => u.id === window.adminActiveUserId);
            const newMsg = {
                id: 'adm_msg_' + Date.now(),
                userId: window.adminActiveUserId,
                userName: user ? user.fullName : 'User',
                sender: 'admin',
                text: text,
                timestamp: getTanzaniaDateTimeString()
            };

            state.adminMessages.push(newMsg);
            saveData('adminMessages');
            input.value = '';
            renderAdminActiveChatMessages();
            logActivity('Admin Support Reply', `Admin replied to ${user ? user.fullName : 'user'}.`);
        });
    }

    function renderAdminActivityLog() {
        const tbody = document.getElementById('admin-activity-tbody');
        if (!tbody) return;

        if (state.activityLog.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">No activity recorded yet.</td></tr>';
            return;
        }

        tbody.innerHTML = state.activityLog.map(log => `
            <tr>
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td><strong>${log.action}</strong></td>
                <td>${log.details}</td>
            </tr>
        `).join('');
    }

})();