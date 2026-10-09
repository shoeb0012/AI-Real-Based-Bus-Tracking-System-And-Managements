/**
 * AI BUS TRACK - STATION PASSENGER INFORMATION DISPLAY (PIS) & KIOSK SCRIPT
 * High-performance terminal departures display, 5 KM geofence proximity radar,
 * and Phone-less Touchscreen Self-Service Ticket Booking.
 */

(() => {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. TERMINALS & STATION SCHEDULE DATABASE
  // --------------------------------------------------------------------------
  const TERMINALS = {
    'delhi-01': {
      id: 'delhi-01',
      name: 'Delhi · Kashmere Gate ISBT (Terminal 1)',
      short: 'Delhi (Kashmere Gate)',
      code: 'DEL-KG',
      destinations: ['Lucknow', 'Jaipur', 'Agra', 'Chandigarh', 'Dehradun', 'Varanasi', 'Haridwar'],
      schedules: [
        {
          busNo: 'UP32 AB 1234',
          operator: 'AI Fleet Select',
          type: 'Volvo AC Sleeper Multi-Axle',
          route: 'Delhi ➔ Lucknow',
          via: 'via Yamuna & Agra Expressway',
          bay: 'BAY 04',
          stationArrival: '08:35 PM',
          stationEtaMin: 7,
          destArrival: '05:30 AM (Next Day)',
          distanceKm: 4.8,
          speed: '62 km/h',
          fare: 799,
          status: '5KM_ALERT',
          seatsAvailable: 14
        },
        {
          busNo: 'RJ14 PC 4410',
          operator: 'Royal Route Rajasthan',
          type: 'AC Seater Pushback',
          route: 'Delhi ➔ Jaipur',
          via: 'via NH48 Delhi-Jaipur Highway',
          bay: 'BAY 02',
          stationArrival: '08:45 PM',
          stationEtaMin: 17,
          destArrival: '01:45 AM (Night)',
          distanceKm: 16.5,
          speed: '68 km/h',
          fare: 499,
          status: 'ON_ROUTE',
          seatsAvailable: 22
        },
        {
          busNo: 'UP80 BR 9081',
          operator: 'InterCity Taj Express',
          type: 'Janrath AC Seater',
          route: 'Delhi ➔ Agra',
          via: 'via Greater Noida Expressway',
          bay: 'BAY 06',
          stationArrival: '08:20 PM',
          stationEtaMin: 0,
          destArrival: '11:45 PM (Today)',
          distanceKm: 0.1,
          speed: '0 km/h (At Bay)',
          fare: 380,
          status: 'BOARDING',
          seatsAvailable: 8
        },
        {
          busNo: 'CH01 CD 5530',
          operator: 'Himalayan Golden Highway',
          type: 'Volvo Multi-Axle AC',
          route: 'Delhi ➔ Chandigarh',
          via: 'via Panipat - Ambala Corridor',
          bay: 'BAY 08',
          stationArrival: '09:10 PM',
          stationEtaMin: 42,
          destArrival: '02:00 AM (Night)',
          distanceKm: 38.0,
          speed: '74 km/h',
          fare: 620,
          status: 'ON_ROUTE',
          seatsAvailable: 19
        },
        {
          busNo: 'UK07 DB 7712',
          operator: 'Doon Valley Superfast',
          type: 'AC Sleeper 2+1',
          route: 'Delhi ➔ Dehradun',
          via: 'via Meerut & Roorkee Bypass',
          bay: 'BAY 01',
          stationArrival: '09:30 PM',
          stationEtaMin: 62,
          destArrival: '04:15 AM (Next Day)',
          distanceKm: 52.0,
          speed: '65 km/h',
          fare: 680,
          status: 'ON_ROUTE',
          seatsAvailable: 16
        },
        {
          busNo: 'UP65 VT 8844',
          operator: 'Kashi Express Mobility',
          type: 'Scania Premium Sleeper',
          route: 'Delhi ➔ Varanasi',
          via: 'via Purvanchal Expressway',
          bay: 'BAY 05',
          stationArrival: '08:50 PM',
          stationEtaMin: 22,
          destArrival: '09:30 AM (Next Day)',
          distanceKm: 18.2,
          speed: '58 km/h',
          fare: 1150,
          status: 'ON_ROUTE',
          seatsAvailable: 11
        }
      ]
    },
    'lucknow-01': {
      id: 'lucknow-01',
      name: 'Lucknow · Alambagh Bus Terminal (Bay Hub)',
      short: 'Lucknow (Alambagh)',
      code: 'LKO-AB',
      destinations: ['Delhi', 'Varanasi', 'Kanpur', 'Prayagraj', 'Ayodhya', 'Gorakhpur'],
      schedules: [
        {
          busNo: 'UP32 AB 1234',
          operator: 'AI Fleet Select',
          type: 'Volvo AC Sleeper Multi-Axle',
          route: 'Lucknow ➔ Delhi',
          via: 'via Agra-Lucknow Expressway',
          bay: 'BAY 03',
          stationArrival: '08:40 PM',
          stationEtaMin: 8,
          destArrival: '05:15 AM (Next Day)',
          distanceKm: 5.0,
          speed: '59 km/h',
          fare: 799,
          status: '5KM_ALERT',
          seatsAvailable: 9
        },
        {
          busNo: 'UP65 AB 1022',
          operator: 'Stateway Travels',
          type: 'Janrath AC Seater',
          route: 'Lucknow ➔ Varanasi',
          via: 'via Sultanpur - Jaunpur NH',
          bay: 'BAY 01',
          stationArrival: '08:25 PM',
          stationEtaMin: 0,
          destArrival: '02:00 AM (Night)',
          distanceKm: 0.2,
          speed: '0 km/h (At Bay)',
          fare: 450,
          status: 'BOARDING',
          seatsAvailable: 15
        },
        {
          busNo: 'UP78 KP 3302',
          operator: 'Awadh Shuttle Link',
          type: 'Ordinary 2+2 Express',
          route: 'Lucknow ➔ Kanpur',
          via: 'via Unnao Highway Corridor',
          bay: 'BAY 07',
          stationArrival: '08:55 PM',
          stationEtaMin: 25,
          destArrival: '10:45 PM (Today)',
          distanceKm: 21.0,
          speed: '55 km/h',
          fare: 160,
          status: 'ON_ROUTE',
          seatsAvailable: 31
        }
      ]
    },
    'jaipur-01': {
      id: 'jaipur-01',
      name: 'Jaipur · Sindhi Camp Central Stand',
      short: 'Jaipur (Sindhi Camp)',
      code: 'JPR-SC',
      destinations: ['Delhi', 'Udaipur', 'Jodhpur', 'Ajmer', 'Ahmedabad', 'Agra'],
      schedules: [
        {
          busNo: 'RJ14 PC 4410',
          operator: 'Royal Route Rajasthan',
          type: 'AC Seater Pushback',
          route: 'Jaipur ➔ Delhi',
          via: 'via Kotputli & Gurugram',
          bay: 'BAY 02',
          stationArrival: '08:32 PM',
          stationEtaMin: 4,
          destArrival: '01:30 AM (Night)',
          distanceKm: 3.8,
          speed: '61 km/h',
          fare: 499,
          status: '5KM_ALERT',
          seatsAvailable: 18
        },
        {
          busNo: 'RJ27 UD 9011',
          operator: 'Mewar Luxury Coach',
          type: 'Volvo AC Sleeper',
          route: 'Jaipur ➔ Udaipur',
          via: 'via Kishangarh & Bhilwara',
          bay: 'BAY 05',
          stationArrival: '09:00 PM',
          stationEtaMin: 30,
          destArrival: '04:30 AM (Next Day)',
          distanceKm: 26.0,
          speed: '65 km/h',
          fare: 650,
          status: 'ON_ROUTE',
          seatsAvailable: 21
        }
      ]
    },
    'mumbai-01': {
      id: 'mumbai-01',
      name: 'Mumbai · Dadar Central Terminal',
      short: 'Mumbai (Dadar)',
      code: 'BOM-DR',
      destinations: ['Pune', 'Goa', 'Nashik', 'Surat', 'Ahmedabad'],
      schedules: [
        {
          busNo: 'MH01 DD 6620',
          operator: 'Western Expresslines',
          type: 'Volvo AC Multi-Axle',
          route: 'Mumbai ➔ Pune',
          via: 'via Mumbai-Pune Expressway',
          bay: 'BAY 01',
          stationArrival: '08:38 PM',
          stationEtaMin: 6,
          destArrival: '12:15 AM (Night)',
          distanceKm: 4.5,
          speed: '68 km/h',
          fare: 350,
          status: '5KM_ALERT',
          seatsAvailable: 12
        },
        {
          busNo: 'MH04 GO 8819',
          operator: 'Konkan Coastliner',
          type: 'AC Sleeper 2+1',
          route: 'Mumbai ➔ Goa',
          via: 'via Chiplun & Sawantwadi',
          bay: 'BAY 04',
          stationArrival: '08:15 PM',
          stationEtaMin: 0,
          destArrival: '08:30 AM (Next Day)',
          distanceKm: 0.1,
          speed: '0 km/h (At Bay)',
          fare: 1100,
          status: 'BOARDING',
          seatsAvailable: 7
        }
      ]
    },
    'bengaluru-01': {
      id: 'bengaluru-01',
      name: 'Bengaluru · Kempegowda Majestic Station',
      short: 'Bengaluru (Majestic)',
      code: 'BLR-MJ',
      destinations: ['Chennai', 'Hyderabad', 'Mysuru', 'Coimbatore', 'Kochi'],
      schedules: [
        {
          busNo: 'KA01 MJ 5500',
          operator: 'Southline Connect',
          type: 'Electric EV Luxury Coach',
          route: 'Bengaluru ➔ Chennai',
          via: 'via Hosur & Vellore Expressway',
          bay: 'BAY 06',
          stationArrival: '08:36 PM',
          stationEtaMin: 5,
          destArrival: '02:00 AM (Night)',
          distanceKm: 4.1,
          speed: '60 km/h',
          fare: 599,
          status: '5KM_ALERT',
          seatsAvailable: 14
        }
      ]
    },
    'varanasi-01': {
      id: 'varanasi-01',
      name: 'Varanasi · Cantt Central Bus Stand',
      short: 'Varanasi (Cantt)',
      code: 'VNS-CT',
      destinations: ['Lucknow', 'Prayagraj', 'Gorakhpur', 'Patna', 'Delhi'],
      schedules: [
        {
          busNo: 'UP65 VT 8844',
          operator: 'Kashi Express Mobility',
          type: 'Scania Premium Sleeper',
          route: 'Varanasi ➔ Delhi',
          via: 'via Purvanchal & Yamuna Expressway',
          bay: 'BAY 02',
          stationArrival: '08:42 PM',
          stationEtaMin: 9,
          destArrival: '09:30 AM (Next Day)',
          distanceKm: 4.9,
          speed: '55 km/h',
          fare: 1150,
          status: '5KM_ALERT',
          seatsAvailable: 16
        }
      ]
    }
  };

  let currentTerminalId = 'delhi-01';

  // --------------------------------------------------------------------------
  // 2. DOM HELPERS & DIGITAL CLOCK
  // --------------------------------------------------------------------------
  const $ = selector => document.querySelector(selector);
  const escapeHtml = str => String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = val => `₹${Number(val).toLocaleString('en-IN')}`;

  function updateStationClock() {
    const now = new Date();
    const clockEl = $('#stationLiveClock');
    const dateEl = $('#stationLiveDate');
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).toUpperCase();
    }
    if (dateEl) {
      const enDate = now.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).toUpperCase();
      dateEl.textContent = enDate;
    }
  }

  // --------------------------------------------------------------------------
  // 3. RENDER STATION PIS BOARD (DEPARTURES & ARRIVALS)
  // --------------------------------------------------------------------------
  function renderStationBoard() {
    const terminal = TERMINALS[currentTerminalId] || TERMINALS['delhi-01'];
    $('#boardStationHeading').textContent = `${terminal.name.toUpperCase()} — LIVE DEPARTURES & ARRIVALS`;
    $('#terminalSubTitle').textContent = `TERMINAL ${terminal.code} · PASSENGER INFORMATION SYSTEM`;

    const tableBody = $('#stationPisTableBody');
    if (!tableBody) return;

    let count5km = 0;
    let countBoarding = 0;
    let nearest5kmBus = null;

    tableBody.innerHTML = terminal.schedules.map(bus => {
      // 5 KM calculation and status determination
      const is5kmAlert = bus.distanceKm <= 5.0 && bus.distanceKm > 0.2;
      const isBoarding = bus.status === 'BOARDING' || bus.distanceKm <= 0.2;

      if (is5kmAlert) {
        count5km++;
        if (!nearest5kmBus) nearest5kmBus = bus;
      }
      if (isBoarding) countBoarding++;

      let statusBadge = '';
      if (is5kmAlert) {
        statusBadge = `<span class="badge-pis-status status-5km-alert"><i class="fa-solid fa-triangle-exclamation"></i> 🚨 5 KM ALERT (${bus.distanceKm} km · ${bus.stationEtaMin}m)</span>`;
      } else if (isBoarding) {
        statusBadge = `<span class="badge-pis-status status-boarding"><i class="fa-solid fa-person-walking-luggage"></i> 🟢 BOARDING ${escapeHtml(bus.bay)}</span>`;
      } else if (bus.status === 'DELAYED') {
        statusBadge = `<span class="badge-pis-status status-delayed"><i class="fa-solid fa-clock"></i> 🟡 DELAYED 10M</span>`;
      } else {
        statusBadge = `<span class="badge-pis-status status-onroute"><i class="fa-solid fa-route"></i> 🔵 ON ROUTE (${escapeHtml(bus.speed)})</span>`;
      }

      return `
        <tr>
          <td class="pis-bus-cell">
            <strong>${escapeHtml(bus.busNo)}</strong>
            <small>${escapeHtml(bus.operator)} · ${escapeHtml(bus.type)}</small>
          </td>
          <td class="pis-route-cell">
            <div class="pis-route-name">${escapeHtml(bus.route)}</div>
            <div class="pis-route-sub">${escapeHtml(bus.via)}</div>
          </td>
          <td>
            <span class="pis-bay-badge">${escapeHtml(bus.bay)}</span>
          </td>
          <td class="pis-time-cell">
            <b>${escapeHtml(bus.stationArrival)}</b>
            <small style="color:${is5kmAlert ? '#ef4444' : '#10b981'}; font-weight:700;">
              ${isBoarding ? '● At Boarding Bay' : `● ETA: In ${bus.stationEtaMin} mins`}
            </small>
          </td>
          <td class="pis-dest-time-cell">
            <b>${escapeHtml(bus.destArrival)}</b>
            <small>● Destination Reach Time</small>
          </td>
          <td>
            <div>${statusBadge}</div>
            <small style="color:#94a3b8; font-size:11px; margin-top:4px; display:block;">
              <i class="fa-solid fa-location-crosshairs"></i> ${bus.distanceKm} km from terminal · ${bus.seatsAvailable} seats left
            </small>
          </td>
          <td>
            <button type="button" class="pis-action-btn" onclick="window.startKioskBookingForBus('${escapeHtml(bus.busNo)}')">
              <i class="fa-solid fa-ticket"></i> Book (No Phone)
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Update status bar cards
    $('#statCount5km').textContent = `${count5km} Bus${count5km === 1 ? '' : 'es'} in 5 KM Range`;
    $('#statCountBoarding').textContent = `${countBoarding} Active Bay${countBoarding === 1 ? '' : 's'}`;

    // Update 5 KM Geofence Station Alert Banner
    const alertBox = $('#stationGeofenceAlert');
    if (nearest5kmBus) {
      alertBox.style.display = 'flex';
      $('#geofenceAlertTitle').textContent = `⚠️ 5 KM RADAR ALERT: Bus ${nearest5kmBus.busNo} is ${nearest5kmBus.distanceKm} km from ${terminal.short}!`;
      $('#geofenceAlertDesc').innerHTML = `यात्री ध्यान दें: यदि आपने बस <strong>${nearest5kmBus.busNo} (${nearest5kmBus.route})</strong> में टिकट बुक किया है और अभी स्टेशन नहीं पहुंचे हैं, तो <strong>जल्द से जल्द ${nearest5kmBus.bay} पर पहुंचिए नहीं तो आपकी बस छूट जाएगी!</strong>`;
      $('#geofenceDistanceText').textContent = `${nearest5kmBus.distanceKm} KM · ETA ${nearest5kmBus.stationEtaMin} MINS`;
    } else {
      alertBox.style.display = 'none';
    }
  }

  window.switchStationTerminal = function(terminalId) {
    if (TERMINALS[terminalId]) {
      currentTerminalId = terminalId;
      renderStationBoard();
      // Update Kiosk input 'From'
      const inputFrom = $('#kioskInputFrom');
      if (inputFrom) inputFrom.value = TERMINALS[terminalId].name;
      // Load destination options for this terminal
      const toSelect = $('#kioskInputTo');
      if (toSelect) {
        toSelect.innerHTML = TERMINALS[terminalId].destinations.map(d => `<option value="${d}">${d}</option>`).join('');
      }
    }
  };

  window.refreshStationBoard = function() {
    renderStationBoard();
  };

  // --------------------------------------------------------------------------
  // 4. SPEECH AUDIO ANNOUNCEMENTS (हिंदी व अंग्रेजी उद्घोषणा)
  // --------------------------------------------------------------------------
  window.triggerStationAnnouncement = function() {
    const terminal = TERMINALS[currentTerminalId] || TERMINALS['delhi-01'];
    const approaching = terminal.schedules.find(b => b.distanceKm <= 5.0) || terminal.schedules[0];

    const hindiText = `यात्रीगण कृपया ध्यान दें। बस संख्या ${approaching.busNo}, ${approaching.route}, प्लेटफार्म संख्या ${approaching.bay} पर ${approaching.stationEtaMin} मिनट में पहुंच रही है। सभी यात्री अपने 15 किलो सामान के साथ प्लेटफार्म पर पहुंचे।`;
    window.speakHindiAlert(hindiText);
  };

  window.speakHindiAlert = function(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = 'hi-IN';
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`📢 STATION ANNOUNCEMENT:\n\n${text}`);
    }
  };

  // --------------------------------------------------------------------------
  // 5. PHONE-LESS SELF-SERVICE TOUCHSCREEN KIOSK (NO PHONE REQUIRED)
  // --------------------------------------------------------------------------
  const kioskState = {
    step: 1,
    selectedBus: null,
    selectedSeats: new Set(),
    luggageWeight: 15,
    foodChoice: false,
    foodCart: new Map(), // foodId -> { item, quantity }
    inactivitySeconds: 60,
    inactivityTimerId: null,
    passenger: {
      name: '',
      age: 28,
      gender: 'Male',
      govIdType: 'Aadhaar Card',
      govIdNumber: ''
    },
    paymentMode: 'cash',
    generatedBooking: null
  };

  const KIOSK_FOOD_MENU = [
    { foodId: 'food-001', name: 'Veg Sandwich', price: 80, veg: true, stockQuantity: 25, availability: true, image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=300&q=80' },
    { foodId: 'food-002', name: 'Veg Burger', price: 100, veg: true, stockQuantity: 18, availability: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80' },
    { foodId: 'food-003', name: 'Personal Pizza', price: 150, veg: true, stockQuantity: 12, availability: true, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80' },
    { foodId: 'food-004', name: 'Executive Meal Box', price: 180, veg: true, stockQuantity: 20, availability: true, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80' },
    { foodId: 'food-005', name: 'Soft Drink (Can)', price: 50, veg: true, stockQuantity: 40, availability: true, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80' },
    { foodId: 'food-006', name: 'Packaged Drinking Water (1L)', price: 20, veg: true, stockQuantity: 50, availability: true, image: 'https://images.unsplash.com/photo-1559839914-ba2ac55d9985?auto=format&fit=crop&w=300&q=80' },
    { foodId: 'food-007', name: 'Hot Masala Tea', price: 30, veg: true, stockQuantity: 30, availability: true, image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=300&q=80' },
    { foodId: 'food-008', name: 'Indori Poha & Sev', price: 70, veg: true, stockQuantity: 15, availability: true, image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=300&q=80' },
    { foodId: 'food-009', name: 'Gulab Jamun (2 Pcs)', price: 60, veg: true, stockQuantity: 0, availability: false, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=300&q=80' }
  ];

  window.resetKioskInactivityTimer = function() {
    kioskState.inactivitySeconds = 60;
    const el = $('#kioskTimerSec');
    if (el) el.textContent = '60';
  };

  function startKioskInactivityMonitor() {
    if (kioskState.inactivityTimerId) clearInterval(kioskState.inactivityTimerId);
    kioskState.inactivityTimerId = setInterval(() => {
      const modal = $('#touchKioskModal');
      if (!modal || modal.hidden) return;
      kioskState.inactivitySeconds--;
      const el = $('#kioskTimerSec');
      if (el) el.textContent = String(Math.max(0, kioskState.inactivitySeconds));
      if (kioskState.inactivitySeconds <= 0) {
        window.resetKioskBooking();
        window.closeTouchKioskModal();
        alert('⚠️ सुरक्षा रीसेट: 60 सेकंड की निष्क्रियता के कारण कियोस्क सत्र रीसेट कर दिया गया है।');
      }
    }, 1000);
  }

  window.openTouchKioskModal = function() {
    const modal = $('#touchKioskModal');
    if (!modal) return;
    modal.hidden = false;
    window.resetKioskInactivityTimer();
    startKioskInactivityMonitor();

    // Attach activity listeners once
    if (!modal.dataset.listenerAttached) {
      modal.dataset.listenerAttached = 'true';
      ['click', 'touchstart', 'input', 'keydown'].forEach(evt => {
        modal.addEventListener(evt, () => window.resetKioskInactivityTimer());
      });
    }

    // Set date to today
    const dateInput = $('#kioskInputDate');
    if (dateInput && !dateInput.value) {
      const today = new Date().toISOString().slice(0, 10);
      dateInput.value = today;
      dateInput.min = today;
    }
    // Set 'From' field to active terminal
    const terminal = TERMINALS[currentTerminalId] || TERMINALS['delhi-01'];
    $('#kioskInputFrom').value = terminal.name;
    // Set 'To' options
    const toSelect = $('#kioskInputTo');
    if (toSelect && !toSelect.options.length) {
      toSelect.innerHTML = terminal.destinations.map(d => `<option value="${d}">${d}</option>`).join('');
    }
    window.goToKioskStep(1);
    window.loadKioskBusOptions();
  };

  window.closeTouchKioskModal = function() {
    const modal = $('#touchKioskModal');
    if (modal) modal.hidden = true;
    if (kioskState.inactivityTimerId) clearInterval(kioskState.inactivityTimerId);
  };

  window.goToKioskStep = function(stepNum) {
    kioskState.step = stepNum;
    window.resetKioskInactivityTimer();

    for (let i = 1; i <= 6; i++) {
      const stepDiv = $(`#wizardStep${i}`);
      const indicator = $(`#stepIndicator${i}`);
      if (stepDiv) stepDiv.style.display = (i === stepNum) ? 'block' : 'none';
      if (indicator) {
        indicator.classList.remove('active', 'completed');
        if (i === stepNum) indicator.classList.add('active');
        else if (i < stepNum) indicator.classList.add('completed');
      }
    }

    const prevBtn = $('#btnKioskPrev');
    const nextBtn = $('#btnKioskNext');
    const notice = $('#kioskCurrentStepNotice');

    if (stepNum === 1) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) {
        nextBtn.style.display = 'block';
        nextBtn.textContent = 'सीट चुनें (Select Seat) →';
      }
      if (notice) notice.textContent = 'चरण 1 / 5: बस और समय चुनें';
    } else if (stepNum === 2) {
      if (prevBtn) prevBtn.style.display = 'block';
      if (nextBtn) {
        nextBtn.style.display = 'block';
        nextBtn.textContent = 'यात्री विवरण (Passenger Info) →';
      }
      if (notice) notice.textContent = 'चरण 2 / 5: अपनी मनपसंद सीट चुनें';
      window.renderKioskSeatMap();
    } else if (stepNum === 3) {
      if (prevBtn) prevBtn.style.display = 'block';
      if (nextBtn) {
        nextBtn.style.display = 'block';
        nextBtn.textContent = 'भोजन विकल्प (Food Options) →';
      }
      if (notice) notice.textContent = 'चरण 3 / 5: यात्री पहचान पत्र (बिना फोन)';
    } else if (stepNum === 4) {
      if (prevBtn) prevBtn.style.display = 'block';
      if (nextBtn) {
        nextBtn.style.display = 'block';
        nextBtn.textContent = 'लगेज व भुगतान (Luggage & Pay) →';
      }
      if (notice) notice.textContent = 'चरण 4 / 5: ऑनबोर्ड भोजन (वैकल्पिक)';
      window.renderKioskFoodMenu();
    } else if (stepNum === 5) {
      if (prevBtn) prevBtn.style.display = 'block';
      if (nextBtn) {
        nextBtn.style.display = 'block';
        nextBtn.textContent = 'टिकट जारी करें (Issue Boarding Pass) ✓';
      }
      if (notice) notice.textContent = 'चरण 5 / 5: 15 KG लगेज व भुगतान विकल्प';
      window.updateKioskLuggageAndBill();
    } else if (stepNum === 6) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      if (notice) notice.textContent = '✓ टिकट व रसीद तैयार है — प्रिंट करें';
    }
  };

  window.kioskPrevStep = function() {
    if (kioskState.step > 1) {
      window.goToKioskStep(kioskState.step - 1);
    }
  };

  window.kioskNextStep = function() {
    if (kioskState.step === 1) {
      if (!kioskState.selectedBus) {
        alert('कृपया आगे बढ़ने के लिए उपलब्ध बसों में से एक बस चुनें।');
        return;
      }
      window.goToKioskStep(2);
    } else if (kioskState.step === 2) {
      if (kioskState.selectedSeats.size === 0) {
        alert('कृपया आगे बढ़ने के लिए कम से कम 1 सीट चुनें।');
        return;
      }
      window.goToKioskStep(3);
    } else if (kioskState.step === 3) {
      const name = $('#kioskPassName')?.value.trim();
      const age = $('#kioskPassAge')?.value.trim();
      const govIdNum = $('#kioskGovIdNumber')?.value.trim();

      if (!name) {
        alert('कृपया यात्री का पूरा नाम दर्ज करें।');
        $('#kioskPassName')?.focus();
        return;
      }
      if (!age || Number(age) < 1) {
        alert('कृपया वैध उम्र दर्ज करें।');
        $('#kioskPassAge')?.focus();
        return;
      }
      if (!govIdNum) {
        alert('कृपया सरकारी पहचान पत्र क्रमांक दर्ज करें (फोन नंबर आवश्यक नहीं है)।');
        $('#kioskGovIdNumber')?.focus();
        return;
      }

      kioskState.passenger.name = name;
      kioskState.passenger.age = age;
      kioskState.passenger.gender = $('#kioskPassGender')?.value || 'Male';
      kioskState.passenger.govIdType = $('#kioskGovIdType')?.value || 'Aadhaar Card';
      kioskState.passenger.govIdNumber = govIdNum;

      window.goToKioskStep(4);
    } else if (kioskState.step === 4) {
      window.goToKioskStep(5);
    } else if (kioskState.step === 5) {
      window.executeKioskFinalBooking();
    }
  };

  // Step 1: Bus Options
  window.loadKioskBusOptions = function() {
    const terminal = TERMINALS[currentTerminalId] || TERMINALS['delhi-01'];
    const container = $('#kioskBusOptionsList');
    if (!container) return;

    const toCity = $('#kioskInputTo')?.value || 'Jaipur';
    let buses = terminal.schedules.filter(b => b.route.toLowerCase().includes(toCity.toLowerCase()));
    if (!buses.length) buses = terminal.schedules;

    container.innerHTML = buses.map((bus, idx) => {
      const isSelected = kioskState.selectedBus && kioskState.selectedBus.busNo === bus.busNo;
      if (idx === 0 && !kioskState.selectedBus) kioskState.selectedBus = bus;

      return `
        <div class="kiosk-bus-option-card ${isSelected ? 'selected' : ''}" onclick="window.selectKioskBus('${escapeHtml(bus.busNo)}')">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <strong style="font-size:15px; color:#38bdf8;">${escapeHtml(bus.busNo)}</strong>
              <span class="pis-bay-badge" style="padding:2px 8px; font-size:11px;">${escapeHtml(bus.bay)}</span>
            </div>
            <div style="font-size:13px; font-weight:700; color:#fff; margin-top:2px;">${escapeHtml(bus.operator)} · ${escapeHtml(bus.type)}</div>
            <div style="font-size:11px; color:#94a3b8; margin-top:3px;">
              स्टेशन आगमन: <strong style="color:#38bdf8;">${escapeHtml(bus.stationArrival)}</strong> ➔ गंतव्य पहुंच: <strong style="color:#a7f3d0;">${escapeHtml(bus.destArrival)}</strong>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:18px; font-weight:900; color:#facc15;">${money(bus.fare)}</div>
            <small style="color:#10b981; font-weight:700;">${bus.seatsAvailable} सीटें बाकी</small>
          </div>
        </div>
      `;
    }).join('');
  };

  window.selectKioskBus = function(busNo) {
    const terminal = TERMINALS[currentTerminalId] || TERMINALS['delhi-01'];
    const found = terminal.schedules.find(b => b.busNo === busNo);
    if (found) {
      kioskState.selectedBus = found;
      window.loadKioskBusOptions();
    }
  };

  window.startKioskBookingForBus = function(busNo) {
    window.openTouchKioskModal();
    window.selectKioskBus(busNo);
  };

  // Step 2: Interactive Seat Map
  window.renderKioskSeatMap = function() {
    const container = $('#kioskSeatGrid');
    if (!container) return;

    const unavailableSeats = new Set(['1A', '2B', '3C', '4A', '5D', '7B']);
    let html = '';

    for (let r = 1; r <= 7; r++) {
      ['A', 'B', 'C', 'D'].forEach((col) => {
        const seatId = `${r}${col}`;
        const isSelected = kioskState.selectedSeats.has(seatId);
        const isOccupied = unavailableSeats.has(seatId);

        html += `
          <button type="button" class="kiosk-seat-btn ${isOccupied ? 'unavailable' : ''} ${isSelected ? 'selected' : ''}" 
                  ${isOccupied ? 'disabled' : ''} 
                  onclick="window.toggleKioskSeat('${seatId}')">
            <span>${seatId}</span>
            <small style="font-size:9px; opacity:0.8;">${col === 'A' || col === 'D' ? 'Win' : 'Aisle'}</small>
          </button>
        `;
      });
    }

    container.innerHTML = html;
    window.updateKioskSeatSummary();
  };

  window.toggleKioskSeat = function(seatId) {
    if (kioskState.selectedSeats.has(seatId)) {
      kioskState.selectedSeats.delete(seatId);
    } else {
      if (kioskState.selectedSeats.size >= 4) {
        alert('कियोस्क पर अधिकतम 4 सीटें ही एक साथ चुनी जा सकती हैं।');
        return;
      }
      kioskState.selectedSeats.add(seatId);
    }
    window.renderKioskSeatMap();
  };

  window.updateKioskSeatSummary = function() {
    const seatsArray = [...kioskState.selectedSeats];
    const fare = kioskState.selectedBus ? kioskState.selectedBus.fare : 500;
    const totalSeatFare = seatsArray.length * fare;

    const textEl = $('#kioskSelectedSeatsText');
    const fareEl = $('#kioskSeatsFareText');

    if (textEl) textEl.textContent = seatsArray.length ? seatsArray.join(', ') : 'कोई नहीं';
    if (fareEl) fareEl.textContent = money(totalSeatFare);
  };

  // Step 4: Optional Food Methods
  window.setKioskFoodChoice = function(wantsFood) {
    kioskState.foodChoice = wantsFood;
    const btnSkip = $('#btnKioskFoodSkip');
    const btnOrder = $('#btnKioskFoodOrder');
    const drawer = $('#kioskFoodDrawer');

    if (wantsFood) {
      btnOrder?.classList.add('active');
      btnSkip?.classList.remove('active');
      if (drawer) drawer.style.display = 'block';
      window.renderKioskFoodMenu();
    } else {
      btnSkip?.classList.add('active');
      btnOrder?.classList.remove('active');
      if (drawer) drawer.style.display = 'none';
      kioskState.foodCart.clear();
    }
  };

  window.renderKioskFoodMenu = function() {
    const grid = $('#kioskFoodItemsGrid');
    if (!grid) return;

    grid.innerHTML = KIOSK_FOOD_MENU.map(item => {
      const isSoldOut = item.stockQuantity <= 0 || item.availability === false;
      const currentQty = kioskState.foodCart.get(item.foodId)?.quantity || 0;

      return `
        <div class="food-card-compact ${isSoldOut ? 'sold-out' : ''}" style="background:#0f172a; border-color:#334155; color:#fff;">
          <img src="${item.image}" class="food-img-thumb" alt="${escapeHtml(item.name)}">
          <div class="food-info-col">
            <div class="food-name-line" style="color:#fff;">
              <span class="veg-icon" title="Veg"></span>
              <span>${escapeHtml(item.name)}</span>
            </div>
            <div class="food-price-line" style="color:#facc15;">₹${item.price}</div>
            <div>
              ${isSoldOut ? '<span class="food-stock-badge badge-soldout">SOLD OUT</span>' : `<span class="food-stock-badge badge-available">In Stock (${item.stockQuantity})</span>`}
            </div>
          </div>
          <div class="food-qty-stepper">
            <button type="button" class="btn-qty" onclick="window.adjustKioskFoodItem('${item.foodId}', -1)" ${currentQty <= 0 ? 'disabled' : ''}>−</button>
            <span class="qty-display" style="color:#fff;">${currentQty}</span>
            <button type="button" class="btn-qty" onclick="window.adjustKioskFoodItem('${item.foodId}', 1)" ${isSoldOut || currentQty >= item.stockQuantity ? 'disabled' : ''}>+</button>
          </div>
        </div>
      `;
    }).join('');
  };

  window.adjustKioskFoodItem = function(foodId, delta) {
    const item = KIOSK_FOOD_MENU.find(f => f.foodId === foodId);
    if (!item) return;
    const current = kioskState.foodCart.get(foodId) || { item, quantity: 0 };
    const newQty = current.quantity + delta;

    if (newQty <= 0) {
      kioskState.foodCart.delete(foodId);
    } else if (newQty <= item.stockQuantity) {
      current.quantity = newQty;
      kioskState.foodCart.set(foodId, current);
    }
    window.renderKioskFoodMenu();
  };

  function getKioskFoodTotal() {
    let sum = 0;
    for (const { item, quantity } of kioskState.foodCart.values()) {
      sum += (item.price * quantity);
    }
    return sum;
  }

  // Step 5: Luggage & Payment Billing (Separated Lines)
  window.adjustKioskLuggage = function(delta) {
    kioskState.luggageWeight = Math.max(5, Math.min(50, kioskState.luggageWeight + delta));
    window.updateKioskLuggageAndBill();
  };

  window.updateKioskLuggageAndBill = function() {
    const weight = kioskState.luggageWeight;
    const displayEl = $('#kioskLuggageDisplay');
    const noticeEl = $('#kioskLuggageStatusNotice');

    if (displayEl) displayEl.innerHTML = `${weight} <small style="font-size:14px; color:#94a3b8;">KG</small>`;

    const excessKg = Math.max(0, weight - 15);
    const extraLuggageFee = excessKg * 30; // ₹30/kg excess surcharge

    if (noticeEl) {
      if (excessKg === 0) {
        noticeEl.style.color = '#10b981';
        noticeEl.innerHTML = '✓ 15 KG सीमा के अंदर है — कोई अतिरिक्त शुल्क नहीं (100% Free Allowance)';
      } else {
        noticeEl.style.color = '#ef4444';
        noticeEl.innerHTML = `⚠ 15 KG से ${excessKg} KG अधिक: +₹${extraLuggageFee} अतिरिक्त लगेज चार्ज (@ ₹30/KG)`;
      }
    }

    const fare = kioskState.selectedBus ? kioskState.selectedBus.fare : 500;
    const seatCost = kioskState.selectedSeats.size * fare;
    const foodCost = kioskState.foodChoice ? getKioskFoodTotal() : 0;
    const grandTotal = seatCost + extraLuggageFee + foodCost;

    $('#kioskBillSeatFare').textContent = `${money(seatCost)} (${kioskState.selectedSeats.size} सीट)`;
    $('#kioskBillLuggageFee').textContent = extraLuggageFee === 0 ? '₹0 (15 KG Free)' : `+${money(extraLuggageFee)} (${excessKg} KG Extra)`;
    
    if ($('#kioskBillFoodFee')) {
      $('#kioskBillFoodFee').textContent = foodCost > 0 ? `+${money(foodCost)} (${kioskState.foodCart.size} item)` : '₹0 (Skipped)';
      $('#kioskBillFoodFee').style.color = foodCost > 0 ? '#facc15' : '#64748b';
    }

    $('#kioskBillTotal').textContent = money(grandTotal);
  };

  window.selectKioskPayMode = function(mode) {
    kioskState.paymentMode = mode;
    ['payModeCash', 'payModeSmartCard', 'payModeUPI'].forEach(id => {
      const el = $(`#${id}`);
      if (el) el.classList.remove('selected');
    });

    if (mode === 'cash') $('#payModeCash')?.classList.add('selected');
    else if (mode === 'smartcard') $('#payModeSmartCard')?.classList.add('selected');
    else if (mode === 'upi') $('#payModeUPI')?.classList.add('selected');
  };

  // Step 6: Final Execution & Thermal Boarding Pass + Separate Food Slip Generation
  window.executeKioskFinalBooking = async function() {
    const terminal = TERMINALS[currentTerminalId] || TERMINALS['delhi-01'];
    const bus = kioskState.selectedBus;
    const seats = [...kioskState.selectedSeats];
    const pass = kioskState.passenger;
    const weight = kioskState.luggageWeight;
    const excessKg = Math.max(0, weight - 15);
    const luggageFee = excessKg * 30;
    const seatFare = seats.length * bus.fare;
    const foodCost = kioskState.foodChoice ? getKioskFoodTotal() : 0;
    const totalAmount = seatFare + luggageFee + foodCost;

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const pnr = `KSK-${terminal.code.split('-')[0]}-${randomSuffix}`;
    const foodOrderId = foodCost > 0 ? `FOOD-2026-${Math.floor(100000 + Math.random() * 900000)}` : null;

    const foodItemsPayload = [];
    if (kioskState.foodChoice && foodCost > 0) {
      for (const { item, quantity } of kioskState.foodCart.values()) {
        foodItemsPayload.push({ foodId: item.foodId, quantity });
      }
    }

    kioskState.generatedBooking = {
      pnr,
      terminal: terminal.name,
      busNo: bus.busNo,
      busType: bus.type,
      bay: bus.bay,
      route: bus.route,
      stationArrival: bus.stationArrival,
      destArrival: bus.destArrival,
      passengerName: pass.name,
      govId: `${pass.govIdType}: ${pass.govIdNumber}`,
      seats: seats.join(', '),
      luggageWeight: weight,
      luggageFee,
      isFreeLuggage: excessKg === 0,
      foodCharge: foodCost,
      foodOrderId,
      totalAmount,
      payMode: kioskState.paymentMode === 'cash' ? 'Cash Slip (Counter 03)' : kioskState.paymentMode === 'smartcard' ? 'Transit RFID Tap' : 'Kiosk Screen UPI',
      timestamp: new Date().toLocaleString('en-IN')
    };

    // Post to backend
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pnr,
          busId: bus.busNo,
          seats,
          passenger: { name: pass.name, phone: 'NO_PHONE_KIOSK_BOOKING', govId: pass.govIdNumber },
          luggageWeight: weight,
          luggageFee,
          foodItems: foodItemsPayload,
          total: totalAmount
        })
      });
    } catch (_) {
      // Offline fallback
    }

    // Populate Printable Thermal Ticket Card
    $('#ticketTerminalName').textContent = `${terminal.name.toUpperCase()} — BOARDING PASS`;
    $('#ticketPnrVal').textContent = pnr;
    $('#ticketBayBadge').textContent = bus.bay;
    $('#ticketPassName').textContent = `${pass.name} (${pass.age}y / ${pass.gender})`;
    $('#ticketGovId').textContent = `${pass.govIdType}: ${pass.govIdNumber}`;
    $('#ticketBusInfo').textContent = `${bus.busNo} (${bus.type})`;
    $('#ticketSeatInfo').textContent = `Seat${seats.length > 1 ? 's' : ''} ${seats.join(', ')}`;
    $('#ticketStationArrival').textContent = bus.stationArrival;
    $('#ticketDestArrival').textContent = bus.destArrival;

    if (excessKg === 0) {
      $('#ticketLuggageAllowance').style.color = '#10b981';
      $('#ticketLuggageAllowance').textContent = `${weight} KG (15 KG Free Limit Included)`;
    } else {
      $('#ticketLuggageAllowance').style.color = '#ef4444';
      $('#ticketLuggageAllowance').textContent = `${weight} KG (+${money(luggageFee)} Excess Surcharge Paid)`;
    }

    $('#ticketPayStatus').textContent = `${kioskState.generatedBooking.payMode} · ${money(totalAmount)}`;

    // Populate Separate Thermal Food Receipt (Section 10)
    const foodReceiptContainer = $('#thermalFoodReceiptContainer');
    if (foodReceiptContainer) {
      if (foodCost > 0 && foodOrderId) {
        foodReceiptContainer.style.display = 'block';
        foodReceiptContainer.innerHTML = `
          <div class="thermal-ticket-card" style="border-top:3px dashed #a91d32; background:#fffbfb;">
            <div style="text-align:center; border-bottom:1px solid #cbd5e1; padding-bottom:6px; margin-bottom:8px;">
              <strong style="font-size:15px; color:#a91d32; letter-spacing:1px;">SEPARATE FOOD RECEIPT (भोजन पर्ची)</strong>
              <div style="font-size:10px; color:#64748b;">ONBOARD PANTRY SERVICE · CHARGED SEPARATELY</div>
            </div>

            <div class="ticket-pnr-head">
              <div>
                <small style="color:#64748b; font-weight:700;">FOOD ORDER ID</small>
                <div class="ticket-pnr-val" style="color:#a91d32;">${foodOrderId}</div>
              </div>
              <div style="text-align:right;">
                <span class="pis-bay-badge" style="background:#10b981;">PAID: ₹${foodCost}</span>
              </div>
            </div>

            <div class="ticket-field-row" style="margin-bottom:8px;">
              <div><small>PASSENGER</small><b>${escapeHtml(pass.name)}</b></div>
              <div><small>BUS & SEAT</small><b>${escapeHtml(bus.busNo)} (Seat ${seats.join(', ')})</b></div>
              <div><small>STATUS</small><b style="color:#f59e0b;">CONFIRMED (Seat Delivery)</b></div>
              <div><small>PAYMENT</small><b>${kioskState.generatedBooking.payMode}</b></div>
            </div>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:6px 10px; font-size:11px; margin-bottom:8px;">
              ${[...kioskState.foodCart.values()].map(v => `
                <div style="display:flex; justify-content:space-between; padding:2px 0;">
                  <span>${v.quantity} × ${escapeHtml(v.item.name)}</span>
                  <b>₹${v.item.price * v.quantity}</b>
                </div>
              `).join('')}
            </div>

            <div style="text-align:center; font-size:10px; color:#64748b;">
              ★ यह भोजन पर्ची पैंट्री अटेंडेंट को बस के अंदर दिखाएं ★
            </div>
          </div>
        `;
      } else {
        foodReceiptContainer.style.display = 'none';
        foodReceiptContainer.innerHTML = '';
      }
    }

    window.goToKioskStep(6);
  };

  window.resetKioskBooking = function() {
    kioskState.selectedSeats.clear();
    kioskState.luggageWeight = 15;
    kioskState.foodChoice = false;
    kioskState.foodCart.clear();
    kioskState.generatedBooking = null;
    kioskState.inactivitySeconds = 60;
    if ($('#kioskPassName')) $('#kioskPassName').value = '';
    if ($('#kioskGovIdNumber')) $('#kioskGovIdNumber').value = '';
    window.goToKioskStep(1);
    window.loadKioskBusOptions();
  };

  // --------------------------------------------------------------------------
  // 6. INITIALIZATION & RECURRING TIMERS
  // --------------------------------------------------------------------------
  function initKiosk() {
    updateStationClock();
    setInterval(updateStationClock, 1000);
    renderStationBoard();
    // Refresh board data every 30 seconds
    setInterval(renderStationBoard, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKiosk);
  } else {
    initKiosk();
  }

})();
