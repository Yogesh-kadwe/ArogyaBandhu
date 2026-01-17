// Admin Dashboard JavaScript
let currentAdmin = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadAdminData();
    loadUsers();
    initializeCharts();
});

function loadAdminData() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentAdmin = JSON.parse(userData);
        document.getElementById('userName').textContent = currentAdmin.name;
    }
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.remove('hidden');
}

// Users Management
function loadUsers() {
    const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    const usersList = document.getElementById('usersList');
    
    if (users.length === 0) {
        // Load demo users if no users exist
        const demoUsers = [
            {
                id: 1,
                name: 'Rani Devi',
                email: 'rani@email.com',
                phone: '9876543210',
                role: 'patient',
                location: 'Delhi',
                status: 'active',
                registeredAt: '2024-01-15'
            },
            {
                id: 2,
                name: 'Dr. Rajesh Kumar',
                email: 'rajesh@email.com',
                phone: '9876543212',
                role: 'doctor',
                location: 'Mumbai',
                status: 'active',
                registeredAt: '2024-01-10'
            },
            {
                id: 3,
                name: 'Sunita Devi',
                email: 'sunita@email.com',
                phone: '9876543213',
                role: 'asha',
                location: 'Ramgarh',
                status: 'active',
                registeredAt: '2024-01-08'
            }
        ];
        
        localStorage.setItem('systemUsers', JSON.stringify(demoUsers));
        displayUsers(demoUsers);
    } else {
        displayUsers(users);
    }
}

function displayUsers(users) {
    const usersList = document.getElementById('usersList');
    
    let html = `
        <table class="w-full table-auto">
            <thead>
                <tr class="bg-gray-100">
                    <th class="px-4 py-2 text-left">Name</th>
                    <th class="px-4 py-2 text-left">Email</th>
                    <th class="px-4 py-2 text-left">Phone</th>
                    <th class="px-4 py-2 text-left">Role</th>
                    <th class="px-4 py-2 text-left">Location</th>
                    <th class="px-4 py-2 text-left">Status</th>
                    <th class="px-4 py-2 text-left">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    users.forEach(user => {
        const statusColor = user.status === 'active' ? 'green' : 'red';
        const roleColor = user.role === 'doctor' ? 'blue' : 
                        user.role === 'asha' ? 'teal' : 
                        user.role === 'patient' ? 'green' : 'purple';
        
        html += `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-2 font-medium">${user.name}</td>
                <td class="px-4 py-2">${user.email}</td>
                <td class="px-4 py-2">${user.phone}</td>
                <td class="px-4 py-2">
                    <span class="px-2 py-1 bg-${roleColor}-100 text-${roleColor}-700 text-xs rounded-full">
                        ${user.role}
                    </span>
                </td>
                <td class="px-4 py-2">${user.location}</td>
                <td class="px-4 py-2">
                    <span class="px-2 py-1 bg-${statusColor}-100 text-${statusColor}-700 text-xs rounded-full">
                        ${user.status}
                    </span>
                </td>
                <td class="px-4 py-2">
                    <div class="flex gap-2">
                        <button onclick="viewUser(${user.id})" class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editUser(${user.id})" class="text-green-500 hover:text-green-700">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="toggleUserStatus(${user.id})" class="text-${user.status === 'active' ? 'red' : 'green'}-500 hover:text-${user.status === 'active' ? 'red' : 'green'}-700">
                            <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    usersList.innerHTML = html;
}

function showTab(tabName) {
    // Update tab styling
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('bg-gray-200', 'text-gray-700');
        tab.classList.add('hover:bg-gray-200');
    });
    
    // Get the clicked tab
    const clickedTab = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (clickedTab) {
        clickedTab.classList.remove('hover:bg-gray-200');
        clickedTab.classList.add('bg-gray-200', 'text-gray-700');
    }
    
    // Filter users
    const role = tabName === 'all' ? 'all' : tabName.replace('Tab', '');
    const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    const filteredUsers = role === 'all' ? users : users.filter(user => user.role === role);
    displayUsers(filteredUsers);
}

function addUser() {
    document.getElementById('userModal').classList.remove('hidden');
}

function saveNewUser() {
    const user = {
        id: Date.now(),
        name: document.getElementById('newUserName').value,
        email: document.getElementById('newUserEmail').value,
        phone: document.getElementById('newUserPhone').value,
        role: document.getElementById('newUserRole').value,
        location: document.getElementById('newUserLocation').value,
        status: 'active',
        registeredAt: new Date().toISOString().split('T')[0]
    };
    
    if (!user.name || !user.email || !user.phone || !user.role) {
        alert('Please fill in all required fields');
        return;
    }
    
    let users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    users.push(user);
    localStorage.setItem('systemUsers', JSON.stringify(users));
    
    closeUserModal();
    loadUsers();
    showNotification('User added successfully!');
}

function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
    
    // Clear form
    document.getElementById('newUserName').value = '';
    document.getElementById('newUserEmail').value = '';
    document.getElementById('newUserPhone').value = '';
    document.getElementById('newUserRole').value = '';
    document.getElementById('newUserLocation').value = '';
}

function viewUser(id) {
    const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    const user = users.find(u => u.id === id);
    if (user) {
        alert(`User Details:\n\nName: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone}\nRole: ${user.role}\nLocation: ${user.location}\nStatus: ${user.status}\nRegistered: ${user.registeredAt}`);
    }
}

function editUser(id) {
    showNotification(`Edit user functionality for ID: ${id}`);
}

function toggleUserStatus(id) {
    let users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    const user = users.find(u => u.id === id);
    if (user) {
        user.status = user.status === 'active' ? 'inactive' : 'active';
        localStorage.setItem('systemUsers', JSON.stringify(users));
        loadUsers();
        showNotification(`User ${user.status === 'active' ? 'activated' : 'deactivated'} successfully!`);
    }
}

// Reports Generation
function generateReport(type) {
    const reports = {
        users: 'Generating comprehensive user report with demographics and activity data...',
        health: 'Generating health metrics report including appointments, vaccinations, and emergency responses...',
        appointments: 'Generating appointment analysis report with trends and statistics...',
        emergency: 'Generating emergency response report with response times and outcomes...'
    };
    
    showNotification(reports[type]);
    
    // In a real application, this would generate and download a PDF/Excel report
    setTimeout(() => {
        const reportData = {
            type: type,
            generatedAt: new Date().toISOString(),
            data: 'Sample report data would be here'
        };
        
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded successfully!`);
    }, 2000);
}

// Settings Management
function saveSettings() {
    const settings = {
        systemName: document.querySelector('input[value="ArogyaBandhu"]').value,
        contactEmail: document.querySelector('input[type="email"]').value,
        emergencyNumber: document.querySelector('input[type="tel"]').value,
        emailNotifications: document.querySelectorAll('input[type="checkbox"]')[0].checked,
        smsAlerts: document.querySelectorAll('input[type="checkbox"]')[1].checked,
        emergencyAlerts: document.querySelectorAll('input[type="checkbox"]')[2].checked,
        weeklyReports: document.querySelectorAll('input[type="checkbox"]')[3].checked,
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    showNotification('Settings saved successfully!');
}

// Analytics Charts
function initializeCharts() {
    // User Growth Chart
    const userGrowthCtx = document.getElementById('userGrowthChart');
    if (userGrowthCtx) {
        new Chart(userGrowthCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'New Users',
                    data: [65, 89, 120, 156, 189, 247],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // Usage Chart
    const usageCtx = document.getElementById('usageChart');
    if (usageCtx) {
        new Chart(usageCtx, {
            type: 'doughnut',
            data: {
                labels: ['Appointments', 'Vaccinations', 'Emergency', 'Blood Donation'],
                datasets: [{
                    data: [35, 25, 20, 20],
                    backgroundColor: [
                        'rgb(59, 130, 246)',
                        'rgb(34, 197, 94)',
                        'rgb(239, 68, 68)',
                        'rgb(251, 146, 60)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// Utility Functions
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
