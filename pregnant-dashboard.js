// Pregnant Woman Dashboard JavaScript
let currentPregnantUser = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadPregnantUserData();
    loadMaternalRecords();
    loadCheckups();
    calculatePregnancyDetails();
});

function loadPregnantUserData() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentPregnantUser = JSON.parse(userData);
        document.getElementById('userName').textContent = currentPregnantUser.name;
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

// Calculate pregnancy details
function calculatePregnancyDetails() {
    if (currentPregnantUser && currentPregnantUser.lmp) {
        const lmp = new Date(currentPregnantUser.lmp);
        const today = new Date();
        const gestationalAge = Math.floor((today - lmp) / (7 * 24 * 60 * 60 * 1000));
        
        // Calculate due date (40 weeks from LMP)
        const dueDate = new Date(lmp.getTime() + (40 * 7 * 24 * 60 * 60 * 1000));
        
        document.getElementById('gestationalAge').textContent = `${gestationalAge} weeks`;
        document.getElementById('dueDate').textContent = dueDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// AI Risk Assessment
function assessRisk() {
    const age = parseInt(document.getElementById('maternalAge').value);
    const bloodPressure = document.getElementById('bloodPressure').value;
    const weight = parseFloat(document.getElementById('maternalWeight').value);
    const height = parseFloat(document.getElementById('maternalHeight').value);
    
    const diabetes = document.getElementById('diabetes').checked;
    const hypertension = document.getElementById('hypertension').checked;
    const previousComplications = document.getElementById('previousComplications').checked;
    
    let riskScore = 0;
    let riskFactors = [];
    
    // Age risk assessment
    if (age < 18 || age > 35) {
        riskScore += 2;
        riskFactors.push('Age-related risk');
    }
    
    // BMI calculation
    if (weight && height) {
        const bmi = weight / ((height / 100) ** 2);
        if (bmi < 18.5 || bmi > 30) {
            riskScore += 2;
            riskFactors.push('BMI-related risk');
        }
    }
    
    // Blood pressure assessment
    if (bloodPressure) {
        const [systolic, diastolic] = bloodPressure.split('/').map(Number);
        if (systolic > 140 || diastolic > 90) {
            riskScore += 3;
            riskFactors.push('High blood pressure');
        }
    }
    
    // Medical history
    if (diabetes) {
        riskScore += 2;
        riskFactors.push('Diabetes history');
    }
    
    if (hypertension) {
        riskScore += 2;
        riskFactors.push('Hypertension history');
    }
    
    if (previousComplications) {
        riskScore += 3;
        riskFactors.push('Previous complications');
    }
    
    // Determine risk level
    let riskLevel, riskColor, recommendations;
    
    if (riskScore <= 2) {
        riskLevel = 'Low Risk';
        riskColor = 'green';
        recommendations = [
            'Continue regular prenatal checkups',
            'Maintain healthy diet and exercise',
            'Take prenatal vitamins regularly',
            'Monitor fetal movements daily'
        ];
    } else if (riskScore <= 5) {
        riskLevel = 'Moderate Risk';
        riskColor = 'yellow';
        recommendations = [
            'Increase frequency of prenatal visits',
            'Strict blood pressure monitoring',
            'Consult specialist if needed',
            'Consider additional screenings'
        ];
    } else {
        riskLevel = 'High Risk';
        riskColor = 'red';
        recommendations = [
            'Immediate consultation with specialist',
            'Weekly monitoring required',
            'Possible hospitalization for observation',
            'Prepare for early delivery if necessary'
        ];
    }
    
    // Display results
    const riskResult = document.getElementById('riskResult');
    riskResult.innerHTML = `
        <div class="border rounded-lg p-4 bg-${riskColor}-50">
            <h4 class="font-semibold text-lg mb-3 text-${riskColor}-700">
                Risk Assessment Result: ${riskLevel}
            </h4>
            <div class="mb-3">
                <p class="font-medium mb-2">Risk Factors Identified:</p>
                <ul class="list-disc list-inside space-y-1 text-sm">
                    ${riskFactors.length > 0 ? riskFactors.map(factor => `<li>${factor}</li>`).join('') : '<li>No significant risk factors</li>'}
                </ul>
            </div>
            <div>
                <p class="font-medium mb-2">Recommendations:</p>
                <ul class="list-disc list-inside space-y-1 text-sm">
                    ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            <div class="mt-4 p-3 bg-yellow-100 rounded-lg">
                <p class="text-sm"><strong>Important:</strong> This is not a medical diagnosis. Please consult with your healthcare provider for proper evaluation.</p>
            </div>
        </div>
    `;
    
    riskResult.classList.remove('hidden');
    
    // Save assessment
    saveRiskAssessment({
        riskLevel,
        riskScore,
        riskFactors,
        recommendations,
        date: new Date().toISOString()
    });
}

function saveRiskAssessment(assessment) {
    let assessments = JSON.parse(localStorage.getItem('riskAssessments') || '[]');
    assessments.push({
        ...assessment,
        userId: currentPregnantUser.id
    });
    localStorage.setItem('riskAssessments', JSON.stringify(assessments));
}

// Maternal Records Management
function loadMaternalRecords() {
    const records = JSON.parse(localStorage.getItem('maternalRecords') || '[]');
    const recordsList = document.getElementById('maternalRecordsList');
    
    if (records.length === 0) {
        recordsList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-folder-open text-4xl mb-3"></i>
                <p>No maternal records found. Add your first record.</p>
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
                        <button onclick="viewMaternalRecord(${record.id})" class="text-purple-500 hover:text-purple-700">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="deleteMaternalRecord(${record.id})" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    recordsList.innerHTML = html;
}

function addMaternalRecord() {
    document.getElementById('addMaternalRecordModal').classList.remove('hidden');
}

function saveMaternalRecord() {
    const record = {
        id: Date.now(),
        type: document.getElementById('recordType').value,
        date: document.getElementById('recordDate').value,
        description: document.getElementById('recordDescription').value,
        userId: currentPregnantUser.id,
        createdAt: new Date().toISOString()
    };
    
    if (!record.type || !record.date || !record.description) {
        alert('Please fill in all fields');
        return;
    }
    
    let records = JSON.parse(localStorage.getItem('maternalRecords') || '[]');
    records.push(record);
    localStorage.setItem('maternalRecords', JSON.stringify(records));
    
    // Clear form
    document.getElementById('recordType').value = '';
    document.getElementById('recordDate').value = '';
    document.getElementById('recordDescription').value = '';
    
    closeMaternalModal();
    loadMaternalRecords();
    
    showNotification('Maternal record added successfully!');
}

function deleteMaternalRecord(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        let records = JSON.parse(localStorage.getItem('maternalRecords') || '[]');
        records = records.filter(record => record.id !== id);
        localStorage.setItem('maternalRecords', JSON.stringify(records));
        loadMaternalRecords();
        showNotification('Record deleted successfully!');
    }
}

function viewMaternalRecord(id) {
    let records = JSON.parse(localStorage.getItem('maternalRecords') || '[]');
    const record = records.find(r => r.id === id);
    if (record) {
        alert(`Maternal Record Details:\n\nType: ${record.type}\nDate: ${record.date}\nDescription: ${record.description}`);
    }
}

// Checkups Management
function loadCheckups() {
    const checkups = JSON.parse(localStorage.getItem('prenatalCheckups') || '[]');
    const checkupsList = document.getElementById('checkupsList');
    
    if (checkups.length === 0) {
        checkupsList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-calendar-check text-4xl mb-3"></i>
                <p>No prenatal checkups scheduled.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    checkups.forEach(checkup => {
        const statusColor = checkup.status === 'completed' ? 'green' : 
                          checkup.status === 'upcoming' ? 'blue' : 'yellow';
        
        html += `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold">${checkup.type}</h4>
                        <p class="text-sm text-gray-600">${checkup.date} at ${checkup.time}</p>
                        <p class="text-sm">${checkup.doctor} - ${checkup.hospital}</p>
                        <span class="inline-block px-2 py-1 bg-${statusColor}-100 text-${statusColor}-700 text-xs rounded-full mt-2">
                            ${checkup.status}
                        </span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="rescheduleCheckup(${checkup.id})" class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-calendar-alt"></i>
                        </button>
                        <button onclick="cancelCheckup(${checkup.id})" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    checkupsList.innerHTML = html;
}

function scheduleCheckup() {
    const checkup = {
        id: Date.now(),
        type: 'Regular Prenatal Checkup',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        time: '10:00 AM',
        doctor: 'Dr. Anita Sharma',
        hospital: 'Maternal Health Center',
        status: 'upcoming',
        userId: currentPregnantUser.id,
        createdAt: new Date().toISOString()
    };
    
    let checkups = JSON.parse(localStorage.getItem('prenatalCheckups') || '[]');
    checkups.push(checkup);
    localStorage.setItem('prenatalCheckups', JSON.stringify(checkups));
    
    loadCheckups();
    showNotification('Prenatal checkup scheduled successfully!');
}

function cancelCheckup(id) {
    if (confirm('Are you sure you want to cancel this checkup?')) {
        let checkups = JSON.parse(localStorage.getItem('prenatalCheckups') || '[]');
        checkups = checkups.filter(checkup => checkup.id !== id);
        localStorage.setItem('prenatalCheckups', JSON.stringify(checkups));
        loadCheckups();
        showNotification('Checkup cancelled!');
    }
}

function rescheduleCheckup(id) {
    alert('Reschedule functionality would be implemented here');
}

// Emergency Functions
function emergencySOS() {
    if (confirm('Call pregnancy emergency services (102)?')) {
        window.location.href = 'tel:102';
    }
}

// Utility Functions
function closeMaternalModal() {
    document.getElementById('addMaternalRecordModal').classList.add('hidden');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-pink-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
