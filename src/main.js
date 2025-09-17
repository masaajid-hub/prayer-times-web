import { calculatePrayerTimes, CALCULATION_METHODS, suggestMethodForLocation, PrayerTimeCalculator } from '@masaajid/prayer-times';

// DOM Elements
const addressInput = document.getElementById('address');
const searchAddressBtn = document.getElementById('search-address');
const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');
const timezoneSelect = document.getElementById('timezone');
const calculationMethodSelect = document.getElementById('calculation-method');
const madhabSelect = document.getElementById('madhab');
const dateInput = document.getElementById('date');
const calculateBtn = document.getElementById('calculate');
const resultsSection = document.getElementById('results-section');
const errorSection = document.getElementById('error-section');
const prayerTimesDiv = document.getElementById('prayer-times');
const locationInfoDiv = document.getElementById('location-info');
const errorMessageDiv = document.getElementById('error-message');

// Tab elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const resultsLegend = document.getElementById('results-legend');
const weekCalendar = document.getElementById('week-calendar');
const monthCalendar = document.getElementById('month-calendar');
const yearOverview = document.getElementById('year-overview');

// Export elements
const copyResultsBtn = document.getElementById('copy-results');
const downloadCsvBtn = document.getElementById('download-csv');
const downloadCsvFullBtn = document.getElementById('download-csv-full');

// Store current results for export
let currentResults = null;
let currentConfig = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Populate timezone options
    populateTimezones();

    // Set default location (Kuala Lumpur)
    latitudeInput.value = '3.1390';
    longitudeInput.value = '101.6869';
    timezoneSelect.value = 'Asia/Kuala_Lumpur';

    // Add event listeners
    calculateBtn.addEventListener('click', handleCalculate);
    searchAddressBtn.addEventListener('click', handleAddressSearch);

    // Add tab event listeners
    tabButtons.forEach(button => {
        button.addEventListener('click', handleTabSwitch);
    });

    // Add export event listeners
    copyResultsBtn.addEventListener('click', handleCopyResults);
    downloadCsvBtn.addEventListener('click', handleDownloadCsv);
    downloadCsvFullBtn.addEventListener('click', handleDownloadCsvFull);

    // Allow Enter key to trigger search when in address field
    addressInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddressSearch();
        }
    });

    // Allow Enter key to trigger calculation when in other fields
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target !== addressInput) {
            handleCalculate();
        }
    });
}

function populateTimezones() {
    const commonTimezones = [
        'Asia/Kuala_Lumpur',
        'Asia/Jakarta',
        'Asia/Singapore',
        'Asia/Bangkok',
        'Asia/Dubai',
        'Asia/Riyadh',
        'Asia/Qatar',
        'Asia/Kuwait',
        'Asia/Karachi',
        'Asia/Dhaka',
        'Asia/Kolkata',
        'Asia/Tehran',
        'Asia/Istanbul',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'America/New_York',
        'America/Los_Angeles',
        'America/Chicago',
        'Australia/Sydney',
        'Australia/Melbourne',
    ];

    commonTimezones.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz;
        option.textContent = tz.replace('_', ' ');
        timezoneSelect.appendChild(option);
    });
}

async function handleAddressSearch() {
    const address = addressInput.value.trim();

    if (!address) {
        showError('Please enter an address or city name.');
        return;
    }

    searchAddressBtn.textContent = '🔍 Searching...';
    searchAddressBtn.disabled = true;

    try {
        hideError();
        const coordinates = await geocodeAddress(address);

        if (coordinates) {
            latitudeInput.value = coordinates.latitude.toFixed(6);
            longitudeInput.value = coordinates.longitude.toFixed(6);

            // Store the geocoded location name for display
            lastGeocodedLocation = coordinates.display_name;

            // Try to detect timezone based on coordinates
            const timezone = await detectTimezone(coordinates.latitude, coordinates.longitude);
            if (timezone) {
                timezoneSelect.value = timezone;
            }

            // Get recommended calculation method for this location
            const recommendation = suggestMethodForLocation({
                latitude: coordinates.latitude,
                longitude: coordinates.longitude
            });

            if (recommendation && recommendation.recommended) {
                const previousMethod = calculationMethodSelect.value;
                calculationMethodSelect.value = recommendation.recommended;

                // Show notification about method selection
                const locationName = coordinates.display_name.split(',')[0]; // Get city/area name
                showSuccess(
                    `Found: ${coordinates.display_name}<br>` +
                    `✨ Auto-selected <strong>${getMethodDisplayName(recommendation.recommended)}</strong> method (recommended for ${locationName})`
                );
            } else {
                showSuccess(`Found: ${coordinates.display_name}`);
            }
        } else {
            showError('Address not found. Please try a different location or enter coordinates manually.');
        }
    } catch (error) {
        showError(`Geocoding failed: ${error.message}. Please try entering coordinates manually.`);
    } finally {
        searchAddressBtn.textContent = '🔍 Search';
        searchAddressBtn.disabled = false;
    }
}

async function geocodeAddress(address) {
    try {
        // Use Nominatim (OpenStreetMap) geocoding service - free and no API key required
        const encodedAddress = encodeURIComponent(address);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'PrayerTimesCalculator/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            return {
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
                display_name: result.display_name
            };
        }

        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
}

function getMethodDisplayName(methodCode) {
    const methodNames = {
        'MWL': 'Muslim World League',
        'ISNA': 'Islamic Society of North America',
        'Egypt': 'Egyptian General Authority',
        'Karachi': 'University of Islamic Sciences, Karachi',
        'UmmAlQura': 'Umm Al-Qura University, Makkah',
        'Dubai': 'Dubai',
        'Moonsighting': 'Moonsighting Committee',
        'Qatar': 'Qatar',
        'Singapore': 'Singapore',
        'JAKIM': 'Jabatan Kemajuan Islam Malaysia',
        'Kemenag': 'Kementerian Agama, Indonesia',
        'Tehran': 'Institute of Geophysics, University of Tehran',
        'Turkey': 'Turkey Diyanet',
        'France15': 'France (15°)',
        'Russia': 'Russia'
    };
    return methodNames[methodCode] || methodCode;
}

async function detectTimezone(latitude, longitude) {
    try {
        // Use a simple heuristic to detect common timezones based on coordinates
        // This is not perfect but covers most major cities
        const timezoneMap = [
            // Asia/Southeast Asia
            { bounds: { north: 7.5, south: 0.5, east: 119.5, west: 99.5 }, tz: 'Asia/Kuala_Lumpur' }, // Malaysia
            { bounds: { north: 6, south: -11, east: 141, west: 95 }, tz: 'Asia/Jakarta' }, // Indonesia
            { bounds: { north: 1.5, south: 1.2, east: 104.1, west: 103.6 }, tz: 'Asia/Singapore' }, // Singapore
            { bounds: { north: 23.4, south: 5.6, east: 109.5, west: 92.3 }, tz: 'Asia/Bangkok' }, // Thailand

            // Middle East
            { bounds: { north: 42.5, south: 35.5, east: 45, west: 25.5 }, tz: 'Asia/Istanbul' }, // Turkey
            { bounds: { north: 32.5, south: 16, east: 50.5, west: 34.5 }, tz: 'Asia/Riyadh' }, // Saudi Arabia
            { bounds: { north: 26.5, south: 22.5, east: 56.5, west: 51 }, tz: 'Asia/Dubai' }, // UAE
            { bounds: { north: 26.2, south: 24.5, east: 51.7, west: 50.7 }, tz: 'Asia/Qatar' }, // Qatar
            { bounds: { north: 40, south: 25, east: 63.5, west: 44 }, tz: 'Asia/Tehran' }, // Iran

            // South Asia
            { bounds: { north: 37, south: 5, east: 97, west: 60 }, tz: 'Asia/Karachi' }, // Pakistan
            { bounds: { north: 35.7, south: 6.4, east: 97.25, west: 68.1 }, tz: 'Asia/Kolkata' }, // India
            { bounds: { north: 26.8, south: 20.7, east: 92.7, west: 88 }, tz: 'Asia/Dhaka' }, // Bangladesh

            // North America
            { bounds: { north: 49.4, south: 24.4, east: -66.9, west: -125 }, tz: 'America/New_York' }, // Eastern US
            { bounds: { north: 49.4, south: 24.4, east: -87, west: -125 }, tz: 'America/Chicago' }, // Central US
            { bounds: { north: 49.4, south: 24.4, east: -104, west: -125 }, tz: 'America/Denver' }, // Mountain US
            { bounds: { north: 49.4, south: 24.4, east: -125, west: -180 }, tz: 'America/Los_Angeles' }, // Pacific US

            // Europe
            { bounds: { north: 51.5, south: 41.5, east: 9.5, west: -5 }, tz: 'Europe/London' }, // UK
            { bounds: { north: 55.1, south: 47.3, east: 15.0, west: 5.9 }, tz: 'Europe/Berlin' }, // Germany
            { bounds: { north: 51.1, south: 41.3, east: 9.6, west: -4.8 }, tz: 'Europe/Paris' }, // France
        ];

        for (const region of timezoneMap) {
            if (latitude >= region.bounds.south &&
                latitude <= region.bounds.north &&
                longitude >= region.bounds.west &&
                longitude <= region.bounds.east) {
                return region.tz;
            }
        }

        return null;
    } catch (error) {
        console.error('Timezone detection error:', error);
        return null;
    }
}

// Global variables for current calculation config
let currentCalcConfig = null;

function handleTabSwitch(event) {
    const targetTab = event.target.dataset.tab;

    // Update tab buttons
    tabButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(`tab-${targetTab}`).classList.add('active');

    // Show/hide full CSV button only for year tab
    if (targetTab === 'year') {
        downloadCsvFullBtn.style.display = 'flex';
    } else {
        downloadCsvFullBtn.style.display = 'none';
    }

    // If we have a current calculation config, recalculate for the new tab
    if (currentCalcConfig) {
        updateLegend(targetTab, currentCalcConfig);
        calculateForTab(targetTab, currentCalcConfig);
    }
}

async function calculateForTab(tabType, config) {
    try {
        switch (tabType) {
            case 'single':
                // Already calculated in the main calculation
                break;
            case 'week':
                await calculateWeekView(config);
                break;
            case 'month':
                await calculateMonthView(config);
                break;
            case 'year':
                await calculateYearView(config);
                break;
        }
    } catch (error) {
        console.error(`Error calculating ${tabType} view:`, error);
        showError(`Failed to calculate ${tabType} view: ${error.message}`);
    }
}

async function calculateWeekView(config) {
    const calculator = new PrayerTimeCalculator(config);
    const startDate = new Date(config.date);
    const weekDays = [];

    // Generate 7 days starting from the selected date
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        const times = calculator.calculate(date);
        const isToday = isDateToday(date);

        weekDays.push({
            date,
            times,
            isToday,
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
            dateStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
    }

    displayWeekView(weekDays);
}

async function calculateMonthView(config) {
    const calculator = new PrayerTimeCalculator(config);
    const date = new Date(config.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const monthData = calculator.calculateForMonth(year, month);
    displayMonthView(monthData, year, month);
}

async function calculateYearView(config) {
    const calculator = new PrayerTimeCalculator(config);
    const year = new Date(config.date).getFullYear();
    const yearData = [];

    // Calculate each month
    for (let month = 1; month <= 12; month++) {
        const monthData = calculator.calculateForMonth(year, month);
        yearData.push({
            month,
            monthName: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' }),
            times: monthData.times
        });
    }

    displayYearView(yearData, year);
}

function displayWeekView(weekDays) {
    weekCalendar.innerHTML = weekDays.map(day => `
        <div class="day-card ${day.isToday ? 'today' : ''}">
            <div class="day-header">${day.dayName}</div>
            <div class="day-date">${day.dateStr}</div>
            <div class="day-times">
                <div class="time-row">
                    <span class="time-name">Fajr</span>
                    <span class="time-value">${formatTime(day.times.fajr)}</span>
                </div>
                <div class="time-row">
                    <span class="time-name">Dhuhr</span>
                    <span class="time-value">${formatTime(day.times.dhuhr)}</span>
                </div>
                <div class="time-row">
                    <span class="time-name">Asr</span>
                    <span class="time-value">${formatTime(day.times.asr)}</span>
                </div>
                <div class="time-row">
                    <span class="time-name">Maghrib</span>
                    <span class="time-value">${formatTime(day.times.maghrib)}</span>
                </div>
                <div class="time-row">
                    <span class="time-name">Isha</span>
                    <span class="time-value">${formatTime(day.times.isha)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function displayMonthView(monthData, year, month) {
    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    monthCalendar.innerHTML = `
        <h3 style="text-align: center; margin-bottom: 1rem; color: var(--primary-color)">${monthName}</h3>
        <table class="month-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Fajr</th>
                    <th>Dhuhr</th>
                    <th>Asr</th>
                    <th>Maghrib</th>
                    <th>Isha</th>
                </tr>
            </thead>
            <tbody>
                ${monthData.times.map((times, index) => {
                    const date = new Date(year, month - 1, index + 1);
                    const isToday = isDateToday(date);
                    return `
                        <tr class="${isToday ? 'today-row' : ''}">
                            <td class="date-cell">${index + 1}</td>
                            <td>${formatTime(times.fajr)}</td>
                            <td>${formatTime(times.dhuhr)}</td>
                            <td>${formatTime(times.asr)}</td>
                            <td>${formatTime(times.maghrib)}</td>
                            <td>${formatTime(times.isha)}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function displayYearView(yearData, year) {
    yearOverview.innerHTML = `
        <h3 style="text-align: center; margin-bottom: 2rem; color: var(--primary-color); grid-column: 1/-1;">${year} Prayer Times Overview</h3>
        ${yearData.map(month => {
            const firstDay = month.times[0];
            const lastDay = month.times[month.times.length - 1];
            return `
                <div class="month-section">
                    <div class="month-title">${month.monthName}</div>
                    <div class="month-summary">
                        <div class="prayer-column">
                            <div class="prayer-header">Fajr</div>
                            <div class="time-range">
                                ${formatTime(firstDay.fajr)}<br>
                                to<br>
                                ${formatTime(lastDay.fajr)}
                            </div>
                        </div>
                        <div class="prayer-column">
                            <div class="prayer-header">Dhuhr</div>
                            <div class="time-range">
                                ${formatTime(firstDay.dhuhr)}<br>
                                to<br>
                                ${formatTime(lastDay.dhuhr)}
                            </div>
                        </div>
                        <div class="prayer-column">
                            <div class="prayer-header">Asr</div>
                            <div class="time-range">
                                ${formatTime(firstDay.asr)}<br>
                                to<br>
                                ${formatTime(lastDay.asr)}
                            </div>
                        </div>
                        <div class="prayer-column">
                            <div class="prayer-header">Maghrib</div>
                            <div class="time-range">
                                ${formatTime(firstDay.maghrib)}<br>
                                to<br>
                                ${formatTime(lastDay.maghrib)}
                            </div>
                        </div>
                        <div class="prayer-column">
                            <div class="prayer-header">Isha</div>
                            <div class="time-range">
                                ${formatTime(firstDay.isha)}<br>
                                to<br>
                                ${formatTime(lastDay.isha)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

function isDateToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function updateLegend(tabType, config) {
    const locationName = getLocationDisplayName(config.location);
    const methodName = getMethodDisplayName(config.method);
    let dateInfo = '';

    switch (tabType) {
        case 'single':
            dateInfo = config.date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            break;
        case 'week':
            const weekStart = new Date(config.date);
            const weekEnd = new Date(config.date);
            weekEnd.setDate(weekStart.getDate() + 6);
            dateInfo = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            break;
        case 'month':
            dateInfo = config.date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
            });
            break;
        case 'year':
            dateInfo = config.date.getFullYear().toString();
            break;
    }

    resultsLegend.innerHTML = `
        <div class="legend-location">${locationName}</div>
        <div class="legend-date">${dateInfo}</div>
        <div class="legend-method">Using ${methodName} calculation method</div>
    `;
}

function getLocationDisplayName(location) {
    // Use the geocoded location name if available
    if (lastGeocodedLocation) {
        return lastGeocodedLocation.toUpperCase();
    }

    // Fallback to formatted coordinates
    const lat = location.latitude.toFixed(4);
    const lng = location.longitude.toFixed(4);
    return `${lat}°, ${lng}°`;
}

// Store the last geocoded location name for display
let lastGeocodedLocation = null;

async function handleCalculate() {
    try {
        hideError();
        hideResults();

        // Validate inputs
        const latitude = parseFloat(latitudeInput.value);
        const longitude = parseFloat(longitudeInput.value);
        const date = new Date(dateInput.value);
        const timezone = timezoneSelect.value || undefined;

        if (isNaN(latitude) || isNaN(longitude)) {
            throw new Error('Please enter valid latitude and longitude values.');
        }

        if (latitude < -90 || latitude > 90) {
            throw new Error('Latitude must be between -90 and 90 degrees.');
        }

        if (longitude < -180 || longitude > 180) {
            throw new Error('Longitude must be between -180 and 180 degrees.');
        }

        if (isNaN(date.getTime())) {
            throw new Error('Please enter a valid date.');
        }

        // Get calculation settings
        const method = calculationMethodSelect.value;
        const asrSchool = madhabSelect.value === 'Hanafi' ? 'Hanafi' : 'Standard';

        // Store current calculation config for tab switching
        currentCalcConfig = {
            method,
            location: { latitude, longitude },
            date,
            asrSchool,
            timezone
        };

        calculateBtn.textContent = '🕰️ Calculating...';
        calculateBtn.disabled = true;

        // Calculate prayer times
        const prayerTimes = calculatePrayerTimes(currentCalcConfig);

        // Store results for export
        currentResults = prayerTimes;
        currentConfig = { ...currentCalcConfig, location: { latitude, longitude, date, timezone } };

        // Update legend for the current tab (initially "single")
        const activeTab = document.querySelector('.tab-button.active').dataset.tab;
        updateLegend(activeTab, currentCalcConfig);

        displayResults(prayerTimes, { latitude, longitude, date, timezone });

    } catch (error) {
        showError(error.message);
    } finally {
        calculateBtn.textContent = '🕰️ Calculate Prayer Times';
        calculateBtn.disabled = false;
    }
}

function displayResults(prayerTimes, location) {
    // Display prayer times
    const prayers = [
        { name: 'Fajr', time: prayerTimes.fajr, icon: '🌅' },
        { name: 'Sunrise', time: prayerTimes.sunrise, icon: '☀️' },
        { name: 'Dhuhr', time: prayerTimes.dhuhr, icon: '🌞' },
        { name: 'Asr', time: prayerTimes.asr, icon: '🌇' },
        { name: 'Maghrib', time: prayerTimes.maghrib, icon: '🌆' },
        { name: 'Isha', time: prayerTimes.isha, icon: '🌙' }
    ];

    prayerTimesDiv.innerHTML = prayers.map(prayer => `
        <div class="prayer-time-card">
            <div class="prayer-icon">${prayer.icon}</div>
            <div class="prayer-name">${prayer.name}</div>
            <div class="prayer-time">${formatTime(prayer.time)}</div>
        </div>
    `).join('');

    // Display location info
    locationInfoDiv.innerHTML = `
        <div class="location-details">
            <h3>📍 Location Details</h3>
            <p><strong>Coordinates:</strong> ${location.latitude.toFixed(6)}°, ${location.longitude.toFixed(6)}°</p>
            <p><strong>Date:</strong> ${location.date.toLocaleDateString()}</p>
            <p><strong>Timezone:</strong> ${location.timezone || 'Auto-detected'}</p>
            <p><strong>Method:</strong> ${calculationMethodSelect.options[calculationMethodSelect.selectedIndex].text}</p>
            <p><strong>Madhab:</strong> ${madhabSelect.options[madhabSelect.selectedIndex].text}</p>
        </div>
    `;

    showResults();
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function showResults() {
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function hideResults() {
    resultsSection.style.display = 'none';
}

function showError(message) {
    errorMessageDiv.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <span class="error-text">${message}</span>
        </div>
    `;
    errorSection.style.display = 'block';
    errorSection.scrollIntoView({ behavior: 'smooth' });
}

function hideError() {
    errorSection.style.display = 'none';
}

// Export Functions
async function handleCopyResults() {
    if (!currentResults || !currentConfig) {
        showError('No prayer times to copy. Please calculate prayer times first.');
        return;
    }

    try {
        const activeTab = document.querySelector('.tab-button.active').dataset.tab;
        const textContent = generateTextExport(activeTab);

        await navigator.clipboard.writeText(textContent);
        showSuccess('Prayer times copied to clipboard!');
    } catch (error) {
        console.error('Copy error:', error);
        showError(`Failed to copy to clipboard: ${error.message}`);
    }
}

function handleDownloadCsv() {
    if (!currentResults || !currentConfig) {
        showError('No prayer times to download. Please calculate prayer times first.');
        return;
    }

    try {
        const activeTab = document.querySelector('.tab-button.active').dataset.tab;
        const csvContent = generateCsvExport(activeTab);

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', generateFilename(activeTab));
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showSuccess('Prayer times CSV downloaded!');
    } catch (error) {
        console.error('Download error:', error);
        showError(`Failed to download CSV: ${error.message}`);
    }
}

function handleDownloadCsvFull() {
    if (!currentResults || !currentConfig) {
        showError('No prayer times to download. Please calculate prayer times first.');
        return;
    }

    try {
        const csvContent = generateFullYearCsv();

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', generateFullYearFilename());
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showSuccess('Full year CSV downloaded!');
    } catch (error) {
        console.error('Full CSV download error:', error);
        showError(`Failed to download full CSV: ${error.message}`);
    }
}

function generateTextExport(tabType) {
    console.log('generateTextExport called with tabType:', tabType);
    console.log('currentConfig:', currentConfig);
    console.log('currentResults:', currentResults);

    try {
        const locationName = getLocationDisplayName(currentConfig.location);
        const methodName = getMethodDisplayName(currentConfig.method);
        let content = '';

        // Header
        content += `Prayer Times - ${locationName}\n`;
        content += `Calculation Method: ${methodName}\n`;
        content += `Generated: ${new Date().toLocaleString()}\n`;
        content += '=' .repeat(50) + '\n\n';

        console.log('About to enter switch statement with tabType:', tabType);

        switch (tabType) {
            case 'single':
                console.log('Calling generateSingleDayText');
                content += generateSingleDayText();
                break;
            case 'week':
                console.log('Calling generateWeekText');
                content += generateWeekText();
                break;
            case 'month':
                console.log('Calling generateMonthText');
                content += generateMonthText();
                break;
            case 'year':
                console.log('Calling generateYearText');
                content += generateYearText();
                break;
            default:
                console.error('Unknown tabType:', tabType);
                throw new Error(`Unknown tab type: ${tabType}`);
        }

        console.log('generateTextExport completed successfully');
        return content;
    } catch (error) {
        console.error('generateTextExport error:', error);
        throw error;
    }
}

function generateSingleDayText() {
    const date = currentConfig.date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let content = `Date: ${date}\n\n`;

    const prayers = [
        { name: 'Fajr', time: currentResults.fajr },
        { name: 'Sunrise', time: currentResults.sunrise },
        { name: 'Dhuhr', time: currentResults.dhuhr },
        { name: 'Asr', time: currentResults.asr },
        { name: 'Maghrib', time: currentResults.maghrib },
        { name: 'Isha', time: currentResults.isha }
    ];

    prayers.forEach(prayer => {
        content += `${prayer.name.padEnd(10)} ${formatTime(prayer.time)}\n`;
    });

    return content;
}

function generateWeekText() {
    try {
        const calculator = new PrayerTimeCalculator(currentConfig);
        const startDate = new Date(currentConfig.date);
        const weekDays = [];

        console.log('Week export - Config:', currentConfig);
        console.log('Week export - Start date:', startDate);

        // Generate 7 days starting from the selected date
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            console.log(`Week export - Day ${i}: Date object:`, date);
            const times = calculator.calculate(date);
            console.log(`Week export - Day ${i}: Times result:`, times);

            if (!times) {
                console.error(`Week export - Day ${i}: No times returned for date:`, date);
                continue; // Skip this day if no times returned
            }

            weekDays.push({
                date,
                times
            });
        }

        let content = `Week of ${currentConfig.date.toLocaleDateString()}\n\n`;

        weekDays.forEach(day => {
            const dateStr = day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
            content += `${dateStr.padEnd(12)}`;
            content += `Fajr: ${formatTime(day.times.fajr).padEnd(8)} `;
            content += `Dhuhr: ${formatTime(day.times.dhuhr).padEnd(8)} `;
            content += `Asr: ${formatTime(day.times.asr).padEnd(8)} `;
            content += `Maghrib: ${formatTime(day.times.maghrib).padEnd(8)} `;
            content += `Isha: ${formatTime(day.times.isha)}\n`;
        });

        return content;
    } catch (error) {
        console.error('Week text export error:', error);
        throw error;
    }
}

function generateMonthText() {
    try {
        const calculator = new PrayerTimeCalculator(currentConfig);
        const date = new Date(currentConfig.date);
        const year = date.getFullYear();
        const month = date.getMonth();

        console.log('Month export - Config:', currentConfig);
        console.log('Month export - Year:', year, 'Month:', month + 1);

        let content = `Month of ${currentConfig.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}\n\n`;

        // Get the number of days in the month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        console.log('Month export - Days in month:', daysInMonth);

        // Calculate each day individually
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            console.log(`Month export - Day ${day}: Date object:`, dayDate);

            const times = calculator.calculate(dayDate);
            console.log(`Month export - Day ${day}: Times result:`, times);

            if (!times) {
                console.error(`Month export - Day ${day}: No times returned for date:`, dayDate);
                continue; // Skip this day if no times returned
            }

            const dateStr = dayDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
            content += `${dateStr.padEnd(8)}`;
            content += `Fajr: ${formatTime(times.fajr).padEnd(8)} `;
            content += `Dhuhr: ${formatTime(times.dhuhr).padEnd(8)} `;
            content += `Asr: ${formatTime(times.asr).padEnd(8)} `;
            content += `Maghrib: ${formatTime(times.maghrib).padEnd(8)} `;
            content += `Isha: ${formatTime(times.isha)}\n`;
        }

        return content;
    } catch (error) {
        console.error('Month text export error:', error);
        throw error;
    }
}

function generateYearText() {
    try {
        const calculator = new PrayerTimeCalculator(currentConfig);
        const year = currentConfig.date.getFullYear();
        let content = `Year ${year} Prayer Time Ranges\n\n`;

        console.log('Year export - Year:', year);

        for (let month = 1; month <= 12; month++) {
            const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' });
            console.log(`Year export - Processing month ${month}: ${monthName}`);

            // Get first and last day of the month using individual calculations
            const firstDate = new Date(year, month - 1, 1);
            const lastDate = new Date(year, month, 0); // Last day of the month

            console.log(`Year export - ${monthName} dates:`, firstDate, 'to', lastDate);

            const firstTimes = calculator.calculate(firstDate);
            const lastTimes = calculator.calculate(lastDate);

            if (!firstTimes || !lastTimes) {
                console.error(`Year export - Missing times for ${monthName}:`, { firstTimes, lastTimes });
                continue; // Skip this month if calculation failed
            }

            content += `${monthName}:\n`;
            content += `  Fajr: ${formatTime(firstTimes.fajr)} - ${formatTime(lastTimes.fajr)}\n`;
            content += `  Dhuhr: ${formatTime(firstTimes.dhuhr)} - ${formatTime(lastTimes.dhuhr)}\n`;
            content += `  Asr: ${formatTime(firstTimes.asr)} - ${formatTime(lastTimes.asr)}\n`;
            content += `  Maghrib: ${formatTime(firstTimes.maghrib)} - ${formatTime(lastTimes.maghrib)}\n`;
            content += `  Isha: ${formatTime(firstTimes.isha)} - ${formatTime(lastTimes.isha)}\n\n`;
        }

        return content;
    } catch (error) {
        console.error('Year text export error:', error);
        throw error;
    }
}

function generateCsvExport(tabType) {
    const locationName = getLocationDisplayName(currentConfig.location);
    const methodName = getMethodDisplayName(currentConfig.method);
    const { latitude, longitude } = currentConfig.location;

    let csvContent = `# Prayer Times,${locationName}\n`;
    csvContent += `# Latitude,${latitude.toFixed(6)}\n`;
    csvContent += `# Longitude,${longitude.toFixed(6)}\n`;
    csvContent += `# Calculation Method,${methodName}\n`;
    csvContent += `# Generated,${new Date().toLocaleString()}\n\n`;

    switch (tabType) {
        case 'single':
            csvContent += generateSingleDayCSV();
            break;
        case 'week':
            csvContent += generateWeekCSV();
            break;
        case 'month':
            csvContent += generateMonthCSV();
            break;
        case 'year':
            csvContent += generateYearCSV();
            break;
    }

    return csvContent;
}

function generateSingleDayCSV() {
    // Format date in local timezone instead of UTC
    const configDate = currentConfig.date;
    const dateStr = `${configDate.getFullYear()}-${String(configDate.getMonth() + 1).padStart(2, '0')}-${String(configDate.getDate()).padStart(2, '0')}`;
    let csv = 'Date,Prayer,Time\n';

    const prayers = [
        { name: 'Fajr', time: currentResults.fajr },
        { name: 'Sunrise', time: currentResults.sunrise },
        { name: 'Dhuhr', time: currentResults.dhuhr },
        { name: 'Asr', time: currentResults.asr },
        { name: 'Maghrib', time: currentResults.maghrib },
        { name: 'Isha', time: currentResults.isha }
    ];

    prayers.forEach(prayer => {
        csv += `${dateStr},${prayer.name},${formatTime(prayer.time)}\n`;
    });

    return csv;
}

function generateWeekCSV() {
    try {
        const calculator = new PrayerTimeCalculator(currentConfig);
        const startDate = new Date(currentConfig.date);
        const weekDays = [];

        console.log('Week CSV export - Config:', currentConfig);
        console.log('Week CSV export - Start date:', startDate);

        // Generate 7 days starting from the selected date
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            console.log(`Week CSV export - Day ${i}: Date object:`, date);
            const times = calculator.calculate(date);
            console.log(`Week CSV export - Day ${i}: Times result:`, times);

            if (!times) {
                console.error(`Week CSV export - Day ${i}: No times returned for date:`, date);
                continue; // Skip this day if no times returned
            }

            weekDays.push({
                date,
                times
            });
        }

        let csv = 'Date,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Isha\n';

        weekDays.forEach(day => {
            // Format date in local timezone instead of UTC
            const dateStr = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`;
            csv += `${dateStr},`;
            csv += `${formatTime(day.times.fajr)},`;
            csv += `${formatTime(day.times.sunrise)},`;
            csv += `${formatTime(day.times.dhuhr)},`;
            csv += `${formatTime(day.times.asr)},`;
            csv += `${formatTime(day.times.maghrib)},`;
            csv += `${formatTime(day.times.isha)}\n`;
        });

        return csv;
    } catch (error) {
        console.error('Week CSV export error:', error);
        throw error;
    }
}

function generateMonthCSV() {
    try {
        const calculator = new PrayerTimeCalculator(currentConfig);
        const date = new Date(currentConfig.date);
        const year = date.getFullYear();
        const month = date.getMonth();

        console.log('Month CSV export - Config:', currentConfig);
        console.log('Month CSV export - Year:', year, 'Month:', month + 1);

        let csv = 'Date,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Isha\n';

        // Get the number of days in the month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        console.log('Month CSV export - Days in month:', daysInMonth);

        // Calculate each day individually
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            console.log(`Month CSV export - Day ${day}: Date object:`, dayDate);

            const times = calculator.calculate(dayDate);
            console.log(`Month CSV export - Day ${day}: Times result:`, times);

            if (!times) {
                console.error(`Month CSV export - Day ${day}: No times returned for date:`, dayDate);
                continue; // Skip this day if no times returned
            }

            // Format date in local timezone instead of UTC
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            csv += `${dateStr},`;
            csv += `${formatTime(times.fajr)},`;
            csv += `${formatTime(times.sunrise)},`;
            csv += `${formatTime(times.dhuhr)},`;
            csv += `${formatTime(times.asr)},`;
            csv += `${formatTime(times.maghrib)},`;
            csv += `${formatTime(times.isha)}\n`;
        }

        return csv;
    } catch (error) {
        console.error('Month CSV export error:', error);
        throw error;
    }
}

function generateYearCSV() {
    try {
        const calculator = new PrayerTimeCalculator(currentConfig);
        const year = currentConfig.date.getFullYear();
        let csv = 'Month,Prayer,Earliest Time,Latest Time\n';

        console.log('Year CSV export - Year:', year);

        for (let month = 1; month <= 12; month++) {
            const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' });
            console.log(`Year CSV export - Processing month ${month}: ${monthName}`);

            // Get first and last day of the month using individual calculations
            const firstDate = new Date(year, month - 1, 1);
            const lastDate = new Date(year, month, 0); // Last day of the month

            console.log(`Year CSV export - ${monthName} dates:`, firstDate, 'to', lastDate);

            const firstTimes = calculator.calculate(firstDate);
            const lastTimes = calculator.calculate(lastDate);

            if (!firstTimes || !lastTimes) {
                console.error(`Year CSV export - Missing times for ${monthName}:`, { firstTimes, lastTimes });
                continue; // Skip this month if calculation failed
            }

            const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
            const prayerKeys = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

            prayers.forEach((prayer, index) => {
                const key = prayerKeys[index];
                csv += `${monthName},${prayer},${formatTime(firstTimes[key])},${formatTime(lastTimes[key])}\n`;
            });
        }

        return csv;
    } catch (error) {
        console.error('Year CSV export error:', error);
        throw error;
    }
}

function generateFilename(tabType) {
    const date = currentConfig.date;
    const locationName = getLocationDisplayName(currentConfig.location).replace(/[^a-zA-Z0-9]/g, '_');

    switch (tabType) {
        case 'single':
            return `prayer_times_${locationName}_${date.toISOString().split('T')[0]}.csv`;
        case 'week':
            return `prayer_times_week_${locationName}_${date.toISOString().split('T')[0]}.csv`;
        case 'month':
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return `prayer_times_month_${locationName}_${monthYear}.csv`;
        case 'year':
            return `prayer_times_year_summary_${locationName}_${date.getFullYear()}.csv`;
        default:
            return `prayer_times_${locationName}.csv`;
    }
}

function generateFullYearFilename() {
    const date = currentConfig.date;
    const locationName = getLocationDisplayName(currentConfig.location).replace(/[^a-zA-Z0-9]/g, '_');
    return `prayer_times_year_full_${locationName}_${date.getFullYear()}.csv`;
}

function generateFullYearCsv() {
    try {
        const calculator = new PrayerTimeCalculator(currentConfig);
        const year = currentConfig.date.getFullYear();
        const locationName = getLocationDisplayName(currentConfig.location);
        const methodName = getMethodDisplayName(currentConfig.method);
        const { latitude, longitude } = currentConfig.location;

        console.log('Full year CSV export - Year:', year);

        // CSV header with metadata
        let csvContent = `# Prayer Times Full Year,${locationName}\n`;
        csvContent += `# Latitude,${latitude.toFixed(6)}\n`;
        csvContent += `# Longitude,${longitude.toFixed(6)}\n`;
        csvContent += `# Calculation Method,${methodName}\n`;
        csvContent += `# Year,${year}\n`;
        csvContent += `# Generated,${new Date().toLocaleString()}\n\n`;

        // Data header
        csvContent += 'Date,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Isha\n';

        // Calculate every day of the year
        for (let month = 1; month <= 12; month++) {
            const daysInMonth = new Date(year, month, 0).getDate();
            console.log(`Full year CSV - Processing ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' })}: ${daysInMonth} days`);

            for (let day = 1; day <= daysInMonth; day++) {
                const dayDate = new Date(year, month - 1, day);
                const times = calculator.calculate(dayDate);

                if (!times) {
                    console.error(`Full year CSV - Missing times for ${dayDate.toDateString()}`);
                    continue; // Skip this day if calculation failed
                }

                // Format date in local timezone
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                csvContent += `${dateStr},`;
                csvContent += `${formatTime(times.fajr)},`;
                csvContent += `${formatTime(times.sunrise)},`;
                csvContent += `${formatTime(times.dhuhr)},`;
                csvContent += `${formatTime(times.asr)},`;
                csvContent += `${formatTime(times.maghrib)},`;
                csvContent += `${formatTime(times.isha)}\n`;
            }
        }

        console.log('Full year CSV export completed');
        return csvContent;
    } catch (error) {
        console.error('Full year CSV export error:', error);
        throw error;
    }
}

function showSuccess(message) {
    // Create temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <span class="success-icon">✅</span>
        <span class="success-text">${message}</span>
    `;

    document.body.appendChild(successDiv);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}