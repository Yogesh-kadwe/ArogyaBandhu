// Doctor Dashboard JavaScript
let currentDoctor = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDoctorData();
    loadAppointments();
    loadPatients();
    loadPrescriptions();
    initializeCharts();
});

function loadDoctorData() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentDoctor = JSON.parse(userData);
        document.getElementById('userName').textContent = currentDoctor.name;
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

// Appointments Management
function loadAppointments() {
    const appointments = JSON.parse(localStorage.getItem('doctorAppointments') || '[]');
    const today = new Date().toDateString();
    const todayAppointments = appointments.filter(apt => 
        new Date(apt.date).toDateString() === today
    );
    
    const appointmentsList = document.getElementById('appointmentsList');
    
    if (todayAppointments.length === 0) {
        appointmentsList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-calendar-check text-4xl mb-3"></i>
                <p>No appointments scheduled for today.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    todayAppointments.forEach(appointment => {
        const timeColor = appointment.status === 'completed' ? 'green' : 
                         appointment.status === 'in-progress' ? 'blue' : 'yellow';
        
        html += `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold">${appointment.patientName}</h4>
                        <p class="text-sm text-gray-600">${appointment.time} - ${appointment.type}</p>
                        <p class="text-sm">${appointment.notes}</p>
                        <span class="inline-block px-2 py-1 bg-${timeColor}-100 text-${timeColor}-700 text-xs rounded-full mt-2">
                            ${appointment.status}
                        </span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="startConsultation(${appointment.id})" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition">
                            <i class="fas fa-video"></i>
                        </button>
                        <button onclick="viewPatientRecord(${appointment.patientId})" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition">
                            <i class="fas fa-folder-open"></i>
                        </button>
                        <button onclick="completeAppointment(${appointment.id})" class="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    appointmentsList.innerHTML = html;
}

function addAppointment() {
    document.getElementById('appointmentModal').classList.remove('hidden');
}

function saveAppointment() {
    const appointment = {
        id: Date.now(),
        patientName: document.getElementById('patientName').value,
        patientPhone: document.getElementById('patientPhone').value,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value,
        type: document.getElementById('appointmentType').value,
        notes: document.getElementById('appointmentNotes').value,
        doctorId: currentDoctor.id,
        status: 'scheduled',
        createdAt: new Date().toISOString()
    };
    
    if (!appointment.patientName || !appointment.date || !appointment.time) {
        alert('Please fill in all required fields');
        return;
    }
    
    let appointments = JSON.parse(localStorage.getItem('doctorAppointments') || '[]');
    appointments.push(appointment);
    localStorage.setItem('doctorAppointments', JSON.stringify(appointments));
    
    closeAppointmentModal();
    loadAppointments();
    showNotification('Appointment scheduled successfully!');
}

function closeAppointmentModal() {
    document.getElementById('appointmentModal').classList.add('hidden');
    
    // Clear form
    document.getElementById('patientName').value = '';
    document.getElementById('patientPhone').value = '';
    document.getElementById('appointmentDate').value = '';
    document.getElementById('appointmentTime').value = '';
    document.getElementById('appointmentType').value = '';
    document.getElementById('appointmentNotes').value = '';
}

function completeAppointment(id) {
    let appointments = JSON.parse(localStorage.getItem('doctorAppointments') || '[]');
    const appointment = appointments.find(apt => apt.id === id);
    if (appointment) {
        appointment.status = 'completed';
        localStorage.setItem('doctorAppointments', JSON.stringify(appointments));
        loadAppointments();
        showNotification('Appointment marked as completed!');
    }
}

function startConsultation(id) {
    showNotification('Video consultation feature would be implemented here');
}

// Patients Management
function loadPatients() {
    const patients = JSON.parse(localStorage.getItem('doctorPatients') || '[]');
    const patientsList = document.getElementById('patientsList');
    
    if (patients.length === 0) {
        patientsList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-users text-4xl mb-3"></i>
                <p>No patients found.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="w-full table-auto">
            <thead>
                <tr class="bg-gray-100">
                    <th class="px-4 py-2 text-left">Name</th>
                    <th class="px-4 py-2 text-left">Phone</th>
                    <th class="px-4 py-2 text-left">Age</th>
                    <th class="px-4 py-2 text-left">Blood Group</th>
                    <th class="px-4 py-2 text-left">Last Visit</th>
                    <th class="px-4 py-2 text-left">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    patients.forEach(patient => {
        html += `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-2 font-medium">${patient.name}</td>
                <td class="px-4 py-2">${patient.phone}</td>
                <td class="px-4 py-2">${patient.age}</td>
                <td class="px-4 py-2">${patient.bloodGroup || 'N/A'}</td>
                <td class="px-4 py-2">${patient.lastVisit || 'Never'}</td>
                <td class="px-4 py-2">
                    <div class="flex gap-2">
                        <button onclick="viewPatientDetails(${patient.id})" class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editPatient(${patient.id})" class="text-green-500 hover:text-green-700">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="createPrescriptionForPatient(${patient.id})" class="text-purple-500 hover:text-purple-700">
                            <i class="fas fa-prescription"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    patientsList.innerHTML = html;
}

function searchPatients() {
    const searchTerm = document.getElementById('patientSearch').value.toLowerCase();
    const patients = JSON.parse(localStorage.getItem('doctorPatients') || '[]');
    
    const filteredPatients = patients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm) ||
        patient.phone.includes(searchTerm)
    );
    
    // Update display with filtered results
    displayFilteredPatients(filteredPatients);
}

function displayFilteredPatients(patients) {
    const patientsList = document.getElementById('patientsList');
    
    if (patients.length === 0) {
        patientsList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-search text-4xl mb-3"></i>
                <p>No patients found matching your search.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="w-full table-auto">
            <thead>
                <tr class="bg-gray-100">
                    <th class="px-4 py-2 text-left">Name</th>
                    <th class="px-4 py-2 text-left">Phone</th>
                    <th class="px-4 py-2 text-left">Age</th>
                    <th class="px-4 py-2 text-left">Blood Group</th>
                    <th class="px-4 py-2 text-left">Last Visit</th>
                    <th class="px-4 py-2 text-left">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    patients.forEach(patient => {
        html += `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-2 font-medium">${patient.name}</td>
                <td class="px-4 py-2">${patient.phone}</td>
                <td class="px-4 py-2">${patient.age}</td>
                <td class="px-4 py-2">${patient.bloodGroup || 'N/A'}</td>
                <td class="px-4 py-2">${patient.lastVisit || 'Never'}</td>
                <td class="px-4 py-2">
                    <div class="flex gap-2">
                        <button onclick="viewPatientDetails(${patient.id})" class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editPatient(${patient.id})" class="text-green-500 hover:text-green-700">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="createPrescriptionForPatient(${patient.id})" class="text-purple-500 hover:text-purple-700">
                            <i class="fas fa-prescription"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    patientsList.innerHTML = html;
}

function addPatient() {
    showNotification('Add patient functionality would be implemented here');
}

function viewPatientDetails(id) {
    showNotification(`Viewing patient details for ID: ${id}`);
}

function editPatient(id) {
    showNotification(`Edit patient functionality for ID: ${id}`);
}

// Prescriptions Management
function loadPrescriptions() {
    const prescriptions = JSON.parse(localStorage.getItem('doctorPrescriptions') || '[]');
    const prescriptionsList = document.getElementById('prescriptionsList');
    
    if (prescriptions.length === 0) {
        prescriptionsList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-prescription text-4xl mb-3"></i>
                <p>No prescriptions found.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    prescriptions.forEach(prescription => {
        html += `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold">${prescription.patientName}</h4>
                        <p class="text-sm text-gray-600">${prescription.date}</p>
                        <p class="text-sm mt-1">${prescription.diagnosis}</p>
                        <div class="mt-2">
                            <p class="font-medium text-sm">Medicines:</p>
                            <ul class="text-sm text-gray-600">
                                ${prescription.medicines.map(med => `<li>• ${med}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="viewPrescription(${prescription.id})" class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="printPrescription(${prescription.id})" class="text-green-500 hover:text-green-700">
                            <i class="fas fa-print"></i>
                        </button>
                        <button onclick="editPrescription(${prescription.id})" class="text-purple-500 hover:text-purple-700">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    prescriptionsList.innerHTML = html;
}

function createPrescription() {
    showNotification('Create prescription functionality would be implemented here');
}

function createPrescriptionForPatient(patientId) {
    showNotification(`Creating prescription for patient ID: ${patientId}`);
}

function viewPrescription(id) {
    showNotification(`Viewing prescription ID: ${id}`);
}

function printPrescription(id) {
    showNotification(`Printing prescription ID: ${id}`);
}

function editPrescription(id) {
    showNotification(`Editing prescription ID: ${id}`);
}

// Analytics Charts
function initializeCharts() {
    // Visits Chart
    const visitsCtx = document.getElementById('visitsChart');
    if (visitsCtx) {
        new Chart(visitsCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Patient Visits',
                    data: [12, 19, 15, 25, 22, 30, 18],
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
    
    // Conditions Chart
    const conditionsCtx = document.getElementById('conditionsChart');
    if (conditionsCtx) {
        new Chart(conditionsCtx, {
            type: 'doughnut',
            data: {
                labels: ['Fever', 'Cold/Cough', 'Diabetes', 'Hypertension', 'Other'],
                datasets: [{
                    data: [30, 25, 15, 20, 10],
                    backgroundColor: [
                        'rgb(239, 68, 68)',
                        'rgb(59, 130, 246)',
                        'rgb(34, 197, 94)',
                        'rgb(251, 146, 60)',
                        'rgb(163, 163, 163)'
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
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
