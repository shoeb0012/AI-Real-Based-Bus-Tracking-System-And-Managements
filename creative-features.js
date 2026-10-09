/**
 * AI BUS TRACK - CREATIVE FEATURES CONTROLLER
 * - Continuous Moving Bus Highway Animation Controls
 * - 360-Degree Bus 3D Viewer & Hotspot Inspector
 * - 360° Route Panorama Slideshow
 * - Smart Luggage Allowance Calculator (15 KG Free / ₹30 per extra KG)
 */

(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  // ----------------------------------------------------------------------------
  // 1. LUGGAGE CALCULATION ENGINE (15 KG FREE ALLOWANCE)
  // ----------------------------------------------------------------------------
  const FREE_ALLOWANCE_KG = 15;
  const RATE_PER_EXTRA_KG = 30; // ₹30 per kg for excess baggage

  window.calculateLuggageFee = function(weightKg) {
    const weight = Math.max(0, Number(weightKg) || 0);
    const excessKg = Math.max(0, weight - FREE_ALLOWANCE_KG);
    const extraCharge = excessKg * RATE_PER_EXTRA_KG;
    return {
      weight,
      freeAllowanceKg: FREE_ALLOWANCE_KG,
      excessKg,
      ratePerKg: RATE_PER_EXTRA_KG,
      extraCharge,
      isFree: excessKg === 0
    };
  };

  function updateLuggageCalculatorUI(weight) {
    const calc = window.calculateLuggageFee(weight);
    const weightValEl = $('#calcWeightDisplay');
    const feeBadgeEl = $('#calcFeeBadge');
    const extraKgTextEl = $('#calcExtraKgText');
    const extraFeeTextEl = $('#calcExtraFeeText');
    const warningEl = $('#luggageWarningBanner');

    if (weightValEl) weightValEl.innerHTML = `${calc.weight} <small>KG</small>`;
    
    if (feeBadgeEl) {
      if (calc.isFree) {
        feeBadgeEl.className = 'fee-badge-status fee-badge-free';
        feeBadgeEl.textContent = '✓ 100% FREE (WITHIN 15 KG LIMIT)';
      } else {
        feeBadgeEl.className = 'fee-badge-status fee-badge-charge';
        feeBadgeEl.textContent = `⚠ EXCESS BAGGAGE (+${calc.excessKg} KG)`;
      }
    }

    if (extraKgTextEl) {
      extraKgTextEl.textContent = calc.isFree 
        ? '0 kg extra (Free allowance applied)' 
        : `+${calc.excessKg} kg over 15 kg limit`;
    }

    if (extraFeeTextEl) {
      extraFeeTextEl.textContent = calc.isFree 
        ? '₹0 (Included with ticket)' 
        : `+₹${calc.extraCharge.toLocaleString('en-IN')} (@ ₹30/kg)`;
    }

    if (warningEl) {
      warningEl.style.display = calc.isFree ? 'none' : 'flex';
    }
  }

  window.setCalculatorWeight = function(weight) {
    const slider = $('#luggageWeightSlider');
    if (slider) slider.value = weight;
    $$('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.weight) === Number(weight));
    });
    updateLuggageCalculatorUI(weight);
  };

  // ----------------------------------------------------------------------------
  // 2. 360-DEGREE BUS 3D VIEWER (HOOKED TO THREE.JS VOLVO LIVE 3D ENGINE)
  // ----------------------------------------------------------------------------
  let bus360Angle = 0;
  let autoRotateInterval = null;
  let isAutoRotating = false;

  window.setBus360Angle = function(angle) {
    bus360Angle = Number(angle);
    if (window.volvoStudioViewer) {
      window.volvoStudioViewer.setAngle(bus360Angle);
    }
    if (window.Volvo3DTracker) {
      // Map angle to closest preset or orbit
      if (bus360Angle === 0) window.Volvo3DTracker.setCameraView('front');
      else if (bus360Angle === 90) window.Volvo3DTracker.setCameraView('left');
      else if (bus360Angle === 180) window.Volvo3DTracker.setCameraView('rear');
      else if (bus360Angle === 270) window.Volvo3DTracker.setCameraView('right');
    }
    const angleText = $('#angleDisplay');
    const slider = $('#bus360Slider');

    if (angleText) angleText.textContent = `${bus360Angle}°`;
    if (slider) slider.value = bus360Angle;
  };

  window.toggleAuto360Rotation = function() {
    if (window.volvoStudioViewer) {
      window.volvoStudioViewer.toggleAuto();
    }
    if (window.Volvo3DTracker) {
      window.Volvo3DTracker.setCameraView('orbit360');
    }
    isAutoRotating = !isAutoRotating;
    const btn = $('#auto360Btn');

    if (btn) {
      btn.innerHTML = isAutoRotating ? '<i class="fa-solid fa-pause"></i> Pause 360°' : '<i class="fa-solid fa-rotate"></i> Auto 360°';
    }
  };

  window.showHotspotInfo = function(type) {
    if (window.Volvo3DTracker) {
      const angleMap = { luggage: 'left', deck: 'front-left', cockpit: 'front', exit: 'rear' };
      window.Volvo3DTracker.setCameraView(angleMap[type] || 'front-left');
    }
    const details = {
      luggage: {
        title: '🧳 Lower Luggage Hold (निचला लगेज कम्पार्टमेंट)',
        desc: 'Capacity: 15 KG Free Allowance included per passenger. Luggage is tagged with PNR barcodes and placed in secure undercarriage bays. Any excess weight above 15 kg is charged transparently at ₹30/kg.'
      },
      deck: {
        title: '❄️ Passenger AC Deck (सवारी केबिन)',
        desc: 'Pushback 2+2 ergonomic reclining seats, high-efficiency roof-mounted HVAC air conditioning, personal reading lamps, and USB fast-charging ports at every seat.'
      },
      cockpit: {
        title: '🛡️ AI Safety Cockpit (ड्राइवर AI केबिन)',
        desc: 'Equipped with dual-camera AI fatigue detection, digital speedometer with 80 km/h governor, live GPS transponder, and SOS emergency button.'
      },
      exit: {
        title: '🚨 Rear Emergency Exit (आपातकालीन निकास)',
        desc: 'Wide pneumatically assisted rear exit, emergency hammer breakout points, and commercial medical first-aid kit compliant with AIS-052 safety standards.'
      }
    };
    const info = details[type] || details.luggage;
    alert(`${info.title}\n\n${info.desc}`);
  };

  // ----------------------------------------------------------------------------
  // 3. SCENIC ROUTE 360° PANORAMA SLIDESHOW
  // ----------------------------------------------------------------------------
  const SCENIC_ROUTES = [
    {
      title: 'Delhi ➔ Jaipur (Royal Express)',
      subtitle: 'Scenic Aravalli Highway Corridor · 260 km · 5 hrs',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1400&q=85'
    },
    {
      title: 'Mumbai ➔ Pune (Western Ghats Expressway)',
      subtitle: 'Monsoon Mountain Pass & Tunnels · 150 km · 3.5 hrs',
      image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1400&q=85'
    },
    {
      title: 'Bengaluru ➔ Chennai (Southern Highway)',
      subtitle: 'Smooth 6-Lane Transit Corridor · 340 km · 6 hrs',
      image: 'https://images.unsplash.com/photo-1557223562-6c77ef16210f?auto=format&fit=crop&w=1400&q=85'
    },
    {
      title: 'Varanasi ➔ Lucknow (Purvanchal Highway)',
      subtitle: 'Heritage Ganges Green Corridor · 310 km · 5 hrs',
      image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1400&q=85'
    }
  ];

  let currentSlideIndex = 0;
  let slideTimer = null;

  window.showSlide = function(index) {
    currentSlideIndex = (index + SCENIC_ROUTES.length) % SCENIC_ROUTES.length;
    const route = SCENIC_ROUTES[currentSlideIndex];
    const imgEl = $('#panoramaSlideImg');
    const titleEl = $('#panoramaTitle');
    const subEl = $('#panoramaSubtitle');

    if (imgEl) {
      imgEl.src = route.image;
    }
    if (titleEl) titleEl.textContent = route.title;
    if (subEl) subEl.textContent = route.subtitle;

    $$('.slide-dot').forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlideIndex);
    });
  };

  window.nextSlide = function() {
    window.showSlide(currentSlideIndex + 1);
  };

  window.prevSlide = function() {
    window.showSlide(currentSlideIndex - 1);
  };

  // ----------------------------------------------------------------------------
  // 4. MOVING HIGHWAY BUS CONTROLLER
  // ----------------------------------------------------------------------------
  window.setHighwaySpeed = function(speedMode) {
    if (window.Volvo3DTracker) {
      window.Volvo3DTracker.setSpeedMode(speedMode);
    }
    const busEl = $('#movingBusVehicle');
    const badgeEl = $('#highwaySpeedBadge');
    $$('.highway-speed-btn').forEach(btn => btn.classList.remove('active'));

    if (speedMode === 'express') {
      if (busEl) busEl.style.animationDuration = '8s';
      if (badgeEl) badgeEl.textContent = 'BUS EN ROUTE: 85 KM/H (EXPRESS)';
      $('#btnSpeedExpress')?.classList.add('active');
    } else if (speedMode === 'turbo') {
      if (busEl) busEl.style.animationDuration = '4.5s';
      if (badgeEl) badgeEl.textContent = 'BUS EN ROUTE: 110 KM/H (HIGHWAY CRUISE)';
      $('#btnSpeedTurbo')?.classList.add('active');
    } else {
      if (busEl) busEl.style.animationDuration = '14s';
      if (badgeEl) badgeEl.textContent = 'BUS EN ROUTE: 65 KM/H (NORMAL)';
      $('#btnSpeedNormal')?.classList.add('active');
    }
  };

  // ----------------------------------------------------------------------------
  // 5. EXTENDED 360° CONTROLS (ZOOM, RESET, DRAG-TO-ROTATE, PRESETS)
  // ----------------------------------------------------------------------------
  let currentBusZoom = 1.0;

  function apply360Transform() {
    if (window.volvoStudioViewer) {
      window.volvoStudioViewer.setAngle(bus360Angle);
    }
    const angleText = $('#angleDisplay');
    if (angleText) angleText.textContent = `${bus360Angle}°`;
    const slider = $('#bus360Slider');
    if (slider) slider.value = bus360Angle;
  }

  window.zoomIn360 = function() {
    if (window.volvoStudioViewer) {
      window.volvoStudioViewer.zoomIn();
    }
    if (window.Volvo3DTracker?.controls) {
      window.Volvo3DTracker.controls.dollyIn(1.2);
      window.Volvo3DTracker.controls.update();
    }
  };

  window.zoomOut360 = function() {
    if (window.volvoStudioViewer) {
      window.volvoStudioViewer.zoomOut();
    }
    if (window.Volvo3DTracker?.controls) {
      window.Volvo3DTracker.controls.dollyOut(1.2);
      window.Volvo3DTracker.controls.update();
    }
  };

  window.reset360View = function() {
    if (window.volvoStudioViewer) {
      window.volvoStudioViewer.reset();
    }
    if (window.Volvo3DTracker) {
      window.Volvo3DTracker.resetCamera();
    }
    bus360Angle = 0;
    apply360Transform();
    $$('.preset-angle-btn').forEach(b => b.classList.remove('active'));
    $('#presetFront')?.classList.add('active');
  };

  window.setPresetAngle = function(angle, type) {
    const mapping = {
      'Front': 'front',
      'Left': 'left',
      'Rear': 'rear',
      'Right': 'right',
      'Interior': 'top',
      'Exterior': 'front-left'
    };
    const view = mapping[type] || 'front-left';
    if (window.volvoStudioViewer) {
      window.volvoStudioViewer.setCameraView(view);
    }
    if (window.Volvo3DTracker) {
      window.Volvo3DTracker.setCameraView(view);
    }
    bus360Angle = Number(angle);
    apply360Transform();
    $$('.preset-angle-btn').forEach(b => b.classList.remove('active'));
    if (type) $(`#preset${type}`)?.classList.add('active');
  };

  // Drag-to-rotate setup
  function initDragToRotate() {
    const stage = $('#bus360Stage') || $('.bus-3d-stage');
    if (!stage) return;
    let isDragging = false;
    let startX = 0;

    const onStart = (clientX) => {
      isDragging = true;
      startX = clientX;
      if (isAutoRotating) window.toggleAuto360Rotation();
    };

    const onMove = (clientX) => {
      if (!isDragging) return;
      const deltaX = clientX - startX;
      startX = clientX;
      bus360Angle = (bus360Angle + Math.round(deltaX * 0.8) + 360) % 360;
      apply360Transform();
    };

    const onEnd = () => { isDragging = false; };

    stage.addEventListener('mousedown', e => onStart(e.clientX));
    window.addEventListener('mousemove', e => onMove(e.clientX));
    window.addEventListener('mouseup', onEnd);

    stage.addEventListener('touchstart', e => {
      if (e.touches.length === 1) onStart(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchmove', e => {
      if (e.touches.length === 1) onMove(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchend', onEnd);
  }

  // ----------------------------------------------------------------------------
  // 6. AI TRAVEL ASSISTANT CHATBOT CONTROLLER
  // ----------------------------------------------------------------------------
  window.toggleAIChat = function() {
    const modal = $('#aiChatModal');
    if (modal) {
      modal.hidden = !modal.hidden;
      if (!modal.hidden) {
        $('#aiChatInput')?.focus();
      }
    }
  };

  const AI_KNOWLEDGE = [
    {
      keywords: ['where', 'track', 'location', 'kahan', 'up32ab1234', 'up32'],
      reply: '🚍 Bus UP32 AB 1234 (Delhi ➔ Lucknow) is currently on the Purvanchal Expressway near Mile 148. Current Speed: 62 KM/H. Remaining Distance: 42 KM. Status: On Route.'
    },
    {
      keywords: ['arrive', 'when', 'time', 'eta', 'kab'],
      reply: '⏱️ AI Estimated Arrival (ETA) is 08:35 PM at Lucknow Alambagh Terminal. AI traffic analysis indicates 94% on-time arrival probability.'
    },
    {
      keywords: ['luggage', 'carry', 'weight', 'allowed', 'allowance', 'kitna', 'saman'],
      reply: '🧳 Up to 15 KG of luggage is 100% FREE per passenger! If your baggage exceeds 15 KG, extra luggage is charged transparently at ₹30 per extra KG.'
    },
    {
      keywords: ['charge', 'extra', 'fee', 'rate', 'cost', 'shulk'],
      reply: '⚖️ Extra baggage above 15 KG is charged at ₹30/kg. For example: 20 KG has 5 KG extra = ₹150; 25 KG has 10 KG extra = ₹300.'
    },
    {
      keywords: ['available', 'delhi to jaipur', 'lucknow', 'delhi', 'buses'],
      reply: '🛣️ We have multiple daily high-speed services connecting Delhi, Lucknow, Jaipur, Mumbai & Pune with luxury AC Sleepers and Volvo coaches.'
    },
    {
      keywords: ['cancel', 'refund'],
      reply: '🎫 Cancellations made up to 4 hours before departure receive an instant 90% refund directly to the original payment mode.'
    }
  ];

  window.sendChatMessage = function(customText) {
    const input = $('#aiChatInput');
    const text = (customText || input?.value || '').trim();
    if (!text) return;
    if (input) input.value = '';

    const container = $('#aiChatMessages');
    if (!container) return;

    // Add user bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble bubble-user';
    userBubble.textContent = text;
    container.appendChild(userBubble);

    // Bot reply match
    const lower = text.toLowerCase();
    let reply = '🤖 I am your AI Bus Track Assistant. You can track buses in real-time, inspect 360° coach views, calculate luggage fees (15 KG free), or book trips across 50+ cities!';
    for (const item of AI_KNOWLEDGE) {
      if (item.keywords.some(k => lower.includes(k))) {
        reply = item.reply;
        break;
      }
    }

    setTimeout(() => {
      const botBubble = document.createElement('div');
      botBubble.className = 'chat-bubble bubble-bot';
      botBubble.textContent = reply;
      container.appendChild(botBubble);
      container.scrollTop = container.scrollHeight;
    }, 400);

    container.scrollTop = container.scrollHeight;
  };

  window.fillChatPrompt = function(promptText) {
    window.sendChatMessage(promptText);
  };

  function initShowcaseLiveMap() {
    const el = document.getElementById('showcaseLiveMap');
    if (!el || typeof L === 'undefined') return;
    try {
      const delhi = [28.6692, 77.2285];
      const lucknow = [26.8467, 80.9462];
      const currentBusPos = [27.35, 79.50];

      const map = L.map('showcaseLiveMap', {
        center: [27.7, 79.1],
        zoom: 7,
        zoomControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Route Polyline
      const polyline = L.polyline([delhi, [28.2, 78.1], [27.8, 78.8], currentBusPos, [27.0, 80.2], lucknow], {
        color: '#38bdf8',
        weight: 5,
        opacity: 0.85
      }).addTo(map);

      // Markers
      L.circleMarker(delhi, { radius: 6, color: '#fff', fillColor: '#10b981', fillOpacity: 1, weight: 2 })
        .addTo(map).bindPopup('<b>Delhi Kashmiri Gate</b><br>Origin Departure Point');

      L.circleMarker(lucknow, { radius: 6, color: '#fff', fillColor: '#a91d32', fillOpacity: 1, weight: 2 })
        .addTo(map).bindPopup('<b>Lucknow Alambagh Terminal</b><br>Final Arrival Point');

      const busIcon = L.divIcon({
        className: '',
        html: '<div style="background:#facc15; color:#0f172a; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #0f172a; font-weight:800; font-size:14px; box-shadow:0 0 14px rgba(250,204,21,0.9);">🚌</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const busMarker = L.marker(currentBusPos, { icon: busIcon }).addTo(map)
        .bindPopup('<b>UP32 AB 1234</b><br>Current Speed: 62 KM/H<br>ETA: 08:35 PM');

      // Live animated simulated marker movement
      let step = 0;
      setInterval(() => {
        step = (step + 1) % 100;
        const lat = 27.35 + (step * 0.004);
        const lng = 79.50 + (step * 0.008);
        if (busMarker) busMarker.setLatLng([lat, lng]);
      }, 4000);
    } catch (_) {}
  }

  // ----------------------------------------------------------------------------
  // 13. 5 KM PASSENGER PROXIMITY GEOFENCE RADAR & URGENT ALERT SYSTEM
  // ----------------------------------------------------------------------------
  const geofenceState = {
    passengerName: 'Rajesh Verma',
    passengerPhone: '+91 98765 43210',
    busNo: 'UP32 AB 1234',
    route: 'Delhi ➔ Lucknow Express',
    originStop: 'Delhi Kashmere Gate ISBT (Bay 04)',
    seatNo: 'Seat 14A (Window)',
    distanceKm: 8.5,
    hasReachedOrigin: false,
    alertActive: false,
    alarmAudioEnabled: true
  };

  function playWarningAlarmSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (_) {}
  }

  function speakHindiGeofenceWarning() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `सावधान! आपकी बस ओरिजिन स्टॉप से 5 किलोमीटर दूर है! कृपया जल्द से जल्द बोर्डिंग प्लेटफार्म 4 पर पहुंचिए नहीं तो आपकी बस छूट जाएगी!`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }

  window.updateGeofenceUI = function() {
    const distEl = document.getElementById('geofenceBusDistanceVal');
    const etaEl = document.getElementById('geofenceBusEtaVal');
    const badgeEl = document.getElementById('geofenceStatusBadge');
    const panelEl = document.getElementById('geofenceRadarPanel');
    const btnEnRoute = document.getElementById('btnPassengerEnRoute');
    const btnAtStation = document.getElementById('btnPassengerAtStation');
    const slider = document.getElementById('geofenceDistanceSlider');

    const dist = Number(geofenceState.distanceKm);
    const etaMin = Math.max(1, Math.round(dist * 1.5));

    if (distEl) distEl.textContent = `${dist.toFixed(1)} KM`;
    if (etaEl) etaEl.textContent = `In ${etaMin} Mins`;
    if (slider) slider.value = dist;

    if (btnEnRoute) btnEnRoute.classList.toggle('active', !geofenceState.hasReachedOrigin);
    if (btnAtStation) btnAtStation.classList.toggle('active', geofenceState.hasReachedOrigin);

    const isWithin5Km = dist <= 5.0;
    const shouldAlarm = isWithin5Km && !geofenceState.hasReachedOrigin;

    if (panelEl) {
      panelEl.classList.toggle('alert-active', shouldAlarm);
    }

    if (badgeEl) {
      if (geofenceState.hasReachedOrigin) {
        badgeEl.className = 'geofence-status-badge status-badge-safe';
        badgeEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> ✓ AT ORIGIN STATION (SAFE)';
      } else if (shouldAlarm) {
        badgeEl.className = 'geofence-status-badge status-badge-urgent';
        badgeEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 🚨 5 KM ALERT: HURRY UP!';
      } else {
        badgeEl.className = 'geofence-status-badge';
        badgeEl.style.background = '#1e293b';
        badgeEl.style.color = '#38bdf8';
        badgeEl.innerHTML = '<i class="fa-solid fa-clock"></i> ON TRACK (BUS DISTANT)';
      }
    }

    // Modal popup trigger
    const modal = document.getElementById('modalGeofenceUrgent');
    if (shouldAlarm && !geofenceState.alertActive) {
      geofenceState.alertActive = true;
      if (modal) modal.hidden = false;
      playWarningAlarmSound();
      speakHindiGeofenceWarning();
    } else if (!shouldAlarm && modal) {
      modal.hidden = true;
      geofenceState.alertActive = false;
    }
  };

  window.setPassengerOriginStatus = function(hasReached) {
    geofenceState.hasReachedOrigin = Boolean(hasReached);
    if (hasReached) {
      window.dismissGeofenceAlertModal();
    }
    window.updateGeofenceUI();
  };

  window.setBusGeofenceDistance = function(distance) {
    geofenceState.distanceKm = Number(distance);
    window.updateGeofenceUI();
  };

  window.trigger5KmAlertSimulation = function() {
    geofenceState.hasReachedOrigin = false;
    geofenceState.distanceKm = 4.8;
    geofenceState.alertActive = false;
    window.updateGeofenceUI();
  };

  window.dismissGeofenceAlertModal = function() {
    const modal = document.getElementById('modalGeofenceUrgent');
    if (modal) modal.hidden = true;
    geofenceState.alertActive = false;
  };

  window.markPassengerArrivedAtOriginStation = function() {
    window.setPassengerOriginStatus(true);
    window.dismissGeofenceAlertModal();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('आप सुरक्षित रूप से बोर्डिंग स्टेशन पहुंच चुके हैं। शुभ यात्रा!');
      utterance.lang = 'hi-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    // Initial luggage calculator state: 15 kg (Free limit)
    window.setCalculatorWeight(15);

    // Initial 360 Bus view: 0 degrees
    if (typeof window.initVolvoStudioViewer === 'function' && document.getElementById('bus360Canvas')) {
      window.initVolvoStudioViewer('bus360Canvas');
    }
    window.setBus360Angle(0);

    // Init Drag-to-rotate interaction
    initDragToRotate();

    // Init Live Showcase Map
    setTimeout(initShowcaseLiveMap, 300);

    // Init 5 KM Geofence Radar
    window.updateGeofenceUI();

    // Start panorama auto slide every 6 seconds
    slideTimer = setInterval(() => {
      window.nextSlide();
    }, 6000);
  });
})();
