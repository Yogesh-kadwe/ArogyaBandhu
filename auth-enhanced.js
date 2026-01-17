// Enhanced Authentication System with Role-Based Access Control (RBAC)
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
        this.initializeAuth();
    }

    // User database with role-based permissions
    userDatabase = {
        '9876543210': {
            id: 'patient_001',
            name: 'Rani Devi',
            role: 'patient',
            permissions: ['view_health_records', 'book_appointments', 'emergency_sos'],
            dashboard: 'patient-dashboard.html',
            phone: '9876543210',
            village: 'Ramgarh',
            lastLogin: null
        },
        '9876543211': {
            id: 'pregnant_001',
            name: 'Geeta Sharma',
            role: 'pregnant',
            permissions: ['view_health_records', 'maternal_care', 'prenatal_tracking', 'emergency_sos'],
            dashboard: 'pregnant-dashboard.html',
            phone: '9876543211',
            village: 'Ramgarh',
            lmp: '2024-01-15', // Last Menstrual Period
            riskLevel: 'moderate',
            lastLogin: null
        },
        '9876543212': {
            id: 'doctor_001',
            name: 'Dr. Rajesh Kumar',
            role: 'doctor',
            permissions: ['view_patient_records', 'prescribe_medicine', 'manage_appointments', 'access_blood_donor', 'view_asha_reports'],
            dashboard: 'doctor-dashboard.html',
            phone: '9876543212',
            specialization: 'General Medicine',
            hospital: 'District Hospital',
            lastLogin: null
        },
        '9876543213': {
            id: 'asha_001',
            name: 'Sunita Devi',
            role: 'asha',
            permissions: ['view_assigned_families', 'maternal_monitoring', 'vaccination_tracking', 'health_surveys', 'emergency_response'],
            dashboard: 'asha-dashboard.html',
            phone: '9876543213',
            assignedVillages: ['Ramgarh', 'Sohna', 'Mohanpur'],
            lastLogin: null
        },
        '9876543214': {
            id: 'admin_001',
            name: 'System Administrator',
            role: 'admin',
            permissions: ['system_admin', 'user_management', 'view_all_data', 'system_reports', 'emergency_override'],
            dashboard: 'admin-dashboard.html',
            phone: '9876543214',
            lastLogin: null
        }
    };

    initializeAuth() {
        // Check for existing session
        const session = this.getSession();
        if (session && this.isSessionValid(session)) {
            this.currentUser = session.user;
            this.redirectToDashboard(session.user.role);
        }

        // Auto-logout on session expiry
        setInterval(() => {
            if (this.currentUser && !this.isSessionValid(this.getSession())) {
                this.logout();
            }
        }, 60000); // Check every minute
    }

    login(credentials) {
        const { userId, password, role } = credentials;
        
        // Enhanced validation
        if (!userId || !password || !role) {
            return { success: false, message: 'Please fill in all fields' };
        }

        // Find user in database
        const user = this.findUser(userId, role);
        if (!user) {
            return { success: false, message: 'Invalid credentials or role' };
        }

        // Password validation (demo: any password works)
        if (password.length < 4) {
            return { success: false, message: 'Password must be at least 4 characters' };
        }

        // Update login time
        user.lastLogin = new Date().toISOString();
        
        // Create session
        const session = {
            user: user,
            token: this.generateToken(),
            expiresAt: Date.now() + this.sessionTimeout,
            loginTime: new Date().toISOString()
        };

        // Store session
        this.setSession(session);
        this.currentUser = user;

        // Log activity
        this.logActivity('login', user.id, user.role);

        return { success: true, user: user };
    }

    logout() {
        if (this.currentUser) {
            this.logActivity('logout', this.currentUser.id, this.currentUser.role);
        }

        // Clear session
        localStorage.removeItem('authSession');
        localStorage.removeItem('currentUser');
        this.currentUser = null;

        // Redirect to login
        window.location.href = 'auth.html';
    }

    findUser(userId, role) {
        // Direct lookup by phone number
        if (this.userDatabase[userId]) {
            const user = this.userDatabase[userId];
            if (user.role === role) {
                return { ...user };
            }
        }

        // Fallback: search by role
        for (const [key, user] of Object.entries(this.userDatabase)) {
            if (user.role === role && (key.includes(userId) || user.name.toLowerCase().includes(userId.toLowerCase()))) {
                return { ...user };
            }
        }

        return null;
    }

    generateToken() {
        return btoa(Date.now() + '_' + Math.random().toString(36).substr(2, 9));
    }

    setSession(session) {
        localStorage.setItem('authSession', JSON.stringify(session));
        localStorage.setItem('currentUser', JSON.stringify(session.user));
    }

    getSession() {
        const sessionData = localStorage.getItem('authSession');
        return sessionData ? JSON.parse(sessionData) : null;
    }

    isSessionValid(session) {
        if (!session) return false;
        return Date.now() < session.expiresAt;
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;
        return this.currentUser.permissions.includes(permission);
    }

    redirectToDashboard(role) {
        const user = this.userDatabase[Object.keys(this.userDatabase).find(key => 
            this.userDatabase[key].role === role
        )];
        
        if (user && user.dashboard) {
            window.location.href = user.dashboard;
        }
    }

    logActivity(action, userId, role) {
        const log = {
            action,
            userId,
            role,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ip: null // Would be captured server-side
        };

        // Store activity logs
        const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
        logs.push(log);
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('activityLogs', JSON.stringify(logs));
    }

    // Get current user info
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        const session = this.getSession();
        return this.isSessionValid(session);
    }

    // Refresh session
    refreshSession() {
        const session = this.getSession();
        if (session && this.isSessionValid(session)) {
            session.expiresAt = Date.now() + this.sessionTimeout;
            this.setSession(session);
            return true;
        }
        return false;
    }
}

// Global auth instance
const authSystem = new AuthSystem();

// Enhanced login function
function login() {
    const role = document.getElementById('userRole').value;
    const userId = document.getElementById('userId').value;
    
    // Show loading state
    const loginBtn = document.querySelector('#loginBtn');
    if (loginBtn) {
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Authenticating...';
        loginBtn.disabled = true;
    }
    
    // Simulate authentication
    setTimeout(() => {
        const user = demoUsers[userId];
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('authSession', JSON.stringify({
                user: user,
                loginTime: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }));
            
            // Reset button
            if (loginBtn) {
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
            
            // Redirect to dashboard
            window.location.href = user.dashboard;
        } else {
            // Reset button
            if (loginBtn) {
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
            showNotification('Invalid credentials. Please try again.', 'error');
        }
    }, 1000);
}

// Enhanced OTP verification (fixed)
function verifyOTP() {
    const userId = document.getElementById('userId').value.trim();
    const role = document.getElementById('userRole').value;
    const otpInputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    
    if (otp.length !== 6) {
        showNotification('Please enter complete 6-digit OTP', 'warning');
        return;
    }
    
    // Show loading
    const verifyBtn = document.querySelector('#verifyBtn');
    if (verifyBtn) {
        const originalText = verifyBtn.innerHTML;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verifying...';
        verifyBtn.disabled = true;
    }
    
    // Demo OTP validation (any 6-digit OTP works)
    setTimeout(() => {
        if (otp.length === 6) {
            const result = authSystem.login({ userId, password: otp, role });
            
            if (result.success) {
                showNotification(`OTP verified! Welcome, ${result.user.name}`, 'success');
                setTimeout(() => {
                    authSystem.redirectToDashboard(role);
                }, 1500);
            } else {
                showNotification('Invalid OTP or credentials', 'error');
            }
        } else {
            showNotification('Invalid OTP format', 'error');
        }
        
        // Reset button
        if (verifyBtn) {
            verifyBtn.innerHTML = originalText;
            verifyBtn.disabled = false;
        }
    }, 1000);
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = {
        info: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500'
    };
    
    const icons = {
        info: 'fa-info-circle',
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle'
    };

    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 flex items-center`;
    notification.style.transform = 'translateX(100%)';
    notification.innerHTML = `
        <i class="fas ${icons[type]} mr-3"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Form switching
function showOTP() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('otpForm').classList.remove('hidden');
    document.getElementById('userId').focus();
}

function showPassword() {
    document.getElementById('otpForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('password').focus();
}

// Auto-redirect if already logged in
window.addEventListener('load', function() {
    if (authSystem.isAuthenticated()) {
        const user = authSystem.getCurrentUser();
        authSystem.redirectToDashboard(user.role);
    }
});

// OTP input auto-focus
document.addEventListener('DOMContentLoaded', function() {
    const otpInputs = document.querySelectorAll('.otp-input');
    
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });
});

// Export for use in other files
window.authSystem = authSystem;
window.showNotification = showNotification;
