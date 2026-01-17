// Patient Dashboard JavaScript
let currentPatient = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadPatientData();
    loadHealthRecords();
    loadAppointments();
    loadMedicines();
});

function loadPatientData() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentPatient = JSON.parse(userData);
        document.getElementById('userName').textContent = currentPatient.name;
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

// Health Records Management
function loadHealthRecords() {
    const records = JSON.parse(localStorage.getItem('patientHealthRecords') || '[]');
    const recordsList = document.getElementById('recordsList');
    
    if (records.length === 0) {
        recordsList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-folder-open text-4xl mb-3"></i>
                <p>No health records found. Add your first record.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    records.forEach(record => {
        html += `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold">${record.type}</h4>
                        <p class="text-sm text-gray-600">${record.date}</p>
                        <p class="text-sm mt-1">${record.description}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="viewRecord(${record.id})" class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="deleteRecord(${record.id})" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    recordsList.innerHTML = html;
}

function addHealthRecord() {
    document.getElementById('addRecordModal').classList.remove('hidden');
}

function saveHealthRecord() {
    const record = {
        id: Date.now(),
        type: document.getElementById('recordType').value,
        date: document.getElementById('recordDate').value,
        description: document.getElementById('recordDescription').value,
        patientId: currentPatient.id,
        createdAt: new Date().toISOString()
    };
    
    if (!record.type || !record.date || !record.description) {
        alert('Please fill in all fields');
        return;
    }
    
    let records = JSON.parse(localStorage.getItem('patientHealthRecords') || '[]');
    records.push(record);
    localStorage.setItem('patientHealthRecords', JSON.stringify(records));
    
    // Clear form
    document.getElementById('recordType').value = '';
    document.getElementById('recordDate').value = '';
    document.getElementById('recordDescription').value = '';
    
    closeModal();
    loadHealthRecords();
    
    showNotification('Health record added successfully!');
}

function deleteRecord(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        let records = JSON.parse(localStorage.getItem('patientHealthRecords') || '[]');
        records = records.filter(record => record.id !== id);
        localStorage.setItem('patientHealthRecords', JSON.stringify(records));
        loadHealthRecords();
        showNotification('Record deleted successfully!');
    }
}

function viewRecord(id) {
    let records = JSON.parse(localStorage.getItem('patientHealthRecords') || '[]');
    const record = records.find(r => r.id === id);
    if (record) {
        alert(`Record Details:\n\nType: ${record.type}\nDate: ${record.date}\nDescription: ${record.description}`);
    }
}

// Appointments Management
function loadAppointments() {
    const appointments = JSON.parse(localStorage.getItem('patientAppointments') || '[]');
    const appointmentsList = document.getElementById('appointmentsList');
    
    if (appointments.length === 0) {
        appointmentsList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-calendar-check text-4xl mb-3"></i>
                <p>No appointments scheduled. Book your first appointment.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    appointments.forEach(appointment => {
        const statusColor = appointment.status === 'confirmed' ? 'green' : 
                          appointment.status === 'pending' ? 'yellow' : 'red';
        
        html += `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold">${appointment.doctor}</h4>
                        <p class="text-sm text-gray-600">${appointment.date} at ${appointment.time}</p>
                        <p class="text-sm">${appointment.hospital}</p>
                        <span class="inline-block px-2 py-1 bg-${statusColor}-100 text-${statusColor}-700 text-xs rounded-full mt-2">
                            ${appointment.status}
                        </span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="rescheduleAppointment(${appointment.id})" class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-calendar-alt"></i>
                        </button>
                        <button onclick="cancelAppointment(${appointment.id})" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    appointmentsList.innerHTML = html;
}

function bookAppointment() {
    // In a real app, this would open a booking form
    const appointment = {
        id: Date.now(),
        doctor: 'Dr. Rajesh Kumar',
        hospital: 'District Hospital',
        date: new Date(Date.now() + 86400000).toLocaleDateString(),
        time: '10:00 AM',
        status: 'pending',
        patientId: currentPatient.id,
        createdAt: new Date().toISOString()
    };
    
    let appointments = JSON.parse(localStorage.getItem('patientAppointments') || '[]');
    appointments.push(appointment);
    localStorage.setItem('patientAppointments', JSON.stringify(appointments));
    
    loadAppointments();
    showNotification('Appointment booked successfully!');
}

function cancelAppointment(id) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        let appointments = JSON.parse(localStorage.getItem('patientAppointments') || '[]');
        appointments = appointments.filter(apt => apt.id !== id);
        localStorage.setItem('patientAppointments', JSON.stringify(appointments));
        loadAppointments();
        showNotification('Appointment cancelled!');
    }
}

function rescheduleAppointment(id) {
    alert('Reschedule functionality would be implemented here');
}

// Medicines Management
function loadMedicines() {
    const medicines = JSON.parse(localStorage.getItem('patientMedicines') || '[]');
    const medicinesList = document.getElementById('medicinesList');
    
    if (medicines.length === 0) {
        medicinesList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-pills text-4xl mb-3"></i>
                <p>No medicines recorded. Search and add medicines.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    medicines.forEach(medicine => {
        html += `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold">${medicine.name}</h4>
                        <p class="text-sm text-gray-600">Dosage: ${medicine.dosage}</p>
                        <p class="text-sm">Duration: ${medicine.duration}</p>
                        <p class="text-sm">Next dose: ${medicine.nextDose}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="markMedicineTaken(${medicine.id})" class="text-green-500 hover:text-green-700">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="deleteMedicine(${medicine.id})" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    medicinesList.innerHTML = html;
}

function searchMedicine() {
    const medicineName = document.getElementById('medicineSearch').value;
    if (!medicineName) {
        alert('Please enter a medicine name');
        return;
    }
    
    // Mock medicine data
    const medicine = {
        id: Date.now(),
        name: medicineName,
        dosage: '1 tablet twice daily',
        duration: '7 days',
        nextDose: new Date(Date.now() + 3600000).toLocaleTimeString(),
        patientId: currentPatient.id,
        createdAt: new Date().toISOString()
    };
    
    let medicines = JSON.parse(localStorage.getItem('patientMedicines') || '[]');
    medicines.push(medicine);
    localStorage.setItem('patientMedicines', JSON.stringify(medicines));
    
    document.getElementById('medicineSearch').value = '';
    loadMedicines();
    showNotification('Medicine added successfully!');
}

function markMedicineTaken(id) {
    showNotification('Medicine marked as taken!');
}

function deleteMedicine(id) {
    if (confirm('Are you sure you want to remove this medicine?')) {
        let medicines = JSON.parse(localStorage.getItem('patientMedicines') || '[]');
        medicines = medicines.filter(med => med.id !== id);
        localStorage.setItem('patientMedicines', JSON.stringify(medicines));
        loadMedicines();
        showNotification('Medicine removed!');
    }
}

// Emergency Functions
function shareLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const location = `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`;
                
                // Share functionality
                if (navigator.share) {
                    navigator.share({
                        title: 'Emergency Location',
                        text: `My emergency location: ${location}`,
                        url: location
                    });
                } else {
                    // Fallback: copy to clipboard
                    navigator.clipboard.writeText(location);
                    showNotification('Location copied to clipboard!');
                }
            },
            error => {
                showNotification('Unable to get location. Please enable GPS.');
            }
        );
    } else {
        showNotification('Geolocation is not supported by your device.');
    }
}

function contactEmergency() {
    if (confirm('Call emergency services (108)?')) {
        window.location.href = 'tel:108';
    }
}

// Utility Functions
function closeModal() {
    document.getElementById('addRecordModal').classList.add('hidden');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
