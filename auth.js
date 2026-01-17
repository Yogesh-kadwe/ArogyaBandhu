// Authentication System for ArogyaBandhu
let currentUser = null;

// Demo user database (in production, this would be server-side)
const demoUsers = {
    patient: {
        id: 'patient001',
        name: 'Rani Devi',
        mobile: '9876543210',
        role: 'patient',
        dashboard: 'patient'
    },
    pregnant: {
        id: 'pregnant001',
        name: 'Geeta Sharma',
        mobile: '9876543211',
        role: 'pregnant',
        dashboard: 'pregnant',
        lmp: '2024-01-15', // Last Menstrual Period
        gestationalAge: 16 // weeks
    },
    doctor: {
        id: 'doctor001',
        name: 'Dr. Rajesh Kumar',
        mobile: '9876543212',
        role: 'doctor',
        dashboard: 'doctor',
        specialization: 'General Medicine'
    },
    asha: {
        id: 'asha001',
        name: 'Sunita Devi',
        mobile: '9876543213',
        role: 'asha',
        dashboard: 'asha',
        village: 'Ramgarh',
        assignedPatients: 45
    },
    admin: {
        id: 'admin001',
        name: 'Admin User',
        mobile: '9876543214',
        role: 'admin',
        dashboard: 'admin'
    }
};

function authenticate() {
    const role = document.getElementById('userRole').value;
    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;

    if (!role || !userId || !password) {
        showError('Please fill in all fields');
        return;
    }

    // Demo authentication (accepts any credentials for demo)
    if (demoUsers[role]) {
        currentUser = {
            ...demoUsers[role],
            loginTime: new Date().toISOString(),
            sessionId: generateSessionId()
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Redirect to appropriate dashboard
        window.location.href = `${role}-dashboard.html`;
    } else {
        showError('Invalid role selected');
    }
}

function showOTP() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('otpForm').classList.remove('hidden');
    
    // Auto-focus first OTP input
    document.querySelector('.otp-input').focus();
}

function showPassword() {
    document.getElementById('otpForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

function verifyOTP() {
    const otpInputs = document.querySelectorAll('.otp-input');
    let otp = '';
    
    otpInputs.forEach(input => {
        otp += input.value;
    });
    
    if (otp.length === 6) {
        // Demo: accept any 6-digit OTP
        const role = document.getElementById('userRole').value;
        if (demoUsers[role]) {
            currentUser = {
                ...demoUsers[role],
                loginTime: new Date().toISOString(),
                sessionId: generateSessionId()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('isLoggedIn', 'true');
            
            window.location.href = `${role}-dashboard.html`;
        }
    } else {
        showError('Please enter complete 6-digit OTP');
    }
}

function generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9);
}

function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${message}`;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    successDiv.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// OTP input auto-focus
document.addEventListener('DOMContentLoaded', function() {
    const otpInputs = document.querySelectorAll('.otp-input');
    
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            if (e.target.value.length === 1) {
                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });
});

// Check if user is already logged in
function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = localStorage.getItem('currentUser');
    
    if (isLoggedIn === 'true' && user) {
        currentUser = JSON.parse(user);
        // Redirect to appropriate dashboard
        const role = currentUser.role;
        if (window.location.pathname.includes('auth.html')) {
            window.location.href = `${role}-dashboard.html`;
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'auth.html';
}

// Check auth status on page load
checkAuthStatus();
