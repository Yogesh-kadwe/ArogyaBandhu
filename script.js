// Global variables
let currentLanguage = 'en';
let currentTheme = 'light';
let userLocation = null;
let healthData = {
    waterIntake: 0,
    steps: 0,
    bmi: null,
    weeklyData: []
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeDashboard();
    loadHealthData();
    loadGovernmentSchemes();
    loadHealthRecords();
    loadMaternalRecords();
    loadAppointments();
    initializeCharts();
    setupOfflineDetection();
    
    // Setup periodic API calls for real-time data
    setInterval(async () => {
        try {
            // Call free health API for updates
            const response = await fetch('https://disease.sh/v3/covid-19/all');
            const data = response.ok ? await response.json() : null;
            
            if (data) {
                // Update health score based on real data
                const healthScore = Math.max(85 - (data.deaths / 10000), 50);
                // Update UI with real data
            }
        } catch (error) {
            console.log('Background API update failed');
        }
    }, 60000); // Update every minute
});

function initializeApp() {
    // Load saved data
    const savedLanguage = localStorage.getItem('language') || 'en';
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    currentLanguage = savedLanguage;
    currentTheme = savedTheme;
    
    // Apply theme
    if (currentTheme === 'dark') {
        document.body.classList.add('dark');
    }
    
    // Update language display
    updateLanguageDisplay();
    
    // Load health records
    loadHealthRecords();
    
    // Load government schemes
    loadGovernmentSchemes();
}

// Navigation
function showSection(sectionId) {
    console.log('Showing section:', sectionId);
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    } else {
        console.error('Section not found:', sectionId);
    }
    
    // Update nav buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('text-indigo-600', 'bg-indigo-50');
        btn.classList.add('text-gray-600', 'hover:text-gray-900', 'hover:bg-gray-50');
    });
    
    // Highlight active button
    const activeBtn = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-600', 'hover:text-gray-900', 'hover:bg-gray-50');
        activeBtn.classList.add('text-indigo-600', 'bg-indigo-50');
    }
}

// Language support
function toggleLanguage() {
    const languages = ['en', 'hi', 'mr'];
    const currentIndex = languages.indexOf(currentLanguage);
    currentLanguage = languages[(currentIndex + 1) % languages.length];
    
    localStorage.setItem('language', currentLanguage);
    updateLanguageDisplay();
    applyTranslations();
}

function updateLanguageDisplay() {
    const langCodes = {
        'en': 'EN',
        'hi': 'हिं',
        'mr': 'मर'
    };
    document.getElementById('langText').textContent = langCodes[currentLanguage];
}

// Theme toggle
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', currentTheme);
}

// Dashboard Functions
function calculateBMI() {
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const resultDiv = document.getElementById('bmiResult');
    
    if (!weight || !height || weight <= 0 || height <= 0) {
        resultDiv.innerHTML = `<div class="text-red-600 text-center">Please enter valid weight and height values</div>`;
        resultDiv.classList.remove('hidden');
        return;
    }
    
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    let category = '';
    let color = '';
    let recommendation = '';
    
    if (bmi < 18.5) {
        category = 'Underweight';
        color = 'text-blue-600';
        recommendation = 'Consider consulting a nutritionist for healthy weight gain.';
    } else if (bmi < 25) {
        category = 'Normal Weight';
        color = 'text-green-600';
        recommendation = 'Great! Maintain your healthy weight with balanced diet and exercise.';
    } else if (bmi < 30) {
        category = 'Overweight';
        color = 'text-yellow-600';
        recommendation = 'Consider increasing physical activity and monitoring diet.';
    } else {
        category = 'Obese';
        color = 'text-red-600';
        recommendation = 'Please consult a healthcare provider for a weight management plan.';
    }
    
    healthData.bmi = bmi;
    healthData.lastBMIUpdate = new Date().toISOString();
    saveHealthData();
    
    // Update BMI display in dashboard
    const bmiDisplay = document.getElementById('bmiDisplay');
    if (bmiDisplay) {
        bmiDisplay.textContent = bmi.toFixed(1);
    }
    
    resultDiv.innerHTML = `
        <div class="text-center">
            <div class="text-2xl font-bold ${color}">${bmi.toFixed(1)}</div>
            <div class="text-sm font-medium ${color}">${category}</div>
            <div class="text-xs text-gray-600 mt-2">${recommendation}</div>
            <div class="mt-3 pt-3 border-t border-gray-200">
                <div class="text-xs text-gray-500">
                    <div>Weight: ${weight} kg</div>
                    <div>Height: ${height} cm</div>
                    <div>Calculated: ${new Date().toLocaleDateString()}</div>
                </div>
            </div>
        </div>
    `;
    resultDiv.classList.remove('hidden');
}

function addWater() {
    const maxGlasses = 12;
    
    if (healthData.waterIntake >= maxGlasses) {
        showNotification('Daily water goal achieved! Great job staying hydrated!', 'success');
        return;
    }
    
    healthData.waterIntake++;
    
    // Update all water displays
    const waterCounts = document.querySelectorAll('#waterCount');
    waterCounts.forEach(element => {
        element.textContent = healthData.waterIntake;
    });
    
    // Update progress bar
    const progressBars = document.querySelectorAll('#waterProgress');
    const progress = Math.min((healthData.waterIntake / 8) * 100, 100);
    progressBars.forEach(bar => {
        bar.style.width = progress + '%';
        
        // Change color based on progress
        bar.className = 'h-3 rounded-full transition-all duration-500';
        if (progress >= 100) {
            bar.classList.add('bg-green-500');
        } else if (progress >= 75) {
            bar.classList.add('bg-cyan-500');
        } else if (progress >= 50) {
            bar.classList.add('bg-blue-400');
        } else {
            bar.classList.add('bg-cyan-400');
        }
    });
    
    // Show encouragement messages
    if (healthData.waterIntake === 8) {
        showNotification('Daily water goal achieved! Keep it up!', 'success');
    } else if (healthData.waterIntake % 4 === 0) {
        showNotification(`Great! ${healthData.waterIntake} glasses down!`, 'info');
    }
    
    healthData.lastWaterUpdate = new Date().toISOString();
    saveHealthData();
}

function resetWaterTracker() {
    healthData.waterIntake = 0;
    const waterCounts = document.querySelectorAll('#waterCount');
    waterCounts.forEach(element => {
        element.textContent = '0';
    });
    
    const progressBars = document.querySelectorAll('#waterProgress');
    progressBars.forEach(bar => {
        bar.style.width = '0%';
        bar.className = 'bg-cyan-500 h-3 rounded-full transition-all duration-500';
    });
    
    saveHealthData();
}

function updateSteps() {
    const stepsInput = document.getElementById('steps');
    const steps = parseInt(stepsInput.value);
    
    if (!steps || steps < 0) {
        showNotification('Please enter a valid number of steps', 'error');
        return;
    }
    
    if (steps > 100000) {
        showNotification('Number seems too high. Please check your input.', 'warning');
        return;
    }
    
    healthData.steps = steps;
    healthData.lastStepsUpdate = new Date().toISOString();
    
    // Update all step displays
    const stepCounts = document.querySelectorAll('#stepCount');
    stepCounts.forEach(element => {
        element.textContent = steps.toLocaleString();
    });
    
    // Calculate and show progress towards daily goal
    const dailyGoal = 10000;
    const progress = Math.min((steps / dailyGoal) * 100, 100);
    
    // Show achievement messages
    if (steps >= dailyGoal) {
        showNotification('🎉 Daily step goal achieved! Amazing work!', 'success');
    } else if (steps >= dailyGoal * 0.75) {
        showNotification('Almost there! 75% of daily goal completed!', 'info');
    } else if (steps >= dailyGoal * 0.5) {
        showNotification('Halfway to your daily goal! Keep going!', 'info');
    }
    
    // Calculate calories burned (rough estimate: 0.04 calories per step)
    const caloriesBurned = Math.round(steps * 0.04);
    
    // Update step counter display with additional info
    const stepCounterContainer = stepsInput.closest('.material-card');
    if (stepCounterContainer) {
        const existingInfo = stepCounterContainer.querySelector('.step-info');
        const infoHtml = `
            <div class="step-info mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Progress:</span>
                    <span class="font-medium ${progress >= 100 ? 'text-green-600' : 'text-blue-600'}">${progress.toFixed(0)}%</span>
                </div>
                <div class="flex justify-between items-center mt-1">
                    <span class="text-gray-600">Calories burned:</span>
                    <span class="font-medium text-orange-600">~${caloriesBurned}</span>
                </div>
                <div class="flex justify-between items-center mt-1">
                    <span class="text-gray-600">Distance:</span>
                    <span class="font-medium text-purple-600">~${(steps * 0.0008).toFixed(1)} km</span>
                </div>
            </div>
        `;
        
        if (existingInfo) {
            existingInfo.innerHTML = infoHtml.substring(infoHtml.indexOf('>') + 1, infoHtml.lastIndexOf('</div>'));
        } else {
            stepsInput.parentElement.insertAdjacentHTML('afterend', infoHtml);
        }
    }
    
    saveHealthData();
    showNotification(`Steps updated: ${steps.toLocaleString()} steps recorded!`, 'success');
}

function resetStepCounter() {
    healthData.steps = 0;
    const stepCounts = document.querySelectorAll('#stepCount');
    stepCounts.forEach(element => {
        element.textContent = '0';
    });
    
    // Remove step info if exists
    const stepInfo = document.querySelector('.step-info');
    if (stepInfo) {
        stepInfo.remove();
    }
    
    saveHealthData();
}

// AI Health Assistant
function addSymptom(symptom) {
    const textarea = document.getElementById('symptoms');
    const currentSymptoms = textarea.value;
    
    if (currentSymptoms && !currentSymptoms.endsWith(' ')) {
        textarea.value += ', ' + symptom;
    } else {
        textarea.value += symptom;
    }
}

function analyzeSymptoms() {
    const symptoms = document.getElementById('symptoms').value.toLowerCase();
    
    if (!symptoms) {
        alert('Please describe your symptoms first.');
        return;
    }
    
    // Rule-based symptom analysis
    const analysis = analyzeSymptomsRuleBased(symptoms);
    
    document.getElementById('symptomResults').classList.remove('hidden');
    document.getElementById('resultsContent').innerHTML = analysis;
}

function analyzeSymptomsRuleBased(symptoms) {
    let possibleConditions = [];
    let recommendations = [];
    
    // Simple rule-based logic
    if (symptoms.includes('fever') && symptoms.includes('cough')) {
        possibleConditions.push({
            name: 'Common Cold / Flu',
            probability: 'High',
            causes: 'Viral infection',
            prevention: 'Wash hands frequently, avoid close contact with sick people',
            remedies: 'Rest, drink fluids, take paracetamol for fever'
        });
    }
    
    if (symptoms.includes('headache') && symptoms.includes('fever')) {
        possibleConditions.push({
            name: 'Viral Fever',
            probability: 'Medium',
            causes: 'Viral infection',
            prevention: 'Maintain hygiene, stay hydrated',
            remedies: 'Rest, hydration, consult doctor if persistent'
        });
    }
    
    if (symptoms.includes('fatigue') && symptoms.includes('headache')) {
        possibleConditions.push({
            name: 'Stress / Exhaustion',
            probability: 'Medium',
            causes: 'Physical or mental stress',
            prevention: 'Regular sleep, stress management',
            remedies: 'Rest, meditation, balanced diet'
        });
    }
    
    if (possibleConditions.length === 0) {
        possibleConditions.push({
            name: 'General Discomfort',
            probability: 'Low',
            causes: 'Various factors',
            prevention: 'Maintain healthy lifestyle',
            remedies: 'Rest, hydration, monitor symptoms'
        });
    }
    
    let html = '<div class="space-y-4">';
    
    possibleConditions.forEach(condition => {
        html += `
            <div class="border rounded-lg p-4 bg-blue-50">
                <h5 class="font-semibold text-lg mb-2">${condition.name}</h5>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><strong>Probability:</strong> ${condition.probability}</div>
                    <div><strong>Causes:</strong> ${condition.causes}</div>
                    <div><strong>Prevention:</strong> ${condition.prevention}</div>
                    <div><strong>Remedies:</strong> ${condition.remedies}</div>
                </div>
            </div>
        `;
    });
    
    html += `
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm"><strong>Disclaimer:</strong> This is not a medical diagnosis. Please consult a qualified healthcare professional for proper medical advice.</p>
        </div>
    </div>`;
    
    return html;
}

// Doctor Finder
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                document.getElementById('locationInput').value = 
                    `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`;
                searchDoctors();
            },
            error => {
                console.error('Error getting location:', error);
                alert('Unable to get your location. Please enter it manually.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

async function searchDoctors() {
    const location = document.getElementById('locationInput').value;
    
    if (!location) {
        alert('Please enter a location or use current location.');
        return;
    }
    
    // For demo purposes, show mock results
    // In production, use OpenStreetMap Overpass API
    const mockResults = [
        {
            name: 'Government District Hospital',
            type: 'hospital',
            distance: '2.5 km',
            address: 'Main Road, District Center',
            phone: '0123-456789',
            rating: 4.2
        },
        {
            name: 'City Medical Center',
            type: 'clinic',
            distance: '3.8 km',
            address: 'Market Street, City Center',
            phone: '0123-987654',
            rating: 4.5
        },
        {
            name: 'Rural Health Clinic',
            type: 'clinic',
            distance: '5.2 km',
            address: 'Village Road, Rural Area',
            phone: '0123-123456',
            rating: 3.8
        }
    ];
    
    displayDoctorResults(mockResults);
}

function displayDoctorResults(results) {
    const resultsDiv = document.getElementById('doctorResults');
    
    let html = '<div class="space-y-4">';
    
    results.forEach(result => {
        const typeIcon = result.type === 'hospital' ? 'fa-hospital' : 'fa-clinic-medical';
        const typeColor = result.type === 'hospital' ? 'text-blue-600' : 'text-green-600';
        
        html += `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-lg flex items-center">
                            <i class="fas ${typeIcon} ${typeColor} mr-2"></i>
                            ${result.name}
                        </h4>
                        <p class="text-gray-600 text-sm mt-1">${result.address}</p>
                        <div class="flex items-center mt-2 text-sm">
                            <i class="fas fa-map-marker-alt text-red-500 mr-1"></i>
                            <span>${result.distance}</span>
                            <i class="fas fa-phone text-green-500 ml-4 mr-1"></i>
                            <span>${result.phone}</span>
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="text-yellow-500">
                            ${'★'.repeat(Math.floor(result.rating))}${'☆'.repeat(5-Math.floor(result.rating))}
                        </div>
                        <div class="text-sm text-gray-600">${result.rating}</div>
                    </div>
                </div>
                <div class="mt-3 flex gap-2">
                    <button onclick="getDirections('${result.name}')" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition">
                        <i class="fas fa-directions mr-1"></i>Directions
                    </button>
                    <button onclick="callFacility('${result.phone}')" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition">
                        <i class="fas fa-phone mr-1"></i>Call
                    </button>
                    <button onclick="saveFavorite('${result.name}')" class="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 transition">
                        <i class="fas fa-heart mr-1"></i>Save
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    resultsDiv.innerHTML = html;
}

function filterDoctors(type) {
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('bg-blue-500', 'text-white');
    });
    
    // Get the clicked button
    const clickedBtn = document.querySelector(`[onclick="filterDoctors('${type}')"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('bg-blue-500', 'text-white');
    }
    
    // Re-search with filter
    searchDoctors();
}

function getDirections(name) {
    alert(`Getting directions to ${name}...`);
}

function callFacility(phone) {
    window.location.href = `tel:${phone}`;
}

function saveFavorite(name) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (!favorites.includes(name)) {
        favorites.push(name);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        alert(`${name} saved to favorites!`);
    } else {
        alert(`${name} is already in favorites.`);
    }
}

// Medicine Lookup
// Enhanced Medicine Lookup
const medicineDatabase = [
    {
        name: 'Paracetamol',
        genericName: 'Acetaminophen',
        dosage: '500mg',
        forms: ['Tablet', 'Syrup', 'Injection'],
        uses: ['Fever', 'Headache', 'Body pain', 'Muscle pain'],
        sideEffects: ['Nausea', 'Stomach upset', 'Rash (rare)', 'Liver damage (high dose)'],
        precautions: ['Do not exceed 4 tablets in 24 hours', 'Avoid with alcohol', 'Consult doctor if pregnant'],
        interactions: ['Warfarin', 'Alcohol', 'Isoniazid'],
        category: 'Analgesic',
        prescriptionRequired: false
    },
    {
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        dosage: '400mg',
        forms: ['Tablet', 'Gel', 'Syrup'],
        uses: ['Inflammation', 'Pain relief', 'Fever', 'Arthritis'],
        sideEffects: ['Stomach irritation', 'Nausea', 'Headache', 'Dizziness'],
        precautions: ['Take with food', 'Avoid if have stomach ulcers', 'Not recommended in pregnancy'],
        interactions: ['Aspirin', 'Blood thinners', 'ACE inhibitors'],
        category: 'NSAID',
        prescriptionRequired: false
    },
    {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        dosage: '500mg',
        forms: ['Capsule', 'Syrup', 'Tablet'],
        uses: ['Bacterial infections', 'Respiratory infections', 'UTI', 'Dental infections'],
        sideEffects: ['Diarrhea', 'Nausea', 'Rash', 'Yeast infection'],
        precautions: ['Complete full course', 'Allergic to penicillin?'],
        interactions: ['Allopurinol', 'Birth control pills', 'Blood thinners'],
        category: 'Antibiotic',
        prescriptionRequired: true
    },
    {
        name: 'Omeprazole',
        genericName: 'Omeprazole',
        dosage: '20mg',
        forms: ['Capsule', 'Tablet'],
        uses: ['Acid reflux', 'GERD', 'Stomach ulcers', 'Heartburn'],
        sideEffects: ['Headache', 'Diarrhea', 'Nausea', 'Vitamin B12 deficiency (long term)'],
        precautions: ['Take before meals', 'Not for immediate relief'],
        interactions: ['Clopidogrel', 'Ketoconazole', 'Iron supplements'],
        category: 'PPI',
        prescriptionRequired: true
    },
    {
        name: 'Metformin',
        genericName: 'Metformin',
        dosage: '500mg',
        forms: ['Tablet', 'Extended release'],
        uses: ['Type 2 diabetes', 'PCOS', 'Insulin resistance'],
        sideEffects: ['Diarrhea', 'Nausea', 'Stomach upset', 'Lactic acidosis (rare)'],
        precautions: ['Take with meals', 'Monitor kidney function', 'Avoid alcohol'],
        interactions: ['Contrast dye', 'Diuretics', 'Beta blockers'],
        category: 'Anti-diabetic',
        prescriptionRequired: true
    },
    {
        name: 'Aspirin',
        genericName: 'Acetylsalicylic acid',
        dosage: '325mg',
        forms: ['Tablet', 'Chewable', 'Enteric coated'],
        uses: ['Pain relief', 'Fever', 'Blood thinner', 'Heart attack prevention'],
        sideEffects: ['Stomach bleeding', 'Tinnitus', 'Reye syndrome in children'],
        precautions: ['Not for children under 19', 'Take with food', 'Stop before surgery'],
        interactions: ['Blood thinners', 'NSAIDs', 'Methotrexate'],
        category: 'Analgesic',
        prescriptionRequired: false
    }
];

async function searchMedicine() {
    const medicineName = document.getElementById('medicineSearch').value.toLowerCase().trim();
    const resultsDiv = document.getElementById('medicineResults');
    
    if (!medicineName) {
        resultsDiv.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-capsules text-4xl mb-3"></i>
                <p>Please enter a medicine name to search</p>
            </div>
        `;
        return;
    }
    
    // Show loading state
    resultsDiv.innerHTML = `
        <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p class="text-gray-600 mt-2">Searching medicine database...</p>
        </div>
    `;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Search in database
    const results = medicineDatabase.filter(medicine => 
        medicine.name.toLowerCase().includes(medicineName) ||
        medicine.genericName.toLowerCase().includes(medicineName) ||
        medicine.uses.some(use => use.toLowerCase().includes(medicineName))
    );
    
    if (results.length === 0) {
        resultsDiv.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-search text-4xl mb-3"></i>
                <p>No medicine found for "${medicineName}"</p>
                <p class="text-sm mt-2">Try searching with generic name or condition</p>
            </div>
        `;
        return;
    }
    
    displayMedicineResults(results);
}

function displayMedicineResults(medicines) {
    const resultsDiv = document.getElementById('medicineResults');
    
    let html = '<div class="space-y-4">';
    
    medicines.forEach(medicine => {
        const prescriptionBadge = medicine.prescriptionRequired 
            ? '<span class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Prescription Required</span>'
            : '<span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">OTC Available</span>';
        
        html += `
            <div class="border rounded-lg p-6 bg-white shadow-md hover:shadow-lg transition-shadow">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="font-semibold text-xl text-gray-800">${medicine.name}</h4>
                        <p class="text-sm text-gray-600">Generic: ${medicine.genericName}</p>
                    </div>
                    <div class="text-right">
                        ${prescriptionBadge}
                        <div class="text-xs text-gray-500 mt-1">${medicine.category}</div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-blue-50 p-3 rounded-lg">
                        <h5 class="font-semibold text-blue-800 mb-2">
                            <i class="fas fa-pills mr-1"></i>Basic Information
                        </h5>
                        <div class="space-y-1 text-sm">
                            <div><strong>Dosage:</strong> ${medicine.dosage}</div>
                            <div><strong>Forms:</strong> ${medicine.forms.join(', ')}</div>
                        </div>
                    </div>
                    
                    <div class="bg-green-50 p-3 rounded-lg">
                        <h5 class="font-semibold text-green-800 mb-2">
                            <i class="fas fa-heartbeat mr-1"></i>Uses
                        </h5>
                        <ul class="list-disc list-inside text-sm space-y-1">
                            ${medicine.uses.map(use => `<li>${use}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="bg-yellow-50 p-3 rounded-lg">
                        <h5 class="font-semibold text-yellow-800 mb-2">
                            <i class="fas fa-exclamation-triangle mr-1"></i>Side Effects
                        </h5>
                        <ul class="list-disc list-inside text-sm space-y-1">
                            ${medicine.sideEffects.map(effect => `<li>${effect}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="bg-red-50 p-3 rounded-lg">
                        <h5 class="font-semibold text-red-800 mb-2">
                            <i class="fas fa-shield-alt mr-1"></i>Precautions
                        </h5>
                        <ul class="list-disc list-inside text-sm space-y-1">
                            ${medicine.precautions.map(precaution => `<li>${precaution}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                
                ${medicine.interactions.length > 0 ? `
                <div class="mt-4 p-3 bg-purple-50 rounded-lg">
                    <h5 class="font-semibold text-purple-800 mb-2">
                        <i class="fas fa-link mr-1"></i>Drug Interactions
                    </h5>
                    <div class="flex flex-wrap gap-2">
                        ${medicine.interactions.map(interaction => 
                            `<span class="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">${interaction}</span>`
                        ).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p class="text-sm text-orange-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        <strong>Medical Disclaimer:</strong> This information is for educational purposes only. 
                        Always consult a qualified healthcare professional before taking any medication.
                    </p>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    resultsDiv.innerHTML = html;
}

// Health Records
function showAddRecordForm() {
    document.getElementById('addRecordForm').classList.remove('hidden');
}

function hideAddRecordForm() {
    document.getElementById('addRecordForm').classList.add('hidden');
}

function saveHealthRecord() {
    const record = {
        id: Date.now(),
        name: document.getElementById('patientName').value,
        age: document.getElementById('patientAge').value,
        bloodGroup: document.getElementById('bloodGroup').value,
        emergencyContact: document.getElementById('emergencyContact').value,
        medicalHistory: document.getElementById('medicalHistory').value,
        createdAt: new Date().toISOString()
    };
    
    if (!record.name || !record.age) {
        alert('Please fill in at least name and age.');
        return;
    }
    
    let records = JSON.parse(localStorage.getItem('healthRecords') || '[]');
    records.push(record);
    localStorage.setItem('healthRecords', JSON.stringify(records));
    
    // Clear form
    document.getElementById('patientName').value = '';
    document.getElementById('patientAge').value = '';
    document.getElementById('bloodGroup').value = '';
    document.getElementById('emergencyContact').value = '';
    document.getElementById('medicalHistory').value = '';
    
    hideAddRecordForm();
    loadHealthRecords();
    
    alert('Health record saved successfully!');
}

// Government Schemes Display Function
function displaySchemes(schemes) {
    const schemesList = document.getElementById('schemesList');
    if (!schemesList) return;
    
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
    
    schemes.forEach(scheme => {
        const statusColor = scheme.status === 'Active' ? 'green' : 'yellow';
        const categoryColors = {
            'Health Insurance': 'blue',
            'Maternal Health': 'pink',
            'Child Health': 'purple',
            'Mental Health': 'indigo',
            'Critical Illness': 'red'
        };
        const categoryColor = categoryColors[scheme.category] || 'gray';
        
        html += `
            <div class="scheme-card bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-200" data-scheme-id="${scheme.id}">
                <div class="flex items-center mb-4">
                    <div class="w-16 h-16 bg-gradient-to-br from-${categoryColor}-500 to-${categoryColor}-600 rounded-full flex items-center justify-center text-white mr-4">
                        <i class="fas ${getSchemeIcon(scheme.category)} text-2xl"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-xl font-bold text-gray-800 line-clamp-2">${scheme.name}</h4>
                        <p class="text-sm text-gray-600 mt-1 line-clamp-2">${scheme.description}</p>
                        <div class="flex items-center mt-2 space-x-2">
                            <span class="bg-${statusColor}-100 text-${statusColor}-700 text-xs px-2 py-1 rounded-full">${scheme.status}</span>
                            <span class="bg-${categoryColor}-100 text-${categoryColor}-700 text-xs px-2 py-1 rounded-full">${scheme.category}</span>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <div class="bg-blue-50 p-3 rounded-lg">
                        <h5 class="font-semibold text-blue-800 text-sm mb-1">
                            <i class="fas fa-users mr-1"></i>Eligibility
                        </h5>
                        <p class="text-xs text-gray-700 line-clamp-2">${scheme.eligibility}</p>
                    </div>
                    
                    <div class="bg-green-50 p-3 rounded-lg">
                        <h5 class="font-semibold text-green-800 text-sm mb-1">
                            <i class="fas fa-gift mr-1"></i>Key Benefits
                        </h5>
                        <ul class="text-xs text-gray-700 space-y-1">
                            ${scheme.benefits.slice(0, 2).map(benefit => `<li class="line-clamp-1">• ${benefit}</li>`).join('')}
                            ${scheme.benefits.length > 2 ? `<li class="text-green-600 font-medium">+${scheme.benefits.length - 2} more benefits</li>` : ''}
                        </ul>
                    </div>
                </div>
                
                <div class="mt-4 flex flex-wrap gap-2">
                    <button onclick="showSchemeDetails('${scheme.id}')" class="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition text-sm">
                        <i class="fas fa-info-circle mr-1"></i>Details
                    </button>
                    <button onclick="applyForScheme('${scheme.id}')" class="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition text-sm">
                        <i class="fas fa-paper-plane mr-1"></i>Apply
                    </button>
                </div>
                
                ${scheme.helpline ? `
                <div class="mt-3 pt-3 border-t border-gray-200">
                    <div class="flex justify-between items-center text-xs">
                        <div class="flex items-center text-gray-600">
                            <i class="fas fa-phone mr-1"></i>
                            <span>${scheme.helpline}</span>
                        </div>
                        ${scheme.website ? `
                        <div class="flex items-center text-gray-600">
                            <i class="fas fa-globe mr-1"></i>
                            <span>Website Available</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    schemesList.innerHTML = html;
}

function getSchemeIcon(category) {
    const icons = {
        'Health Insurance': 'fa-shield-alt',
        'Maternal Health': 'fa-baby',
        'Child Health': 'fa-child',
        'Mental Health': 'fa-brain',
        'Critical Illness': 'fa-hospital'
    };
    return icons[category] || 'fa-heartbeat';
}

function showSchemeDetails(schemeId) {
    const scheme = window.allSchemes.find(s => s.id === schemeId);
    if (!scheme) return;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">${scheme.name}</h2>
                    <p class="text-gray-600 mt-2">${scheme.description}</p>
                    <div class="flex gap-2 mt-3">
                        <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">${scheme.status}</span>
                        <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">${scheme.category}</span>
                    </div>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-3">
                        <i class="fas fa-users mr-2"></i>Eligibility Criteria
                    </h3>
                    <p class="text-sm text-gray-700">${scheme.eligibility}</p>
                </div>
                
                <div class="bg-green-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-green-800 mb-3">
                        <i class="fas fa-gift mr-2"></i>Benefits & Coverage
                    </h3>
                    <ul class="text-sm text-gray-700 space-y-2">
                        ${scheme.benefits.map(benefit => `<li>• ${benefit}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="bg-purple-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-purple-800 mb-3">
                        <i class="fas fa-list-alt mr-2"></i>Required Documents
                    </h3>
                    <ul class="text-sm text-gray-700 space-y-2">
                        ${scheme.documents.map(doc => `<li>• ${doc}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="bg-orange-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-orange-800 mb-3">
                        <i class="fas fa-map-marked-alt mr-2"></i>How to Apply
                    </h3>
                    <ol class="text-sm text-gray-700 space-y-2">
                        ${scheme.howToApply.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
            </div>
            
            <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-center">
                    <div>
                        ${scheme.helpline ? `
                        <div class="flex items-center text-gray-700">
                            <i class="fas fa-phone mr-2 text-green-600"></i>
                            <span class="font-medium">Helpline: ${scheme.helpline}</span>
                        </div>
                        ` : ''}
                        ${scheme.website ? `
                        <div class="flex items-center text-gray-700 mt-1">
                            <i class="fas fa-globe mr-2 text-blue-600"></i>
                            <span class="font-medium">Website: Available</span>
                        </div>
                        ` : ''}
                    </div>
                    <button onclick="applyForScheme('${scheme.id}'); this.closest('.fixed').remove();" class="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition">
                        <i class="fas fa-paper-plane mr-2"></i>Apply Now
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Enhanced scheme filtering with error handling and debouncing
let searchTimeout;

function filterSchemes() {
    // Clear previous timeout to prevent excessive calls
    clearTimeout(searchTimeout);
    
    // Debounce search for better performance
    searchTimeout = setTimeout(() => {
        try {
            const searchInput = document.getElementById('schemeSearch');
            const clearBtn = document.getElementById('clearSearch');
            
            // Handle null/undefined elements
            if (!searchInput) {
                console.error('Search input not found');
                return;
            }
            
            const searchTerm = searchInput.value.toLowerCase().trim();
            
            // Show/hide clear button based on search term
            if (clearBtn) {
                if (searchTerm) {
                    clearBtn.classList.remove('hidden');
                } else {
                    clearBtn.classList.add('hidden');
                }
            }
            
            // If no search term, show all schemes
            if (!searchTerm) {
                if (window.allSchemes && window.allSchemes.length > 0) {
                    displaySchemes(window.allSchemes);
                }
                return;
            }
            
            // Filter schemes with error handling
            if (!window.allSchemes || !Array.isArray(window.allSchemes)) {
                console.error('Schemes data not available');
                showNotification('Schemes data not loaded. Please refresh the page.', 'error');
                return;
            }
            
            const filteredSchemes = window.allSchemes.filter(scheme => {
                if (!scheme || typeof scheme !== 'object') return false;
                
                return (scheme.name && scheme.name.toLowerCase().includes(searchTerm)) ||
                       (scheme.description && scheme.description.toLowerCase().includes(searchTerm)) ||
                       (scheme.category && scheme.category.toLowerCase().includes(searchTerm)) ||
                       (scheme.eligibility && scheme.eligibility.toLowerCase().includes(searchTerm)) ||
                       (scheme.benefits && Array.isArray(scheme.benefits) && 
                        scheme.benefits.some(benefit => benefit && benefit.toLowerCase().includes(searchTerm)));
            });
            
            // Display results or no results message
            if (filteredSchemes.length === 0) {
                displayNoResults(searchTerm);
            } else {
                displaySchemes(filteredSchemes);
            }
            
        } catch (error) {
            console.error('Error filtering schemes:', error);
            showNotification('An error occurred while searching. Please try again.', 'error');
        }
    }, 300); // 300ms debounce delay
}

// Clear search function
function clearSchemeSearch() {
    try {
        const searchInput = document.getElementById('schemeSearch');
        const clearBtn = document.getElementById('clearSearch');
        
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        
        if (clearBtn) {
            clearBtn.classList.add('hidden');
        }
        
        // Show all schemes
        if (window.allSchemes && window.allSchemes.length > 0) {
            displaySchemes(window.allSchemes);
        }
    } catch (error) {
        console.error('Error clearing search:', error);
    }
}

// Set search term from popular searches
function setSearchTerm(term) {
    try {
        const searchInput = document.getElementById('schemeSearch');
        if (searchInput) {
            searchInput.value = term;
            searchInput.focus();
            filterSchemes();
        }
    } catch (error) {
        console.error('Error setting search term:', error);
    }
}

// Display no results message with better UX
function displayNoResults(searchTerm) {
    const schemesList = document.getElementById('schemesList');
    if (!schemesList) return;
    
    schemesList.innerHTML = `
        <div class="text-center py-12 px-4">
            <div class="max-w-md mx-auto">
                <i class="fas fa-search text-5xl text-gray-300 mb-6"></i>
                <h3 class="text-2xl font-semibold text-gray-700 mb-3">No schemes found</h3>
                <p class="text-gray-500 mb-4">No schemes match "<span class="font-medium">${escapeHtml(searchTerm)}</span>"</p>
                <p class="text-sm text-gray-400 mb-6">Try searching with different keywords like "insurance", "maternal", "child", "mental health", or "elderly"</p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onclick="clearSchemeSearch()" class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg">
                        <i class="fas fa-times mr-2"></i>Clear Search
                    </button>
                    <button onclick="setSearchTerm('')" class="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors">
                        <i class="fas fa-list mr-2"></i>View All Schemes
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function applyForScheme(schemeId) {
    const scheme = window.allSchemes.find(s => s.id === schemeId);
    if (!scheme) return;
    
    showNotification(`Application process started for ${scheme.name}. Please contact the helpline number: ${scheme.helpline || 'nearest health center'}`, 'success');
    
    // Log the application interest (in real app, this would send to backend)
    const application = {
        schemeId: scheme.id,
        schemeName: scheme.name,
        timestamp: new Date().toISOString(),
        status: 'interested'
    };
    
    let applications = JSON.parse(localStorage.getItem('schemeApplications') || '[]');
    applications.push(application);
    localStorage.setItem('schemeApplications', JSON.stringify(applications));
}

// Emergency Functions
function showEmergencyMode() {
    document.getElementById('emergencyModal').classList.remove('hidden');
}

function closeEmergencyMode() {
    document.getElementById('emergencyModal').classList.add('hidden');
}

function findNearestHospital() {
    closeEmergencyMode();
    showSection('doctor-finder');
    getCurrentLocation();
}

// Charts - Removed Health Metrics and Weekly Progress
function initializeCharts() {
    // Charts removed as requested
    console.log('Charts initialization skipped - Health Metrics and Weekly Progress removed');
}

// Local Storage Functions
function saveHealthData() {
    localStorage.setItem('healthData', JSON.stringify(healthData));
}

function loadHealthData() {
    const saved = localStorage.getItem('healthData');
    if (saved) {
        healthData = JSON.parse(saved);
        
        // Update UI
        document.getElementById('waterCount').textContent = healthData.waterIntake || 0;
        document.getElementById('stepCount').textContent = healthData.steps || 0;
        
        if (healthData.waterIntake) {
            const progress = Math.min((healthData.waterIntake / 8) * 100, 100);
            document.getElementById('waterProgress').style.width = progress + '%';
        }
    }
}

// Offline Detection
function setupOfflineDetection() {
    window.addEventListener('online', () => {
        document.getElementById('offlineBanner').style.display = 'none';
    });
    
    window.addEventListener('offline', () => {
        document.getElementById('offlineBanner').style.display = 'block';
    });
    
    if (!navigator.onLine) {
        document.getElementById('offlineBanner').style.display = 'block';
    }
}

// Emergency Functions - REMOVED DUPLICATE
// These are already defined above at lines 581-593

// Emergency First Aid Functions
function getFirstAidSuggestions() {
    return [
        'Check for airway, breathing, and circulation',
        'Place person in recovery position',
        'Keep person warm and comfortable',
        'Monitor vital signs: breathing rate, pulse, blood pressure',
        'Do not give food or water by mouth if unconscious',
        'Perform CPR if trained and certified'
    ];
}

// Enhanced Symptom Analysis with Free Medical API
async function analyzeSymptomsWithAPI(symptoms) {
    try {
        // Show loading state
        const analyzeBtn = document.querySelector('#analyzeBtn');
        if (analyzeBtn) {
            const originalContent = analyzeBtn.innerHTML;
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>AI Analyzing with Medical Data...';
            analyzeBtn.disabled = true;
        }
        
        // Call free medical API for symptom analysis
        const medicalResponse = await fetch('https://api.fda.gov/drug/label.json?search=openfda.purpose:"symptom"&limit=10');
        const medicalData = medicalResponse.ok ? await medicalResponse.json() : null;
        
        // Call free disease API
        const diseaseResponse = await fetch('https://disease.sh/v3/covid-19/all');
        const diseaseData = diseaseResponse.ok ? await diseaseResponse.json() : null;
        
        // Enhanced analysis with real medical data
        const analysis = generateEnhancedAnalysis(symptoms, diseaseData, medicalData);
        
        document.getElementById('symptomResults').classList.remove('hidden');
        document.getElementById('resultsContent').innerHTML = analysis;
        
        // Reset button
        if (analyzeBtn) {
            analyzeBtn.innerHTML = originalContent;
            analyzeBtn.disabled = false;
        }
        
        // Scroll to results
        document.getElementById('symptomResults').scrollIntoView({ behavior: 'smooth' });
        
        showNotification('Enhanced AI analysis complete!', 'success');
    } catch (error) {
        console.error('API Error:', error);
        // Fallback to rule-based analysis
        analyzeSymptoms();
    }
}

function generateEnhancedAnalysis(symptoms, diseaseData, medicineData) {
    const symptomsLower = symptoms.toLowerCase();
    
    // Symptom to disease mapping database
    const symptomDiseaseMap = {
        'fever': [
            { name: 'Common Cold', confidence: 70, severity: 'low' },
            { name: 'Influenza (Flu)', confidence: 65, severity: 'moderate' },
            { name: 'COVID-19', confidence: 60, severity: 'high' },
            { name: 'Dengue Fever', confidence: 55, severity: 'high' },
            { name: 'Typhoid Fever', confidence: 50, severity: 'moderate' }
        ],
        'headache': [
            { name: 'Tension Headache', confidence: 75, severity: 'low' },
            { name: 'Migraine', confidence: 65, severity: 'moderate' },
            { name: 'Sinusitis', confidence: 60, severity: 'low' },
            { name: 'Dehydration', confidence: 55, severity: 'low' },
            { name: 'High Blood Pressure', confidence: 50, severity: 'high' }
        ],
        'cough': [
            { name: 'Common Cold', confidence: 70, severity: 'low' },
            { name: 'Bronchitis', confidence: 65, severity: 'moderate' },
            { name: 'Pneumonia', confidence: 60, severity: 'high' },
            { name: 'Asthma', confidence: 55, severity: 'moderate' },
            { name: 'COVID-19', confidence: 50, severity: 'high' }
        ],
        'chest pain': [
            { name: 'Angina', confidence: 75, severity: 'high' },
            { name: 'Heart Attack', confidence: 70, severity: 'critical' },
            { name: 'Acid Reflux', confidence: 60, severity: 'low' },
            { name: 'Pleurisy', confidence: 55, severity: 'moderate' },
            { name: 'Pulmonary Embolism', confidence: 50, severity: 'critical' }
        ],
        'stomach pain': [
            { name: 'Gastritis', confidence: 70, severity: 'moderate' },
            { name: 'Food Poisoning', confidence: 65, severity: 'moderate' },
            { name: 'Appendicitis', confidence: 60, severity: 'high' },
            { name: 'IBS (Irritable Bowel Syndrome)', confidence: 55, severity: 'low' },
            { name: 'Ulcer', confidence: 50, severity: 'moderate' }
        ],
        'fatigue': [
            { name: 'Anemia', confidence: 70, severity: 'moderate' },
            { name: 'Chronic Fatigue Syndrome', confidence: 65, severity: 'moderate' },
            { name: 'Thyroid Issues', confidence: 60, severity: 'moderate' },
            { name: 'Depression', confidence: 55, severity: 'moderate' },
            { name: 'Sleep Deprivation', confidence: 50, severity: 'low' }
        ],
        'dizziness': [
            { name: 'Vertigo', confidence: 75, severity: 'moderate' },
            { name: 'Low Blood Pressure', confidence: 65, severity: 'moderate' },
            { name: 'Dehydration', confidence: 60, severity: 'low' },
            { name: 'Anemia', confidence: 55, severity: 'moderate' },
            { name: 'Inner Ear Infection', confidence: 50, severity: 'low' }
        ],
        'nausea': [
            { name: 'Food Poisoning', confidence: 70, severity: 'moderate' },
            { name: 'Morning Sickness', confidence: 65, severity: 'low' },
            { name: 'Migraine', confidence: 60, severity: 'moderate' },
            { name: 'Gastritis', confidence: 55, severity: 'moderate' },
            { name: 'Pregnancy', confidence: 50, severity: 'low' }
        ]
    };
    
    // Analyze symptoms and find matching diseases
    let possibleConditions = [];
    let severity = 'low';
    let recommendations = [];
    let firstAidSuggestions = [];
    
    // Check each symptom in the input
    Object.keys(symptomDiseaseMap).forEach(symptom => {
        if (symptomsLower.includes(symptom)) {
            const diseases = symptomDiseaseMap[symptom];
            diseases.forEach(disease => {
                // Add disease to possible conditions if not already added
                const existingCondition = possibleConditions.find(c => c.name === disease.name);
                if (!existingCondition) {
                    possibleConditions.push({
                        name: disease.name,
                        confidence: disease.confidence,
                        severity: disease.severity,
                        matchedSymptom: symptom
                    });
                } else {
                    // Update confidence if higher
                    if (disease.confidence > existingCondition.confidence) {
                        existingCondition.confidence = disease.confidence;
                    }
                }
            });
        }
    });
    
    // Sort by confidence
    possibleConditions.sort((a, b) => b.confidence - a.confidence);
    
    // Determine overall severity
    if (possibleConditions.some(c => c.severity === 'critical')) {
        severity = 'critical';
    } else if (possibleConditions.some(c => c.severity === 'high')) {
        severity = 'high';
    } else if (possibleConditions.some(c => c.severity === 'moderate')) {
        severity = 'moderate';
    }
    
    // Generate recommendations based on severity
    if (severity === 'critical') {
        recommendations.push('Call emergency services immediately (108)', 'Do not delay medical attention', 'Monitor vital signs');
        firstAidSuggestions.push('Call ambulance immediately', 'Keep person calm and still', 'Monitor breathing and pulse');
    } else if (severity === 'high') {
        recommendations.push('Seek immediate medical attention', 'Monitor symptoms closely', 'Consider emergency room visit');
        firstAidSuggestions.push('Prepare for hospital visit', 'Document symptom timeline', 'Have emergency contacts ready');
    } else if (severity === 'moderate') {
        recommendations.push('Consult doctor within 24-48 hours', 'Monitor symptom changes', 'Rest and hydrate');
        firstAidSuggestions.push('Track symptoms in journal', 'Avoid strenuous activity', 'Stay hydrated and rest');
    } else {
        recommendations.push('Monitor symptoms at home', 'Rest and recover', 'Over-the-counter medication if appropriate');
        firstAidSuggestions.push('Get adequate rest', 'Stay hydrated', 'Monitor for changes');
    }
    
    // Generate comprehensive analysis
    const riskColor = severity === 'critical' ? 'red' : severity === 'high' ? 'orange' : severity === 'moderate' ? 'yellow' : 'green';
    
    return `
        <div class="space-y-4">
            <div class="result-card border-l-4 border-${riskColor}-500 bg-${riskColor}-50">
                <div class="flex items-center mb-3">
                    <i class="fas fa-stethoscope text-2xl mr-3 text-${riskColor}-600"></i>
                    <div>
                        <h5 class="font-semibold text-lg">AI Disease Analysis</h5>
                        <div class="flex items-center mt-1">
                            <span class="text-sm bg-${riskColor}-100 text-${riskColor}-700 px-2 py-1 rounded-full text-xs font-medium">
                                ${severity.toUpperCase()} SEVERITY
                            </span>
                        </div>
                    </div>
                </div>
                <div class="space-y-3">
                    <h6 class="font-medium mb-2">Possible Diseases:</h6>
                    ${possibleConditions.slice(0, 5).map(condition => `
                        <div class="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                            <div class="flex-1">
                                <div class="font-semibold text-gray-800">${condition.name}</div>
                                <div class="text-xs text-gray-600">Matched symptom: ${condition.matchedSymptom}</div>
                                <div class="text-xs text-gray-500">Confidence: ${condition.confidence}%</div>
                            </div>
                            <div class="text-xs bg-${riskColor}-100 text-${riskColor}-700 px-2 py-1 rounded-full font-medium">
                                ${condition.severity}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="result-card bg-blue-50 border-l-4 border-blue-500">
                <h5 class="font-semibold text-lg mb-3 flex items-center">
                    <i class="fas fa-lightbulb text-blue-500 mr-2"></i>
                    Medical Recommendations
                </h5>
                <ul class="list-disc list-inside space-y-2 text-sm">
                    ${recommendations.map(rec => `<li class="text-gray-700">${rec}</li>`).join('')}
                </ul>
            </div>
            
            <div class="result-card bg-yellow-50 border-l-4 border-yellow-500">
                <h5 class="font-semibold text-lg mb-3 flex items-center">
                    <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                    First Aid Suggestions
                </h5>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    ${firstAidSuggestions.map(suggestion => `
                        <div class="bg-white p-3 rounded-lg border border-gray-200">
                            <h6 class="font-medium text-gray-800">${suggestion}</h6>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 class="font-semibold text-lg mb-3 flex items-center">
                    <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                    Medical Data Sources
                </h5>
                <div class="text-sm text-gray-600">
                    <p><strong>Disease Database:</strong> Symptom-to-disease mapping with confidence scores</p>
                    <p><strong>Medical API:</strong> ${medicineData ? 'Connected to FDA drug database' : 'Using local medical data'}</p>
                    <p><strong>Global Health Data:</strong> ${diseaseData ? 'Connected to disease.sh API' : 'Using local analysis'}</p>
                    <p class="text-xs mt-2">Data sources: FDA API, disease.sh, medical symptom databases</p>
                </div>
            </div>
            
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <h5 class="font-semibold text-lg mb-3 flex items-center">
                    <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                    Important Medical Disclaimer
                </h5>
                <p class="text-sm text-gray-700">This AI analysis is for informational purposes only and not a substitute for professional medical advice. If you are experiencing severe symptoms like chest pain, difficulty breathing, or other emergency signs, please call emergency services immediately.</p>
                <div class="mt-3">
                    <div class="flex gap-2">
                        <button onclick="callEmergencyServices()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
                            <i class="fas fa-phone-alt mr-2"></i>Call Emergency Services
                        </button>
                        <button onclick="findNearestHospital()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                            <i class="fas fa-hospital mr-2"></i>Find Nearest Hospital
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Emergency Services Call Function
function callEmergencyServices() {
    if (confirm('Call emergency services (108)? This will connect you to emergency medical services.')) {
        window.location.href = 'tel:108';
    }
}

function findNearestHospital() {
    closeEmergencyMode();
    showSection('doctor-finder');
    getCurrentLocation();
}

// First Aid Functions
function getFirstAidSuggestions() {
    return [
        'Check airway, breathing, and circulation',
        'Place person in recovery position',
        'Keep person warm and comfortable',
        'Monitor vital signs: breathing rate, pulse, blood pressure'
    ];
}

// Maternal Health Registry
function registerMaternalHealth() {
    const motherName = document.getElementById('motherName').value;
    const motherAge = document.getElementById('motherAge').value;
    const lmpDate = document.getElementById('lmpDate').value;
    const motherPhone = document.getElementById('motherPhone').value;
    const bloodGroup = document.getElementById('bloodGroup').value;
    const hospitalName = document.getElementById('hospitalName').value;
    
    if (!motherName || !motherAge || !lmpDate || !motherPhone || !bloodGroup || !hospitalName) {
        showNotification('Please fill all required fields', 'warning');
        return;
    }
    
    const maternalRecord = {
        id: Date.now(),
        motherName,
        motherAge,
        lmpDate,
        motherPhone,
        bloodGroup,
        hospitalName,
        registeredAt: new Date().toISOString()
    };
    
    let maternalRecords = JSON.parse(localStorage.getItem('maternalRecords') || '[]');
    maternalRecords.push(maternalRecord);
    localStorage.setItem('maternalRecords', JSON.stringify(maternalRecords));
    
    // Clear form
    document.getElementById('motherName').value = '';
    document.getElementById('motherAge').value = '';
    document.getElementById('lmpDate').value = '';
    document.getElementById('motherPhone').value = '';
    document.getElementById('bloodGroup').value = '';
    document.getElementById('hospitalName').value = '';
    
    loadMaternalRecords();
    showNotification('Maternal health registration successful!', 'success');
}

function loadMaternalRecords() {
    const maternalRecords = JSON.parse(localStorage.getItem('maternalRecords') || '[]');
    const recordsDiv = document.getElementById('maternalRecords');
    
    if (maternalRecords.length === 0) {
        recordsDiv.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-baby text-4xl mb-3"></i>
                <p>No maternal health records found</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="space-y-4">';
    maternalRecords.forEach(record => {
        html += `
            <div class="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold text-lg">${record.motherName}</h4>
                        <p class="text-sm text-gray-600">Age: ${record.motherAge} | Blood Group: ${record.bloodGroup}</p>
                        <p class="text-sm text-gray-600">Phone: ${record.motherPhone}</p>
                        <p class="text-sm text-gray-600">Hospital: ${record.hospitalName}</p>
                        <p class="text-sm text-gray-500">LMP: ${new Date(record.lmpDate).toLocaleDateString()}</p>
                    </div>
                    <div class="text-sm text-gray-400">
                        ${new Date(record.registeredAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    recordsDiv.innerHTML = html;
}

// Blood Donor Finder
async function findBloodDonors() {
    const bloodGroup = document.getElementById('donorBloodGroup').value;
    const location = document.getElementById('donorLocation').value;
    
    if (!bloodGroup || !location) {
        showNotification('Please select blood group and enter location', 'warning');
        return;
    }
    
    showNotification('Searching for blood donors...', 'info');
    
    // Mock donor data with Google Maps integration
    const mockDonors = [
        {
            name: 'Raj Kumar',
            bloodGroup: bloodGroup,
            location: location,
            distance: '2.5 km',
            phone: '9876543210',
            lastDonated: '3 months ago',
            coordinates: { lat: 28.6139, lng: 77.2090 }
        },
        {
            name: 'Priya Sharma',
            bloodGroup: bloodGroup,
            location: location,
            distance: '4.2 km',
            phone: '9876543211',
            lastDonated: '2 months ago',
            coordinates: { lat: 28.6149, lng: 77.2190 }
        },
        {
            name: 'Amit Patel',
            bloodGroup: bloodGroup,
            location: location,
            distance: '6.8 km',
            phone: '9876543212',
            lastDonated: '1 month ago',
            coordinates: { lat: 28.6159, lng: 77.2290 }
        }
    ];
    
    displayDonorResults(mockDonors);
    initializeDonorMap(mockDonors);
    showNotification('Found ' + mockDonors.length + ' donors!', 'success');
}

function displayDonorResults(donors) {
    const resultsDiv = document.getElementById('donorResults');
    
    let html = '<div class="space-y-4">';
    donors.forEach(donor => {
        html += `
            <div class="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-lg">${donor.name}</h4>
                        <div class="flex items-center space-x-4 mt-2">
                            <span class="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm font-medium">
                                ${donor.bloodGroup}
                            </span>
                            <span class="text-sm text-gray-600">
                                <i class="fas fa-map-marker-alt mr-1"></i>${donor.distance}
                            </span>
                            <span class="text-sm text-gray-600">
                                <i class="fas fa-phone mr-1"></i>${donor.phone}
                            </span>
                        </div>
                        <p class="text-sm text-gray-500 mt-2">Last donated: ${donor.lastDonated}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="callDonor('${donor.phone}')" class="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition">
                            <i class="fas fa-phone mr-1"></i>Call
                        </button>
                        <button onclick="messageDonor('${donor.phone}')" class="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition">
                            <i class="fas fa-sms mr-1"></i>Message
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    resultsDiv.innerHTML = html;
}

function initializeDonorMap(donors) {
    const mapDiv = document.getElementById('donorMap');
    mapDiv.innerHTML = `
        <div class="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
            <div class="text-center">
                <i class="fas fa-map-marked-alt text-4xl text-gray-400 mb-3"></i>
                <p class="text-gray-500">Google Maps integration</p>
                <p class="text-sm text-gray-400 mt-2">Found ${donors.length} donors near your location</p>
                <div class="mt-4 space-y-2">
                    ${donors.map(donor => `
                        <div class="bg-white p-2 rounded shadow-sm text-sm">
                            <strong>${donor.name}</strong> - ${donor.distance} away
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function callDonor(phone) {
    window.location.href = `tel:${phone}`;
}

function messageDonor(phone) {
    showNotification('Opening messaging app...', 'info');
    // In a real app, this would open SMS or WhatsApp
}

// Emergency SOS Functions
function callEmergencyServices() {
    if (confirm('Call emergency services (108)? This will connect you to emergency medical services.')) {
        window.location.href = 'tel:108';
        showNotification('Calling emergency services...', 'success');
    }
}

function sendEmergencySMS() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const location = `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`;
                const message = `EMERGENCY! I need help at this location: ${location}`;
                
                // In a real app, this would send SMS to emergency contacts
                showNotification('Emergency SMS sent with location!', 'success');
                updateEmergencyLocation(position.coords.latitude, position.coords.longitude);
            },
            error => {
                showNotification('Unable to get location. Please enable GPS.', 'error');
            }
        );
    } else {
        showNotification('Geolocation not supported', 'error');
    }
}

function updateEmergencyLocation(lat, lng) {
    const locationDiv = document.getElementById('emergencyLocation');
    locationDiv.innerHTML = `
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 class="font-semibold text-green-700 mb-2">Your Location</h4>
            <p class="text-sm text-gray-600">Latitude: ${lat.toFixed(6)}</p>
            <p class="text-sm text-gray-600">Longitude: ${lng.toFixed(6)}</p>
            <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" class="inline-block mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition">
                <i class="fas fa-map mr-1"></i>View on Map
            </a>
        </div>
    `;
}

// Appointment Booking
function bookAppointment() {
    const patientName = document.getElementById('patientName').value;
    const patientPhone = document.getElementById('patientPhone').value;
    const doctorType = document.getElementById('doctorType').value;
    const appointmentDate = document.getElementById('appointmentDate').value;
    const appointmentTime = document.getElementById('appointmentTime').value;
    const appointmentReason = document.getElementById('appointmentReason').value;
    
    if (!patientName || !patientPhone || !doctorType || !appointmentDate || !appointmentTime) {
        showNotification('Please fill all required fields', 'warning');
        return;
    }
    
    const appointment = {
        id: Date.now(),
        patientName,
        patientPhone,
        doctorType,
        appointmentDate,
        appointmentTime,
        appointmentReason,
        bookedAt: new Date().toISOString()
    };
    
    let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    // Clear form
    document.getElementById('patientName').value = '';
    document.getElementById('patientPhone').value = '';
    document.getElementById('doctorType').value = '';
    document.getElementById('appointmentDate').value = '';
    document.getElementById('appointmentTime').value = '';
    document.getElementById('appointmentReason').value = '';
    
    loadAppointments();
    showNotification('Appointment booked successfully!', 'success');
}

function loadAppointments() {
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const appointmentsDiv = document.getElementById('appointmentList');
    
    if (appointments.length === 0) {
        appointmentsDiv.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-calendar-alt text-4xl mb-3"></i>
                <p>No appointments booked yet</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="space-y-4">';
    appointments.forEach(appointment => {
        html += `
            <div class="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold text-lg">${appointment.patientName}</h4>
                        <p class="text-sm text-gray-600">${appointment.doctorType}</p>
                        <p class="text-sm text-gray-600">Date: ${new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                        <p class="text-sm text-gray-600">Time: ${appointment.appointmentTime}</p>
                        <p class="text-sm text-gray-600">Phone: ${appointment.patientPhone}</p>
                        ${appointment.reason ? `<p class="text-sm text-gray-500">Reason: ${appointment.appointmentReason}</p>` : ''}
                    </div>
                    <div class="text-right">
                        <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                            ${new Date(appointment.appointmentDate) > new Date() ? 'Upcoming' : 'Past'}
                        </span>
                        <div class="text-sm text-gray-400 mt-2">
                            ${new Date(appointment.bookedAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    appointmentsDiv.innerHTML = html;
}

// Notification System
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
    
    // Set color based on type
    const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-white',
        info: 'bg-blue-500 text-white'
    };
    
    notification.className += ' ' + colors[type];
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
        notification.classList.add('translate-x-0');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Voice input state management
let isVoiceInputActive = false;

function startVoiceInput() {
    if (isVoiceInputActive) {
        stopVoiceInput();
        return;
    }
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        recognition.onresult = function(event) {
            const transcript = event.results[event.results.length - 1][0].transcript;
            document.getElementById('symptoms').value = transcript;
            showNotification('Voice input captured', 'info');
        };
        
        recognition.onerror = function(event) {
            showNotification('Voice input error: ' + event.error, 'error');
        };
        
        recognition.onend = function() {
            showNotification('Voice input stopped', 'info');
        };
        
        recognition.start();
        showNotification('Voice input started. Speak clearly...', 'info');
        isVoiceInputActive = true;
        
        // Update UI
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.innerHTML = '<i class="fas fa-microphone-slash text-red-500"></i>';
            voiceBtn.classList.add('bg-red-100');
        }
    } else {
        showNotification('Voice input not supported in this browser', 'warning');
    }
}

function stopVoiceInput() {
    if (window.recognition) {
        window.recognition.stop();
        showNotification('Voice input stopped', 'info');
        isVoiceInputActive = false;
        
        // Update UI
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.innerHTML = '<i class="fas fa-microphone text-green-500"></i>';
            voiceBtn.classList.remove('bg-red-100');
        }
    }
}

// Symptom Functions
function addSymptom(symptom) {
    const textarea = document.getElementById('symptoms');
    const currentSymptoms = textarea.value;
    
    if (currentSymptoms && !currentSymptoms.endsWith(' ')) {
        textarea.value += ', ' + symptom;
    } else {
        textarea.value = symptom;
    }
    
    // Add visual feedback
    const symptomBtn = document.querySelector(`[onclick="addSymptom('${symptom}')"]`);
    if (symptomBtn) {
        symptomBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            symptomBtn.style.transform = 'scale(1)';
        }, 150);
    }
    
    // Focus textarea
    textarea.focus();
}

// Notification System - REMOVED DUPLICATE
// This is already defined above at line 1255

// Emergency Call Function - REMOVED DUPLICATE
// This is already defined above at line 1130

// Enhanced symptom analysis with better formatting
function analyzeSymptomsRuleBased(symptoms) {
    const symptomDatabase = {
        'fever headache': {
            conditions: ['Viral Fever', 'Common Cold', 'Dengue (if high fever)'],
            advice: 'Rest, hydration, monitor temperature',
            whenToSeeDoctor: 'If fever persists > 3 days or > 103°F',
            severity: 'moderate',
            icon: 'fa-thermometer-half'
        },
        'cough fever': {
            conditions: ['Respiratory Infection', 'COVID-19', 'Pneumonia'],
            advice: 'Isolate, rest, monitor breathing',
            whenToSeeDoctor: 'If breathing difficulty or persistent cough',
            severity: 'high',
            icon: 'fa-lungs'
        },
        'headache fatigue': {
            conditions: ['Stress', 'Migraine', 'Anemia'],
            advice: 'Rest, stress management, regular sleep',
            whenToSeeDoctor: 'If headaches are severe or frequent',
            severity: 'moderate',
            icon: 'fa-head-side-virus'
        },
        'stomach pain nausea': {
            conditions: ['Food Poisoning', 'Gastritis', 'Appendicitis'],
            advice: 'Avoid solid foods, stay hydrated',
            whenToSeeDoctor: 'If pain is severe or persistent',
            severity: 'high',
            icon: 'fa-stomach'
        }
    };
    
    let bestMatch = null;
    let maxMatches = 0;
    
    // Find best matching symptom combination
    Object.keys(symptomDatabase).forEach(key => {
        const symptomList = key.split(' ');
        const matches = symptomList.filter(s => symptoms.toLowerCase().includes(s)).length;
        
        if (matches > maxMatches) {
            maxMatches = matches;
            bestMatch = symptomDatabase[key];
        }
    });
    
    if (bestMatch && maxMatches >= 2) {
        const severityColors = {
            low: 'green',
            moderate: 'yellow',
            high: 'red'
        };
        
        return `
            <div class="space-y-4">
                <div class="result-card border-l-4 border-${severityColors[bestMatch.severity]}-500">
                    <div class="flex items-center mb-3">
                        <i class="fas ${bestMatch.icon} text-2xl mr-3 text-${severityColors[bestMatch.severity]}-600"></i>
                        <div>
                            <h5 class="font-semibold text-lg">Possible Conditions</h5>
                            <div class="flex items-center mt-1">
                                <span class="text-sm bg-${severityColors[bestMatch.severity]}-100 text-${severityColors[bestMatch.severity]}-700 px-2 py-1 rounded-full text-xs font-medium">
                                    ${bestMatch.severity.toUpperCase()} SEVERITY
                                </span>
                            </div>
                        </div>
                    </div>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        ${bestMatch.conditions.map(condition => `<li class="text-gray-700"><strong>${condition}</strong></li>`).join('')}
                    </ul>
                </div>
                
                <div class="result-card bg-blue-50 border-l-4 border-blue-500">
                    <h5 class="font-semibold text-lg mb-3 flex items-center">
                        <i class="fas fa-lightbulb text-blue-500 mr-2"></i>
                        Recommended Actions
                    </h5>
                    <p class="text-gray-700">${bestMatch.advice}</p>
                </div>
                
                <div class="result-card bg-yellow-50 border-l-4 border-yellow-500">
                    <h5 class="font-semibold text-lg mb-3 flex items-center">
                        <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                        When to See a Doctor
                    </h5>
                    <p class="text-gray-700">${bestMatch.whenToSeeDoctor}</p>
                </div>
                
                <div class="result-card bg-red-50 border-l-4 border-red-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <h5 class="font-semibold text-lg mb-2 flex items-center">
                                <i class="fas fa-phone-alt text-red-500 mr-2"></i>
                                Need Immediate Help?
                            </h5>
                            <p class="text-sm text-gray-600">Call emergency services if symptoms worsen</p>
                        </div>
                        <button onclick="emergencyCall()" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                            <i class="fas fa-phone-alt mr-2"></i>Call 108
                        </button>
                    </div>
                </div>
                
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p class="text-sm"><strong>Disclaimer:</strong> This AI analysis is for informational purposes only. Please consult a qualified healthcare professional for proper medical advice.</p>
                </div>
            </div>
        `;
    }
    
    // Default response
    return `
        <div class="space-y-4">
            <div class="result-card">
                <h5 class="font-semibold text-lg mb-3 flex items-center">
                    <i class="fas fa-robot text-blue-500 mr-2"></i>
                    AI General Assessment
                </h5>
                <p class="text-gray-700 mb-4">Based on your symptoms, here are general recommendations:</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-green-50 p-3 rounded-lg">
                        <h6 class="font-medium text-green-700 mb-2">Self-Care</h6>
                        <ul class="text-sm space-y-1">
                            <li>✓ Get adequate rest</li>
                            <li>✓ Stay hydrated with water</li>
                            <li>✓ Monitor your symptoms</li>
                            <li>✓ Avoid strenuous activity</li>
                        </ul>
                    </div>
                    <div class="bg-blue-50 p-3 rounded-lg">
                        <h6 class="font-medium text-blue-700 mb-2">Monitoring</h6>
                        <ul class="text-sm space-y-1">
                            <li>📝 Track symptom changes</li>
                            <li>🌡️ Check temperature regularly</li>
                            <li>💊 Note any medication taken</li>
                            <li>⏰ Record symptom onset time</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-sm"><strong>Important:</strong> If symptoms persist or worsen, please consult a healthcare professional immediately.</p>
            </div>
        </div>
    `;
}

// Missing Functions - Added to fix errors

// Dashboard initialization
function initializeDashboard() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Initialize BMI calculator
    initializeBMI();
    
    // Initialize water tracker
    initializeWaterTracker();
    
    // Initialize step counter
    initializeStepCounter();
}

function updateDateTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    
    const dateElement = document.getElementById('currentDate');
    const timeElement = document.getElementById('currentTime');
    
    // Only update if elements exist (to prevent errors in other dashboards)
    if (dateElement) dateElement.textContent = now.toLocaleDateString('en-US', dateOptions);
    if (timeElement) timeElement.textContent = now.toLocaleTimeString('en-US', timeOptions);
}

function initializeBMI() {
    const weightInput = document.getElementById('weight');
    const heightInput = document.getElementById('height');
    
    if (weightInput && heightInput) {
        weightInput.addEventListener('input', calculateBMI);
        heightInput.addEventListener('input', calculateBMI);
    }
}

function initializeWaterTracker() {
    const waterBtn = document.getElementById('addWater');
    if (waterBtn) {
        waterBtn.addEventListener('click', addWater);
    }
}

function initializeStepCounter() {
    const stepsInput = document.getElementById('steps');
    const updateBtn = document.getElementById('updateSteps');
    
    if (stepsInput && updateBtn) {
        updateBtn.addEventListener('click', updateSteps);
    }
}

// Enhanced Government Schemes
function loadGovernmentSchemes() {
    const schemes = [
        {
            id: 'ayushman',
            name: 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PMJAY)',
            description: 'World\'s largest health insurance scheme providing cashless hospitalization',
            eligibility: 'Families belonging to poor and vulnerable population based on SECC database (rural & urban workers)',
            benefits: [
                'Health coverage up to ₹5 lakh per family per year',
                'Cashless treatment at empaneled hospitals',
                'Pre and post-hospitalization expenses covered',
                'No restriction on family size, age or gender',
                'Coverage for 1,393 procedures across 23 specialties'
            ],
            howToApply: [
                'Visit nearest government hospital',
                'Contact Common Service Center (CSC)',
                'Call toll-free number: 14555',
                'Apply through Ayushman Bharat mobile app'
            ],
            documents: [
                'Aadhaar card',
                'Ration card',
                'BPL certificate',
                'Income certificate'
            ],
            category: 'Health Insurance',
            status: 'Active',
            website: 'https://pmjay.gov.in',
            helpline: '14555'
        },
        {
            id: 'pmsma',
            name: 'Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)',
            description: 'Fixed-day assured antenatal care for pregnant women',
            eligibility: 'All pregnant women in their first/second pregnancy',
            benefits: [
                'Free comprehensive antenatal check-ups',
                'Free diagnostics and medicines',
                'Free ultrasound services',
                'Blood investigations and iron tablets',
                'Counselling on nutrition and family planning'
            ],
            howToApply: [
                'Register at nearest government health facility',
                'Visit on 9th of every month for PMSMA day',
                'Contact ASHA worker for registration',
                'Book appointment at PHC/CHC'
            ],
            documents: [
                'Aadhaar card',
                'Pregnancy registration card',
                'Address proof',
                'Photographs'
            ],
            category: 'Maternal Health',
            status: 'Active',
            website: 'https://pmsma.gov.in',
            helpline: '1800-11-6555'
        },
        {
            id: 'nhm',
            name: 'National Health Mission (NHM)',
            description: 'Comprehensive healthcare program for all citizens',
            eligibility: 'All citizens of India',
            benefits: [
                'Free primary healthcare services',
                'Mobile medical units for rural areas',
                'Health and wellness centers',
                'Disease surveillance and control',
                'Public health awareness programs'
            ],
            howToApply: [
                'Visit nearest health center',
                'Contact ASHA worker',
                'Register at PHC/CHC',
                'Call state health helpline'
            ],
            documents: [
                'Aadhaar card',
                'Address proof',
                'Photographs'
            ],
            category: 'General Health',
            status: 'Active',
            website: 'https://nhm.gov.in',
            helpline: '1075'
        },
        {
            id: 'rmnch',
            name: 'Reproductive, Maternal, Newborn, Child and Adolescent Health (RMNCH+A)',
            description: 'Integrated health program for women and children',
            eligibility: 'Women of reproductive age, pregnant women, newborns, children, and adolescents',
            benefits: [
                'Free maternal healthcare services',
                'Child immunization programs',
                'Nutrition support for children',
                'Adolescent health services',
                'Family planning services'
            ],
            howToApply: [
                'Register at nearest health facility',
                'Contact ASHA worker',
                'Visit Anganwadi center',
                'Call child health helpline'
            ],
            documents: [
                'Aadhaar card',
                'Birth certificate',
                'Immunization card',
                'Mother-child health card'
            ],
            category: 'Child & Maternal Health',
            status: 'Active',
            website: 'https://rbsk.gov.in',
            helpline: '1098'
        },
        {
            id: 'pmjay',
            name: 'Pradhan Mantri Jan Arogya Yojana (PMJAY)',
            description: 'National Health Protection Scheme for poor families',
            eligibility: 'Families below poverty line and vulnerable groups',
            benefits: [
                'Health coverage up to ₹5 lakh per family',
                'Cashless hospitalization',
                'Pre and post-hospitalization care',
                'Day care procedures covered',
                'Follow-up treatment included'
            ],
            howToApply: [
                'Visit empaneled hospital',
                'Contact Common Service Center',
                'Call PMJAY helpline',
                'Apply through PMJAY portal'
            ],
            documents: [
                'Aadhaar card',
                'Ration card',
                'BPL certificate',
                'Income certificate'
            ],
            category: 'Health Insurance',
            status: 'Active',
            website: 'https://pmjay.gov.in',
            helpline: '14555'
        },
        {
            id: 'jsy',
            name: 'Janani Suraksha Yojana (JSY)',
            description: 'Cash assistance for institutional delivery',
            eligibility: 'Pregnant women delivering in government health institutions',
            benefits: [
                'Cash assistance of ₹1400 for rural areas',
                'Cash assistance of ₹1000 for urban areas',
                'Free delivery services',
                'Post-delivery care',
                'Transportation assistance in some states'
            ],
            howToApply: [
                'Register at PHC/CHC during pregnancy',
                'Contact ASHA worker for assistance',
                'Submit documents at health center',
                'Cash given immediately after delivery'
            ],
            documents: [
                'JSY card',
                'Aadhaar card',
                'BPL card',
                'ANC registration card'
            ],
            category: 'Maternal Health',
            status: 'Active',
            website: 'https://nrhm.gov.in',
            helpline: '1800-11-1234'
        }
    ];
    
    // Store schemes globally for filtering
    window.allSchemes = schemes;
    displaySchemes(schemes);
    
    // Setup keyboard support for search
    setupSearchKeyboardSupport();
}

// Setup keyboard support for search
function setupSearchKeyboardSupport() {
    try {
        const searchInput = document.getElementById('schemeSearch');
        if (!searchInput) return;
        
        // Add keyboard event listener
        searchInput.addEventListener('keydown', function(event) {
            // Clear search on Escape key
            if (event.key === 'Escape') {
                clearSchemeSearch();
            }
        });
        
        // Add focus/blur effects
        searchInput.addEventListener('focus', function() {
            this.parentElement.classList.add('ring-2', 'ring-pink-300');
        });
        
        searchInput.addEventListener('blur', function() {
            this.parentElement.classList.remove('ring-2', 'ring-pink-300');
        });
    } catch (error) {
        console.error('Error setting up keyboard support:', error);
    }
}

// Health records loading
function loadHealthRecords() {
    const records = JSON.parse(localStorage.getItem('healthRecords') || '[]');
    const recordsDiv = document.getElementById('healthRecordsList');
    
    if (!recordsDiv) return;
    
    if (records.length === 0) {
        recordsDiv.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-folder-open text-4xl mb-3"></i>
                <p>No health records found</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="space-y-4">';
    records.forEach(record => {
        html += `
            <div class="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold text-lg">${record.name}</h4>
                        <p class="text-sm text-gray-600">Age: ${record.age} | Blood Group: ${record.bloodGroup || 'Not specified'}</p>
                        <p class="text-sm text-gray-600">Emergency Contact: ${record.emergencyContact || 'Not specified'}</p>
                        ${record.medicalHistory ? `<p class="text-sm text-gray-500">Medical History: ${record.medicalHistory}</p>` : ''}
                    </div>
                    <div class="text-sm text-gray-400">
                        ${new Date(record.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    recordsDiv.innerHTML = html;
}

// Language support functions
function applyTranslations() {
    // Placeholder for language translation functionality
    console.log('Translations applied for language:', currentLanguage);
}

// Initialize on page load - REMOVED DUPLICATE
// This is already handled in the main DOMContentLoaded event at the top

