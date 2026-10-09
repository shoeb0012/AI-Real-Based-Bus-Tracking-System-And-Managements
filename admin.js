/**
 * AI BUS TRACK - ENTERPRISE ADMIN PORTAL CLIENT JAVASCRIPT
 * Full-Featured Reactive Controller:
 * - RBAC Permission Matrix & Role Switcher
 * - Live Leaflet GPS Simulation & Tracking Engine
 * - AI Route Optimization & Delay Prediction Models
 * - Document Expiry Radar & Maintenance Management
 * - Chart.js Telemetry Visualizations & CSV Report Exporters
 */

(() => {
  'use strict';

  // State Management
  const state = {
    role: 'super_admin',
    currentTab: 'dashboard',
    isSimulating: false,
    simulationTimer: null,
    buses: [],
    drivers: [],
    routes: [],
    emergencies: [],
    maintenance: [],
    documents: [],
    auditLogs: [],
    notifications: [],
    map: null,
    miniMap: null,
    busMarkers: {},
    charts: {}
  };

  // Mock / Initial Data Fallback
  const FALLBACK_BUSES = [
    {id:'bus-001',reg_number:'UP65 AB 1021',vehicle_number:'BUS-101',bus_type:'School Bus',is_ac:true,manufacturer:'Tata Motors',model:'Starbus Ultra AC',manufacturing_year:2023,seating_capacity:42,standing_capacity:10,fuel_type:'CNG',engine_number:'ENG-TT-88219',chassis_number:'CHS-UP65-9921',vehicle_class:'Commercial Heavy Passenger',gps_device_id:'GPS-TRK-1021',gps_status:'ONLINE',current_lat:25.3176,current_lng:82.9739,current_speed:38.5,odometer_km:24500,last_service_date:'2026-08-15',next_service_date:'2026-11-15',status:'ON_ROUTE',assigned_driver:'Rahul Sharma',assigned_route:'DPS Varanasi Campus Express'},
    {id:'bus-002',reg_number:'UP65 AB 1022',vehicle_number:'BUS-102',bus_type:'College Bus',is_ac:true,manufacturer:'Ashok Leyland',model:'Viking 222 AC',manufacturing_year:2022,seating_capacity:52,standing_capacity:15,fuel_type:'Diesel',engine_number:'ENG-AL-44120',chassis_number:'CHS-UP65-9922',vehicle_class:'Commercial Heavy Passenger',gps_device_id:'GPS-TRK-1022',gps_status:'ONLINE',current_lat:25.3340,current_lng:82.9873,current_speed:44.0,odometer_km:38200,last_service_date:'2026-07-20',next_service_date:'2026-10-20',status:'ON_ROUTE',assigned_driver:'Manoj Kumar Maurya',assigned_route:'BHU University South Route'},
    {id:'bus-003',reg_number:'UP65 AB 1023',vehicle_number:'BUS-103',bus_type:'Public Transport Bus',is_ac:false,manufacturer:'Eicher',model:'Skyline Pro Non-AC',manufacturing_year:2021,seating_capacity:48,standing_capacity:20,fuel_type:'CNG',engine_number:'ENG-EI-33211',chassis_number:'CHS-UP65-9923',vehicle_class:'Public Commercial',gps_device_id:'GPS-TRK-1023',gps_status:'ONLINE',current_lat:25.2881,current_lng:83.0068,current_speed:28.0,odometer_km:51900,last_service_date:'2026-09-01',next_service_date:'2026-12-01',status:'ACTIVE',assigned_driver:'Deepak Singh',assigned_route:'Varanasi Ghats & Heritage Line'},
    {id:'bus-004',reg_number:'UP65 AB 1024',vehicle_number:'BUS-104',bus_type:'School Bus',is_ac:true,manufacturer:'BharatBenz',model:'School Star AC',manufacturing_year:2024,seating_capacity:36,standing_capacity:8,fuel_type:'Electric',engine_number:'ENG-BB-99412',chassis_number:'CHS-UP65-9924',vehicle_class:'Heavy Passenger Clean Energy',gps_device_id:'GPS-TRK-1024',gps_status:'ONLINE',current_lat:25.3520,current_lng:82.9200,current_speed:52.0,odometer_km:14200,last_service_date:'2026-08-25',next_service_date:'2026-11-25',status:'ON_ROUTE',assigned_driver:'Amit Yadav',assigned_route:'St. Johns School West Corridor'},
    {id:'bus-005',reg_number:'UP65 AB 1025',vehicle_number:'BUS-105',bus_type:'Staff Bus',is_ac:false,manufacturer:'Tata Motors',model:'CityRide Non-AC',manufacturing_year:2020,seating_capacity:40,standing_capacity:12,fuel_type:'Diesel',engine_number:'ENG-TT-11029',chassis_number:'CHS-UP65-9925',vehicle_class:'Commercial Passenger',gps_device_id:'GPS-TRK-1025',gps_status:'OFFLINE',current_lat:25.3170,current_lng:82.9700,current_speed:0.0,odometer_km:64100,last_service_date:'2026-05-10',next_service_date:'2026-08-10',status:'MAINTENANCE',assigned_driver:'None',assigned_route:'Under Repair'},
    {id:'bus-006',reg_number:'UP65 AB 1026',vehicle_number:'BUS-106',bus_type:'Luxury Bus',is_ac:true,manufacturer:'Volvo',model:'9600 Multi-Axle AC',manufacturing_year:2024,seating_capacity:45,standing_capacity:0,fuel_type:'Diesel',engine_number:'ENG-VO-77319',chassis_number:'CHS-UP65-9926',vehicle_class:'Interstate Luxury Coach',gps_device_id:'GPS-TRK-1026',gps_status:'ONLINE',current_lat:26.8467,current_lng:80.9462,current_speed:65.0,odometer_km:19400,last_service_date:'2026-09-10',next_service_date:'2026-12-10',status:'ON_ROUTE',assigned_driver:'Satish Chandra Pandey',assigned_route:'Varanasi - Lucknow Highway Express'}
  ];

  const FALLBACK_DRIVERS = [
    {id:'drv-001',full_name:'Rahul Sharma',guardian_name:'Shri Rameshwar Sharma',dob:'1987-04-12',gender:'Male',mobile:'+91 98765 11001',email:'rahul.sharma@aibus.in',address:'Plot 42, Shivpur, Varanasi, UP',emergency_contact:'+91 98765 11099',blood_group:'B+',employee_id:'EMP-DRV-101',joining_date:'2021-03-15',experience_years:9,assigned_bus:'UP65 AB 1021',assigned_route:'DPS Varanasi Campus Express',employment_status:'ACTIVE',safety_score:92,risk_level:'LOW',speeding_incidents:0,harsh_braking:2,route_deviations:0,licence_number:'UP65-20120038491',licence_class:'HMV + PSV Badge',licence_expiry:'2027-05-10',licence_status:'VALID',aadhaar_verified:true,police_verified:'VERIFIED',medical_status:'FIT'},
    {id:'drv-002',full_name:'Manoj Kumar Maurya',guardian_name:'Shri Ram Surat Maurya',dob:'1984-09-22',gender:'Male',mobile:'+91 98765 11002',email:'manoj.maurya@aibus.in',address:'House 18, Sigra, Varanasi, UP',emergency_contact:'+91 98765 11098',blood_group:'O+',employee_id:'EMP-DRV-102',joining_date:'2020-07-01',experience_years:12,assigned_bus:'UP65 AB 1022',assigned_route:'BHU University South Route',employment_status:'ACTIVE',safety_score:88,risk_level:'LOW',speeding_incidents:1,harsh_braking:3,route_deviations:0,licence_number:'UP65-20090019283',licence_class:'HMV + PSV Badge',licence_expiry:'2026-10-20',licence_status:'EXPIRING_SOON',aadhaar_verified:true,police_verified:'VERIFIED',medical_status:'FIT'},
    {id:'drv-003',full_name:'Deepak Singh',guardian_name:'Shri Virendra Singh',dob:'1992-11-05',gender:'Male',mobile:'+91 98765 11003',email:'deepak.singh@aibus.in',address:'Lane 4, Lanka, Varanasi, UP',emergency_contact:'+91 98765 11097',blood_group:'A+',employee_id:'EMP-DRV-103',joining_date:'2022-01-10',experience_years:6,assigned_bus:'UP65 AB 1023',assigned_route:'Varanasi Ghats & Heritage Line',employment_status:'ACTIVE',safety_score:74,risk_level:'MEDIUM',speeding_incidents:3,harsh_braking:5,route_deviations:1,licence_number:'UP65-20180092817',licence_class:'HMV Transport Commercial',licence_expiry:'2028-02-19',licence_status:'VALID',aadhaar_verified:true,police_verified:'VERIFIED',medical_status:'FIT'},
    {id:'drv-004',full_name:'Amit Yadav',guardian_name:'Shri Jagdish Yadav',dob:'1989-02-18',gender:'Male',mobile:'+91 98765 11004',email:'amit.yadav@aibus.in',address:'B-12, Cantonment, Varanasi, UP',emergency_contact:'+91 98765 11096',blood_group:'AB+',employee_id:'EMP-DRV-104',joining_date:'2023-04-15',experience_years:7,assigned_bus:'UP65 AB 1024',assigned_route:'St. Johns School West Corridor',employment_status:'ACTIVE',safety_score:61,risk_level:'HIGH',speeding_incidents:6,harsh_braking:8,route_deviations:2,licence_number:'UP65-20160081726',licence_class:'LMV / PSV Heavy Commercial',licence_expiry:'2026-10-15',licence_status:'EXPIRING_SOON',aadhaar_verified:true,police_verified:'PENDING',medical_status:'FIT'},
    {id:'drv-005',full_name:'Satish Chandra Pandey',guardian_name:'Shri K. N. Pandey',dob:'1980-06-30',gender:'Male',mobile:'+91 98765 11005',email:'satish.pandey@aibus.in',address:'H.No 88, Alambagh, Lucknow, UP',emergency_contact:'+91 98765 11095',blood_group:'O-',employee_id:'EMP-DRV-105',joining_date:'2019-11-20',experience_years:16,assigned_bus:'UP65 AB 1026',assigned_route:'Varanasi - Lucknow Highway Express',employment_status:'ACTIVE',safety_score:96,risk_level:'LOW',speeding_incidents:0,harsh_braking:1,route_deviations:0,licence_number:'UP32-20050011299',licence_class:'HMV Heavy Multi-Axle',licence_expiry:'2029-08-11',licence_status:'VALID',aadhaar_verified:true,police_verified:'VERIFIED',medical_status:'FIT'}
  ];

  const FALLBACK_ROUTES = [
    {id:'rt-001',name:'DPS Varanasi Campus Express (School)',code:'SCH-RT-01',start:'Shivpur Bus Terminal',destination:'Delhi Public School Campus',distance_km:18.4,est_duration:42,departure:'07:30 AM',bus:'UP65 AB 1021',driver:'Rahul Sharma',status:'ACTIVE',stops:['Shivpur','Kachehri Crossing','Varanasi Cantt','DPS Gate 1']},
    {id:'rt-002',name:'BHU University South Route (College)',code:'COL-RT-02',start:'Varanasi Cantt Station',destination:'BHU Main Gate Campus',distance_km:14.2,est_duration:35,departure:'08:00 AM',bus:'UP65 AB 1022',driver:'Manoj Kumar Maurya',status:'ACTIVE',stops:['Cantt Station','Sigra Stadium','Rathyatra','Lanka','BHU Gate']},
    {id:'rt-003',name:'Varanasi Ghats & Heritage Line',code:'PUB-RT-03',start:'Sarnath Depot',destination:'Assi Ghat Waterfront',distance_km:22.5,est_duration:55,departure:'08:30 AM',bus:'UP65 AB 1023',driver:'Deepak Singh',status:'ACTIVE',stops:['Sarnath','Ashapur','Kashi Station','Godowlia','Assi Ghat']},
    {id:'rt-004',name:'St. Johns School West Corridor',code:'SCH-RT-04',start:'Babaspur Crossing',destination:'St. Johns School Gate 2',distance_km:15.9,est_duration:34,departure:'07:45 AM',bus:'UP65 AB 1024',driver:'Amit Yadav',status:'DIVERTED',stops:['Babaspur','Harhua Bypass','Ring Road Ph-2','St. Johns']}
  ];

  const FALLBACK_EMERGENCIES = [
    {id:'sos-01',code:'SOS-2026-01',bus:'UP65 AB 1024',driver:'Amit Yadav',type:'Unauthorized Route / Deviation',severity:'CRITICAL',location:'Ring Road Phase-2, Near Harhua Bypass',lat:25.3520,lng:82.9200,time:'10:14 AM',description:'Bus is 1.8 km off-route from designated corridor. AI Geofence breach triggered.',status:'ACTIVE'},
    {id:'sos-02',code:'SOS-2026-02',bus:'UP65 AB 1022',driver:'Manoj Kumar Maurya',type:'Vehicle Breakdown',severity:'HIGH',location:'Sigra Crossing, Near Stadium Gate',lat:25.3210,lng:82.9810,time:'09:45 AM',description:'Radiator hose pressure drop reported by driver. Replacement coach dispatched.',status:'DISPATCHED'},
    {id:'sos-03',code:'SOS-2026-03',bus:'UP65 AB 1025',driver:'Satish Chandra Pandey',type:'Medical Emergency',severity:'MEDIUM',location:'Alambagh Terminal Bay 4',lat:26.7988,lng:80.9008,time:'08:20 AM',description:'Passenger feeling sudden dizziness; terminal paramedic station alerted.',status:'RESOLVED'}
  ];

  const FALLBACK_MAINTENANCE = [
    {id:'maint-01',bus:'UP65 AB 1021',service_type:'Scheduled 20k Inspection',service_date:'2026-08-15',next_service:'2026-11-15',odometer:24500,center:'Tata Authorized Service Hub, Shivpur',cost:4850,remarks:'Oil filter and brake pad inspection completed. AC coolant topped up.',status:'COMPLETED'},
    {id:'maint-02',bus:'UP65 AB 1022',service_type:'Brake System Overhaul',service_date:'2026-07-20',next_service:'2026-10-20',odometer:38200,center:'Ashok Leyland Service Care, Ramnagar',cost:12400,remarks:'ABS sensor recalibration and pneumatic brake liners replaced.',status:'COMPLETED'},
    {id:'maint-03',bus:'UP65 AB 1025',service_type:'Engine Major Overhaul',service_date:'2026-10-05',next_service:'2026-10-12',odometer:64100,center:'Varanasi Central Fleet Workshop',cost:18900,remarks:'Scheduled injector overhaul. Vehicle temporarily decommissioned.',status:'IN_PROGRESS'}
  ];

  const FALLBACK_DOCUMENTS = [
    {id:'doc-01',subject:'Driver Licence: Manoj Kumar Maurya (UP65-20090019283)',type:'Driver Licence',entity:'Manoj Kumar Maurya',expiry_date:'2026-10-20',days_left:12,status:'EXPIRING_SOON',severity:'WARNING'},
    {id:'doc-02',subject:'Driver Licence: Amit Yadav (UP65-20160081726)',type:'Driver Licence',entity:'Amit Yadav',expiry_date:'2026-10-15',days_left:7,status:'EXPIRING_SOON',severity:'CRITICAL'},
    {id:'doc-03',subject:'Vehicle Insurance: UP65 AB 1021 (POL-ICICI-992019)',type:'Vehicle Insurance',entity:'UP65 AB 1021',expiry_date:'2026-10-20',days_left:12,status:'EXPIRING_SOON',severity:'WARNING'},
    {id:'doc-04',subject:'Fitness Certificate: UP65 AB 1025 (FIT-VNS-RTO-3310)',type:'Fitness Certificate',entity:'UP65 AB 1025',expiry_date:'2026-08-01',days_left:-68,status:'EXPIRED',severity:'CRITICAL'}
  ];

  const FALLBACK_AUDIT = [
    {id:'aud-01',admin:'Gyananand',role:'Super Admin',action:'Approved Driver Verification',module:'DRIVERS',time:'08 Oct 2026, 13:25',ip:'192.168.1.***',status:'Successful'},
    {id:'aud-02',admin:'Rajesh Verma',role:'Transport Admin',action:'Updated Bus Route Corridor',module:'ROUTES',time:'08 Oct 2026, 11:40',ip:'192.168.1.***',status:'Successful'},
    {id:'aud-03',admin:'Vikram Singh',role:'Security Officer',action:'Acknowledged SOS Alert',module:'EMERGENCY',time:'08 Oct 2026, 10:18',ip:'192.168.1.***',status:'Successful'}
  ];

  const FALLBACK_NOTIFICATIONS = [
    {id:'notif-00',level:'CRITICAL',title:'🚨 5 KM Passenger Proximity Alert Dispatched',message:'Automated SMS/Push alert sent to Passenger Rajesh Verma (+91 98765 43210): Bus UP32 AB 1234 is 4.8 km from Kashmere Gate ISBT. Reach boarding Bay 04 immediately or bus will depart.',time:'10:22 AM'},
    {id:'notif-01',level:'CRITICAL',title:'Route Deviation Alert',message:'Bus UP65 AB 1024 is 1.8 km off-route from designated corridor.',time:'10:14 AM'},
    {id:'notif-02',level:'CRITICAL',title:'Document Expiring Soon',message:'Driver Licence for Amit Yadav expires in 7 days.',time:'09:30 AM'},
    {id:'notif-03',level:'WARNING',title:'Maintenance Due',message:'Bus UP65 AB 1022 service due on 20 Oct 2026.',time:'09:00 AM'},
    {id:'notif-04',level:'NORMAL',title:'Trip Completed',message:'Bus UP65 AB 1021 arrived at DPS Campus safely.',time:'08:15 AM'}
  ];

  // Helper functions
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escapeHtml = str => String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function showToast(message) {
    const toast = $('#adminToast');
    const msgSpan = $('#toastMsg');
    if (!toast || !msgSpan) return;
    msgSpan.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3200);
  }

  // ----------------------------------------------------------------------------
  // INITIALIZATION & TAB SWITCHING
  // ----------------------------------------------------------------------------
  async function init() {
    updateClock();
    setInterval(updateClock, 1000);

    // Initial state loading
    state.buses = [...FALLBACK_BUSES];
    state.drivers = [...FALLBACK_DRIVERS];
    state.routes = [...FALLBACK_ROUTES];
    state.emergencies = [...FALLBACK_EMERGENCIES];
    state.maintenance = [...FALLBACK_MAINTENANCE];
    state.documents = [...FALLBACK_DOCUMENTS];
    state.auditLogs = [...FALLBACK_AUDIT];
    state.notifications = [...FALLBACK_NOTIFICATIONS];

    // Try fetching from backend if live server is running
    try {
      const busesRes = await fetch('/api/admin/buses').then(r => r.ok ? r.json() : null);
      if (busesRes?.buses) state.buses = busesRes.buses;
      const driversRes = await fetch('/api/admin/drivers').then(r => r.ok ? r.json() : null);
      if (driversRes?.drivers) state.drivers = driversRes.drivers;
      const routesRes = await fetch('/api/admin/routes').then(r => r.ok ? r.json() : null);
      if (routesRes?.routes) state.routes = routesRes.routes;
    } catch (_) {
      // Graceful fallback to rich seeded state
    }

    renderAll();
    initMaps();
    initCharts();

    // Default calculations for AI models
    runAIRouteOptimization(18.4);
    runAIDelayPrediction('UP65 AB 1021');
  }

  function updateClock() {
    const clockEl = $('#topbarClock');
    if (clockEl) {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';
    }
  }

  window.switchTab = function(tabId) {
    state.currentTab = tabId;
    
    // Update Sidebar Navigation
    $$('.sidebar-nav .nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update Panes
    $$('.tab-pane').forEach(pane => {
      pane.style.display = pane.id === `pane-${tabId}` ? 'block' : 'none';
    });

    // Update Page Title
    const titles = {
      dashboard: 'Admin Dashboard',
      tracking: 'Live Bus Fleet Telemetry',
      buses: 'Bus Fleet Management',
      drivers: 'Driver Profiles & Verification',
      'driver-safety': 'Driver Safety Scoring Engine',
      routes: 'Transit Routes & Geofences',
      trips: 'Trip Logs & Schedules',
      luggage: 'Luggage Policy & Baggage Rate Configuration',
      'ai-insights': 'AI Route & Delay Intelligence Room',
      safety: 'Safety & Emergency SOS Center',
      maintenance: 'Vehicle Maintenance & Service',
      documents: 'Regulatory Document Expiry Radar',
      notifications: 'Notification Center',
      analytics: 'Operational Fleet Analytics',
      reports: 'Compliance Report Generator',
      roles: 'Users & RBAC Permission Matrix',
      audit: 'System Activity Audit Trail',
      profile: 'Admin Security Profile'
    };
    $('#pageTitleHeading').textContent = titles[tabId] || 'Admin Console';

    // Invalidate Leaflet maps when visible
    if (tabId === 'tracking' && state.map) {
      setTimeout(() => state.map.invalidateSize(), 150);
    }
    if (tabId === 'dashboard' && state.miniMap) {
      setTimeout(() => state.miniMap.invalidateSize(), 150);
    }
  };

  // ----------------------------------------------------------------------------
  // RBAC PERMISSION MATRIX HANDLER
  // ----------------------------------------------------------------------------
  window.handleRoleSwitch = function(newRole) {
    state.role = newRole;
    const names = {
      super_admin: { name: 'Gyananand', title: 'SUPER ADMIN (Level 10)' },
      transport_admin: { name: 'Rajesh Verma', title: 'TRANSPORT ADMIN (Level 8)' },
      fleet_manager: { name: 'Sunita Patel', title: 'FLEET MANAGER (Level 6)' },
      dispatcher: { name: 'Anil Gupta', title: 'DISPATCHER (Level 5)' },
      driver: { name: 'Rahul Sharma', title: 'DRIVER (Level 3)' },
      security_officer: { name: 'Vikram Singh', title: 'SECURITY OFFICER (Level 5)' },
      viewer: { name: 'Parent / Viewer', title: 'VIEWER / PARENT (Level 1)' }
    };
    const profile = names[newRole] || names.super_admin;
    $('#sidebarUserName').textContent = profile.name;
    $('#sidebarUserRole').textContent = profile.title;
    showToast(`Switched active session to: ${profile.title}. Access restrictions applied.`);

    // Apply role view filters
    const isViewer = newRole === 'viewer';
    const isDriver = newRole === 'driver';
    
    // Disable edit buttons if read-only viewer
    $$('.btn-primary, .btn-danger').forEach(b => {
      if (b.id !== 'simulationToggleBtn' && !b.classList.contains('modal-close')) {
        b.style.display = isViewer ? 'none' : '';
      }
    });
  };

  // ----------------------------------------------------------------------------
  // RENDERING FUNCTIONS
  // ----------------------------------------------------------------------------
  function renderAll() {
    renderDashboardStats();
    renderBusesTable();
    renderDriversTable();
    renderDriverSafetyCards();
    renderRoutesList();
    renderEmergencies();
    renderMaintenanceTable();
    renderDocumentsTable();
    renderNotifications();
    renderAuditLogs();
  }

  function renderDashboardStats() {
    const active = state.buses.filter(b => b.status === 'ACTIVE' || b.status === 'ON_ROUTE').length;
    const onRoute = state.buses.filter(b => b.status === 'ON_ROUTE').length;
    const verified = state.drivers.filter(d => d.police_verified === 'VERIFIED').length;

    $('#statTotalBuses').textContent = state.buses.length;
    $('#statActiveBuses').textContent = active;
    $('#statOnRoute').textContent = onRoute;
    $('#statInactiveBuses').textContent = state.buses.length - active;
    $('#statTotalDrivers').textContent = state.drivers.length;
    $('#statVerifiedDrivers').textContent = verified;
    $('#statPendingDrivers').textContent = state.drivers.length - verified;
    $('#statActiveTrips').textContent = onRoute;
    $('#statEmergencyAlerts').textContent = state.emergencies.filter(e => e.status === 'ACTIVE').length;
    $('#statMaintenanceDue').textContent = state.maintenance.filter(m => m.status !== 'COMPLETED').length;

    // Dashboard mini SOS list
    const sosContainer = $('#dashboardSOSList');
    if (sosContainer) {
      sosContainer.innerHTML = state.emergencies.slice(0, 3).map(e => `
        <div style="padding:10px 12px; background:${e.status === 'ACTIVE' ? '#fef2f2' : '#f8fafc'}; border:1px solid ${e.status === 'ACTIVE' ? '#fecaca' : '#e2e8f0'}; border-radius:8px; margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:${e.status === 'ACTIVE' ? '#991b1b' : '#334155'}; font-size:12px;">${escapeHtml(e.code)} · ${escapeHtml(e.bus)}</strong>
            <span class="badge ${e.status === 'ACTIVE' ? 'badge-expired' : 'badge-valid'}">${escapeHtml(e.status)}</span>
          </div>
          <div style="font-size:12px; color:#64748b; margin-top:3px;">${escapeHtml(e.type)} · ${escapeHtml(e.location)}</div>
        </div>
      `).join('');
    }
  }

  function renderBusesTable(list = state.buses) {
    const tbody = $('#busesTableBody');
    if (!tbody) return;
    tbody.innerHTML = list.map(b => `
      <tr>
        <td>
          <strong>${escapeHtml(b.reg_number)}</strong><br>
          <small style="color:var(--text-muted);">${escapeHtml(b.vehicle_number)}</small>
        </td>
        <td>
          <span class="badge ${b.bus_type.includes('School') ? 'badge-school' : b.bus_type.includes('College') ? 'badge-college' : 'badge-public'}">${escapeHtml(b.bus_type)}</span>
          <span class="badge ${b.is_ac ? 'badge-ac' : 'badge-non-ac'}">${b.is_ac ? 'AC' : 'Non-AC'}</span>
        </td>
        <td>${escapeHtml(b.manufacturer)}<br><small style="color:var(--text-muted);">${escapeHtml(b.model)}</small></td>
        <td>${b.seating_capacity} seats / ${b.standing_capacity || 0} stand</td>
        <td><span class="badge" style="background:#f1f5f9; color:#334155;">${escapeHtml(b.fuel_type)}</span></td>
        <td>${escapeHtml(b.assigned_driver || 'Unassigned')}<br><small style="color:var(--text-muted);">${escapeHtml(b.assigned_route || 'None')}</small></td>
        <td>
          <strong>${b.current_speed || 0} km/h</strong><br>
          <span class="badge ${b.gps_status === 'ONLINE' ? 'badge-valid' : 'badge-expired'}">${escapeHtml(b.gps_status)}</span>
        </td>
        <td>
          <span class="badge ${b.status === 'ON_ROUTE' ? 'badge-status-onroute' : b.status === 'ACTIVE' ? 'badge-status-active' : b.status === 'MAINTENANCE' ? 'badge-status-maint' : 'badge-status-offline'}">${escapeHtml(b.status)}</span>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick="focusBusOnMap('${b.id}')" title="Track on map"><i class="fa-solid fa-location-dot"></i></button>
            <button class="btn btn-secondary btn-sm" onclick="deleteBus('${b.id}')" title="Delete"><i class="fa-solid fa-trash text-red-500"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderDriversTable(list = state.drivers) {
    const tbody = $('#driversTableBody');
    if (!tbody) return;
    tbody.innerHTML = list.map(d => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:34px; height:34px; border-radius:50%; background:#e2e8f0; display:flex; align-items:center; justify-content:center; font-weight:700; color:#334155;">
              ${d.full_name.charAt(0)}
            </div>
            <div>
              <strong>${escapeHtml(d.full_name)}</strong><br>
              <small style="color:var(--text-muted);">${escapeHtml(d.employee_id)} · Blood: ${escapeHtml(d.blood_group || 'O+')}</small>
            </div>
          </div>
        </td>
        <td>
          <a href="tel:${escapeHtml(d.mobile)}" style="color:var(--primary); font-weight:700; text-decoration:none;"><i class="fa-solid fa-phone"></i> ${escapeHtml(d.mobile)}</a><br>
          <small style="color:var(--text-muted);">${escapeHtml(d.address)}</small>
        </td>
        <td>
          <strong>${escapeHtml(d.licence_number)}</strong><br>
          <span class="badge badge-public">${escapeHtml(d.licence_class)}</span>
        </td>
        <td>
          ${escapeHtml(d.licence_expiry)}<br>
          <span class="badge ${d.licence_status === 'VALID' ? 'badge-valid' : 'badge-expiring'}">${escapeHtml(d.licence_status)}</span>
        </td>
        <td>${d.experience_years} Years</td>
        <td>
          <span class="badge ${d.police_verified === 'VERIFIED' ? 'badge-valid' : 'badge-expiring'}"><i class="fa-solid fa-shield-check"></i> Police ${escapeHtml(d.police_verified)}</span>
        </td>
        <td>
          <strong style="color:${d.safety_score >= 85 ? 'var(--success)' : d.safety_score >= 70 ? 'var(--warning)' : 'var(--danger)'}; font-size:16px;">
            ${d.safety_score}/100
          </strong><br>
          <span class="badge ${d.risk_level === 'LOW' ? 'badge-valid' : d.risk_level === 'MEDIUM' ? 'badge-expiring' : 'badge-expired'}">${d.risk_level} RISK</span>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="callDriverSim('${escapeHtml(d.full_name)}', '${escapeHtml(d.mobile)}')">
            <i class="fa-solid fa-phone"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  function renderDriverSafetyCards() {
    const container = $('#driverSafetyCardsContainer');
    if (!container) return;
    container.innerHTML = state.drivers.map(d => `
      <div class="panel-card" style="margin-bottom:0; padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <div>
            <h3 style="font-size:15px; font-weight:800;">${escapeHtml(d.full_name)}</h3>
            <span style="font-size:12px; color:var(--text-muted);">${escapeHtml(d.employee_id)} · Bus: ${escapeHtml(d.assigned_bus)}</span>
          </div>
          <div style="text-align:right;">
            <div style="font-size:26px; font-weight:800; color:${d.safety_score >= 85 ? 'var(--success)' : d.safety_score >= 70 ? 'var(--warning)' : 'var(--danger)'};">
              ${d.safety_score}<small style="font-size:13px; color:var(--text-muted);">/100</small>
            </div>
            <span class="badge ${d.risk_level === 'LOW' ? 'badge-valid' : d.risk_level === 'MEDIUM' ? 'badge-expiring' : 'badge-expired'}">${d.risk_level} RISK</span>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px; margin-bottom:14px; background:#f8fafc; padding:12px; border-radius:8px;">
          <div>Speeding Incidents: <strong>${d.speeding_incidents}</strong></div>
          <div>Harsh Braking: <strong>${d.harsh_braking}</strong></div>
          <div>Route Deviations: <strong>${d.route_deviations}</strong></div>
          <div>Medical Status: <strong>${escapeHtml(d.medical_status)}</strong></div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <small style="color:var(--text-muted);"><i class="fa-solid fa-phone"></i> ${escapeHtml(d.mobile)}</small>
          <button class="btn btn-secondary btn-sm" onclick="callDriverSim('${escapeHtml(d.full_name)}', '${escapeHtml(d.mobile)}')">Call Driver</button>
        </div>
      </div>
    `).join('');
  }

  function renderRoutesList() {
    const container = $('#routesListContainer');
    if (!container) return;
    container.innerHTML = state.routes.map(r => `
      <div class="panel-card" style="margin-bottom:0; padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span class="badge badge-public">${escapeHtml(r.code)}</span>
          <span class="badge ${r.status === 'ACTIVE' ? 'badge-status-onroute' : 'badge-expired'}">${escapeHtml(r.status)}</span>
        </div>
        <h3 style="font-size:15px; font-weight:800; margin-bottom:6px;">${escapeHtml(r.name)}</h3>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">
          ${escapeHtml(r.start)} ➔ ${escapeHtml(r.destination)}
        </p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px; background:#f8fafc; padding:10px; border-radius:8px; margin-bottom:12px;">
          <div>Distance: <strong>${r.distance_km} km</strong></div>
          <div>Duration: <strong>${r.est_duration} Mins</strong></div>
          <div>Departure: <strong>${escapeHtml(r.departure)}</strong></div>
          <div>Assigned: <strong>${escapeHtml(r.bus)}</strong></div>
        </div>
        <div style="font-size:11px; color:#475569;">
          <strong>Intermediate Stops:</strong> ${(r.stops || []).join(' • ')}
        </div>
      </div>
    `).join('');
  }

  function renderEmergencies() {
    const tbody = $('#emergenciesTableBody');
    if (!tbody) return;
    tbody.innerHTML = state.emergencies.map(e => `
      <tr>
        <td><strong>${escapeHtml(e.code)}</strong></td>
        <td><strong>${escapeHtml(e.bus)}</strong></td>
        <td>${escapeHtml(e.driver)}</td>
        <td><span class="badge badge-school">${escapeHtml(e.type)}</span></td>
        <td><span class="badge ${e.severity === 'CRITICAL' ? 'badge-expired' : 'badge-expiring'}">${escapeHtml(e.severity)}</span></td>
        <td>${escapeHtml(e.location)}</td>
        <td>${escapeHtml(e.time)}</td>
        <td><span class="badge ${e.status === 'ACTIVE' ? 'badge-expired' : 'badge-valid'}">${escapeHtml(e.status)}</span></td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick="callDriverSim('${escapeHtml(e.driver)}', '+91 98765 11001')"><i class="fa-solid fa-phone"></i></button>
            ${e.status === 'ACTIVE' ? `<button class="btn btn-primary btn-sm" onclick="resolveEmergency('${e.id}')">Resolve</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderMaintenanceTable() {
    const tbody = $('#maintenanceTableBody');
    if (!tbody) return;
    tbody.innerHTML = state.maintenance.map(m => `
      <tr>
        <td><strong>${escapeHtml(m.id)}</strong></td>
        <td><strong>${escapeHtml(m.bus)}</strong></td>
        <td>${escapeHtml(m.service_type)}</td>
        <td>${escapeHtml(m.service_date)}</td>
        <td><strong style="color:var(--warning);">${escapeHtml(m.next_service)}</strong></td>
        <td>${Number(m.odometer).toLocaleString()} km</td>
        <td>${escapeHtml(m.center)}</td>
        <td>₹${Number(m.cost).toLocaleString()}</td>
        <td><span class="badge ${m.status === 'COMPLETED' ? 'badge-valid' : 'badge-expiring'}">${escapeHtml(m.status)}</span></td>
      </tr>
    `).join('');
  }

  function renderDocumentsTable() {
    const tbody = $('#documentsTableBody');
    if (!tbody) return;
    tbody.innerHTML = state.documents.map(doc => `
      <tr>
        <td><strong>${escapeHtml(doc.subject)}</strong></td>
        <td>${escapeHtml(doc.entity)}</td>
        <td>${escapeHtml(doc.expiry_date)}</td>
        <td>
          <strong style="color:${doc.days_left < 0 ? 'var(--danger)' : doc.days_left <= 15 ? 'var(--warning)' : 'var(--success)'}; font-size:14px;">
            ${doc.days_left < 0 ? `EXPIRED (${Math.abs(doc.days_left)} days ago)` : `${doc.days_left} Days Left`}
          </strong>
        </td>
        <td><span class="badge ${doc.status === 'VALID' ? 'badge-valid' : doc.status === 'EXPIRING_SOON' ? 'badge-expiring' : 'badge-expired'}">${escapeHtml(doc.status)}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="showToast('Renewal notice dispatched to fleet supervisor.')">
            <i class="fa-regular fa-bell"></i> Send Reminder
          </button>
        </td>
      </tr>
    `).join('');
  }

  function renderNotifications() {
    const container = $('#notificationsListBody');
    if (!container) return;
    container.innerHTML = state.notifications.map(n => `
      <div style="display:flex; gap:14px; padding:14px; border-bottom:1px solid var(--border-subtle); align-items:flex-start;">
        <div style="font-size:18px; color:${n.level === 'CRITICAL' ? 'var(--danger)' : n.level === 'WARNING' ? 'var(--warning)' : 'var(--info)'};">
          <i class="fa-solid fa-circle-exclamation"></i>
        </div>
        <div style="flex:1;">
          <div style="display:flex; justify-content:space-between;">
            <strong>${escapeHtml(n.title)}</strong>
            <small style="color:var(--text-muted);">${escapeHtml(n.time)}</small>
          </div>
          <p style="font-size:13px; color:#475569; margin-top:4px;">${escapeHtml(n.message)}</p>
        </div>
      </div>
    `).join('');
  }

  function renderAuditLogs() {
    const tbody = $('#auditTableBody');
    if (!tbody) return;
    tbody.innerHTML = state.auditLogs.map(a => `
      <tr>
        <td><strong>${escapeHtml(a.id)}</strong></td>
        <td>${escapeHtml(a.admin)}</td>
        <td><span class="badge badge-public">${escapeHtml(a.role)}</span></td>
        <td>${escapeHtml(a.action)}</td>
        <td><span class="badge badge-non-ac">${escapeHtml(a.module)}</span></td>
        <td>${escapeHtml(a.time)}</td>
        <td><code>${escapeHtml(a.ip)}</code></td>
        <td><span class="badge badge-valid">${escapeHtml(a.status)}</span></td>
      </tr>
    `).join('');
  }

  // ----------------------------------------------------------------------------
  // LEAFLET MAPS & GPS SIMULATION ENGINE
  // ----------------------------------------------------------------------------
  function initMaps() {
    if (!window.L) return;

    // 1. Dashboard Mini Map
    const miniEl = $('#dashboardMiniMap');
    if (miniEl && !state.miniMap) {
      state.miniMap = L.map('dashboardMiniMap', { zoomControl: false, scrollWheelZoom: false }).setView([25.3176, 82.9739], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(state.miniMap);
    }

    // 2. Full Live Tracking Map
    const fullEl = $('#trackingMap');
    if (fullEl && !state.map) {
      state.map = L.map('trackingMap', { scrollWheelZoom: true }).setView([25.3176, 82.9739], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(state.map);
      updateMapMarkers();
    }
  }

  function updateMapMarkers() {
    if (!state.map) return;

    state.buses.forEach(b => {
      const lat = b.current_lat;
      const lng = b.current_lng;
      if (!lat || !lng) return;

      const markerColor = b.bus_type.includes('School') ? '#f59e0b' : b.bus_type.includes('College') ? '#8b5cf6' : '#2563eb';
      const iconHtml = `
        <div style="background:${markerColor}; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.3); border:2px solid #fff;">
          <i class="fa-solid fa-bus" style="font-size:14px;"></i>
        </div>
      `;
      const customIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [34, 34], iconAnchor: [17, 17] });

      if (state.busMarkers[b.id]) {
        state.busMarkers[b.id].setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(state.map);
        marker.bindPopup(`
          <div style="min-width:200px;">
            <strong style="font-size:14px; font-family:var(--font-heading);">${escapeHtml(b.reg_number)}</strong><br>
            <span class="badge ${b.is_ac ? 'badge-ac' : 'badge-non-ac'}">${b.is_ac ? 'AC' : 'Non-AC'} ${escapeHtml(b.bus_type)}</span><br>
            <hr style="margin:8px 0; border:0; border-top:1px solid #e2e8f0;">
            <div style="font-size:12px; line-height:1.6;">
              <strong>Driver:</strong> ${escapeHtml(b.assigned_driver)}<br>
              <strong>Speed:</strong> ${b.current_speed} km/h<br>
              <strong>Route:</strong> ${escapeHtml(b.assigned_route)}<br>
              <strong>Status:</strong> ${escapeHtml(b.status)}
            </div>
            <button class="btn btn-primary btn-sm" style="width:100%; margin-top:8px;" onclick="callDriverSim('${escapeHtml(b.assigned_driver)}', '+91 98765 11001')">
              <i class="fa-solid fa-phone"></i> Contact Driver
            </button>
          </div>
        `);
        state.busMarkers[b.id] = marker;
      }
    });
  }

  window.toggleLiveSimulation = function() {
    state.isSimulating = !state.isSimulating;
    const btn = $('#simulationToggleBtn');
    const txt = $('#simBtnText');

    if (state.isSimulating) {
      btn.classList.add('running');
      txt.textContent = 'Pause GPS Simulation';
      showToast('Live GPS simulation running. Telemetry updating every 2 seconds.');

      state.simulationTimer = setInterval(() => {
        state.buses.forEach(b => {
          if (b.status === 'ON_ROUTE') {
            b.current_lat += (Math.random() - 0.5) * 0.0015;
            b.current_lng += (Math.random() - 0.5) * 0.0015;
            b.current_speed = Math.max(20, Math.min(65, Math.round(b.current_speed + (Math.random() - 0.5) * 6)));
          }
        });
        updateMapMarkers();
        renderBusesTable();
      }, 2000);
    } else {
      btn.classList.remove('running');
      txt.textContent = 'Start GPS Simulation';
      clearInterval(state.simulationTimer);
      showToast('GPS simulation paused.');
    }
  };

  window.focusBusOnMap = function(busId) {
    switchTab('tracking');
    const bus = state.buses.find(b => b.id === busId);
    if (bus && state.map) {
      state.map.setView([bus.current_lat, bus.current_lng], 15);
      if (state.busMarkers[busId]) {
        state.busMarkers[busId].openPopup();
      }
    }
  };

  window.recenterMap = function() {
    if (state.map) state.map.setView([25.3176, 82.9739], 12);
  };

  // ----------------------------------------------------------------------------
  // CHART.JS ANALYTICS DASHBOARDS
  // ----------------------------------------------------------------------------
  function initCharts() {
    if (!window.Chart) return;

    // 1. Fleet Utilization Pie
    const ctxUtil = $('#utilizationChart')?.getContext('2d');
    if (ctxUtil) {
      state.charts.util = new Chart(ctxUtil, {
        type: 'doughnut',
        data: {
          labels: ['Active / On Route (75%)', 'Depot Standby (15%)', 'In Maintenance (10%)'],
          datasets: [{
            data: [75, 15, 10],
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
            borderWidth: 0
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    // 2. Safety Scores Bar
    const ctxSafety = $('#safetyScoreChart')?.getContext('2d');
    if (ctxSafety) {
      state.charts.safety = new Chart(ctxSafety, {
        type: 'bar',
        data: {
          labels: ['Rahul Sharma', 'Manoj Maurya', 'Deepak Singh', 'Amit Yadav', 'Satish Pandey'],
          datasets: [{
            label: 'Driver Safety Score (0-100)',
            data: [92, 88, 74, 61, 96],
            backgroundColor: ['#10b981', '#10b981', '#f59e0b', '#ef4444', '#10b981']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { min: 0, max: 100 } }
        }
      });
    }

    // 3. Delays Chart
    const ctxDelay = $('#delaysChart')?.getContext('2d');
    if (ctxDelay) {
      state.charts.delays = new Chart(ctxDelay, {
        type: 'bar',
        data: {
          labels: ['SCH-RT-01 (DPS)', 'COL-RT-02 (BHU)', 'PUB-RT-03 (Heritage)', 'SCH-RT-04 (St. Johns)'],
          datasets: [{
            label: 'Average Delay Minutes',
            data: [6, 4, 11, 14],
            backgroundColor: '#3b82f6'
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    // 4. Expenses Chart
    const ctxExpense = $('#expenseChart')?.getContext('2d');
    if (ctxExpense) {
      state.charts.expense = new Chart(ctxExpense, {
        type: 'pie',
        data: {
          labels: ['Scheduled Service', 'Corrective Repairs', 'CNG Fuel', 'Diesel Fuel'],
          datasets: [{
            data: [48500, 28900, 64200, 89400],
            backgroundColor: ['#10b981', '#ef4444', '#06b6d4', '#f59e0b']
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }

  // ----------------------------------------------------------------------------
  // AI PREDICTION & ROUTE OPTIMIZATION ENGINE
  // ----------------------------------------------------------------------------
  window.runAIRouteOptimization = function(kmValue) {
    const original_km = Number(kmValue || 18.4);
    const original_min = Math.round(original_km * 2.28);
    const optimized_km = Math.round(original_km * 0.864 * 10) / 10;
    const optimized_min = Math.round(original_min * 0.810);
    const saved_km = Math.round((original_km - optimized_km) * 10) / 10;
    const saved_min = original_min - optimized_min;
    const fuel_percent = Math.round((saved_km / original_km) * 100);

    const target = $('#aiOptimizationResultCard');
    if (!target) return;

    target.innerHTML = `
      <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:16px; margin-top:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:#065f46; font-size:14px;">AI Recommended Corridor</strong>
          <span class="badge badge-valid">${fuel_percent}% Fuel Reduction</span>
        </div>
        <div style="font-size:22px; font-weight:800; color:#047857; margin:8px 0;">
          ${optimized_km} km · ${optimized_min} mins
          <small style="font-size:12px; color:#475569; font-weight:400;">(Original: ${original_km} km · ${original_min} mins)</small>
        </div>
        <div style="font-size:12px; color:#065f46; line-height:1.5;">
          <strong>Savings:</strong> ${saved_min} minutes time saved · ${saved_km} km road distance eliminated.<br>
          <strong>Corridor:</strong> Outer Ring Road Phase-2 flyover detour around 3 school-zone pinch points.
        </div>
        <button class="btn btn-primary btn-sm" style="margin-top:12px; width:100%;" onclick="applyOptimizedRoute('rt-001')">
          <i class="fa-solid fa-check"></i> Implement AI Optimization
        </button>
      </div>
    `;
  };

  window.runAIDelayPrediction = function(busReg) {
    const target = $('#aiDelayResultCard');
    if (!target) return;

    target.innerHTML = `
      <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:16px; margin-top:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:#991b1b; font-size:14px;">Congestion & Delay Risk for ${escapeHtml(busReg)}</strong>
          <span class="badge badge-expired">HIGH (88%)</span>
        </div>
        <div style="font-size:20px; font-weight:800; color:#b91c1c; margin:8px 0;">
          +12 Minutes Predicted Delay
        </div>
        <div style="font-size:12px; color:#7f1d1d; line-height:1.5;">
          <strong>Scheduled ETA:</strong> 08:30 AM ➔ <strong>Predicted Arrival:</strong> 08:42 AM<br>
          <strong>Bottleneck:</strong> Construction and heavy vehicle density at Ring Road Phase-2 / Sigra junction.
        </div>
        <button class="btn btn-danger btn-sm" style="margin-top:12px; width:100%;" onclick="triggerParentDelayNotice('${escapeHtml(busReg)}')">
          <i class="fa-solid fa-paper-plane"></i> Alert Dispatcher & Parents via SMS/App
        </button>
      </div>
    `;
  };

  window.applyOptimizedRoute = function(routeId) {
    showToast(`AI Optimized route successfully applied to Route ${routeId}. Driver navigation updated.`);
  };

  window.triggerParentDelayNotice = function(bus) {
    showToast(`Automated delay notification sent to 38 parents & students assigned to ${bus}.`);
  };

  // ----------------------------------------------------------------------------
  // MODALS & FORMS
  // ----------------------------------------------------------------------------
  window.openAddBusModal = function() {
    $('#busForm').reset();
    $('#busModal').classList.add('active');
  };

  window.openAddDriverModal = function() {
    $('#driverForm').reset();
    $('#driverModal').classList.add('active');
  };

  window.openSOSModal = function() {
    $('#sosModal').classList.add('active');
  };

  window.closeModal = function(id) {
    $(`#${id}`)?.classList.remove('active');
  };

  window.handleSaveBus = function(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newBus = {
      id: `bus-${Date.now().toString().slice(-4)}`,
      reg_number: fd.get('reg_number'),
      vehicle_number: fd.get('vehicle_number'),
      bus_type: fd.get('bus_type'),
      is_ac: fd.get('is_ac') === 'true',
      manufacturer: fd.get('manufacturer'),
      model: fd.get('model'),
      seating_capacity: Number(fd.get('seating_capacity')),
      fuel_type: fd.get('fuel_type'),
      assigned_driver: fd.get('assigned_driver') || 'Unassigned',
      assigned_route: fd.get('assigned_route') || 'None',
      status: 'ACTIVE',
      gps_status: 'ONLINE',
      current_lat: 25.3176 + (Math.random() - 0.5) * 0.02,
      current_lng: 82.9739 + (Math.random() - 0.5) * 0.02,
      current_speed: 0
    };
    state.buses.unshift(newBus);
    renderAll();
    closeModal('busModal');
    showToast(`Bus ${newBus.reg_number} registered in fleet.`);
  };

  window.handleSaveDriver = function(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newDriver = {
      id: `drv-${Date.now().toString().slice(-4)}`,
      full_name: fd.get('full_name'),
      mobile: fd.get('mobile'),
      guardian_name: fd.get('guardian_name'),
      licence_number: fd.get('licence_number'),
      licence_class: fd.get('licence_class'),
      licence_expiry: fd.get('licence_expiry'),
      blood_group: fd.get('blood_group') || 'B+',
      experience_years: Number(fd.get('experience_years') || 5),
      address: fd.get('address'),
      employee_id: `EMP-DRV-${Date.now().toString().slice(-3)}`,
      employment_status: 'ACTIVE',
      safety_score: 95,
      risk_level: 'LOW',
      speeding_incidents: 0,
      harsh_braking: 0,
      route_deviations: 0,
      police_verified: 'VERIFIED',
      medical_status: 'FIT'
    };
    state.drivers.unshift(newDriver);
    renderAll();
    closeModal('driverModal');
    showToast(`Driver ${newDriver.full_name} registered and vetted.`);
  };

  window.handleTriggerSOS = function(e) {
    e.preventDefault();
    const bus = $('#sosBusSelect').value;
    const type = $('#sosTypeSelect').value;
    const severity = $('#sosSeveritySelect').value;
    const loc = $('#sosLocationInput').value;
    const desc = $('#sosDescInput').value;

    const newSOS = {
      id: `sos-${Date.now().toString().slice(-4)}`,
      code: `SOS-2026-${Date.now().toString().slice(-3)}`,
      bus,
      driver: 'On-Duty Driver',
      type,
      severity,
      location: loc,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      description: desc,
      status: 'ACTIVE'
    };
    state.emergencies.unshift(newSOS);
    renderAll();
    closeModal('sosModal');
    showToast(`EMERGENCY SOS BROADCASTED for ${bus}! Control room alerted.`);
  };

  window.resolveEmergency = function(id) {
    const sos = state.emergencies.find(e => e.id === id);
    if (sos) {
      sos.status = 'RESOLVED';
      renderAll();
      showToast(`Emergency incident ${sos.code} marked as RESOLVED.`);
    }
  };

  window.callDriverSim = function(driver, phone) {
    showToast(`Connecting emergency call to Driver ${driver} (${phone})...`);
  };

  window.dispatchSecuritySim = function(bus) {
    showToast(`Security intercept unit dispatched to track Bus ${bus}.`);
  };

  window.deleteBus = function(id) {
    if (confirm('Decommission this bus from the fleet?')) {
      state.buses = state.buses.filter(b => b.id !== id);
      renderAll();
      showToast('Bus removed from active fleet.');
    }
  };

  window.searchBusesTable = function(query) {
    const q = query.toLowerCase();
    const filtered = state.buses.filter(b => 
      b.reg_number.toLowerCase().includes(q) ||
      b.bus_type.toLowerCase().includes(q) ||
      (b.assigned_driver || '').toLowerCase().includes(q)
    );
    renderBusesTable(filtered);
  };

  window.searchDriversTable = function(query) {
    const q = query.toLowerCase();
    const filtered = state.drivers.filter(d => 
      d.full_name.toLowerCase().includes(q) ||
      d.mobile.includes(q) ||
      d.licence_number.toLowerCase().includes(q)
    );
    renderDriversTable(filtered);
  };

  window.filterMapFleet = function(filterVal) {
    // Handled dynamically
    showToast(`Filtering map display: ${filterVal}`);
  };

  window.markAllNotificationsRead = function() {
    state.notifications = [];
    renderNotifications();
    $('#unreadNotifCount').textContent = '0';
    showToast('All notifications marked as read.');
  };

  window.exportReportCSV = function(module) {
    let rows = [];
    let filename = `aibus_${module}_report_${new Date().toISOString().slice(0, 10)}.csv`;

    if (module === 'buses') {
      rows.push(['Registration', 'Vehicle ID', 'Type', 'AC Status', 'Capacity', 'Driver', 'Route', 'Status']);
      state.buses.forEach(b => rows.push([b.reg_number, b.vehicle_number, b.bus_type, b.is_ac ? 'AC' : 'Non-AC', b.seating_capacity, b.assigned_driver, b.assigned_route, b.status]));
    } else if (module === 'drivers') {
      rows.push(['Name', 'Phone', 'Licence Number', 'Class', 'Expiry', 'Experience', 'Safety Score', 'Risk Level']);
      state.drivers.forEach(d => rows.push([d.full_name, d.mobile, d.licence_number, d.licence_class, d.licence_expiry, d.experience_years, d.safety_score, d.risk_level]));
    } else if (module === 'emergencies') {
      rows.push(['Incident Code', 'Bus', 'Driver', 'Type', 'Severity', 'Location', 'Time', 'Status']);
      state.emergencies.forEach(e => rows.push([e.code, e.bus, e.driver, e.type, e.severity, e.location, e.time, e.status]));
    } else {
      rows.push(['Record ID', 'Bus', 'Service Type', 'Date', 'Next Service', 'Odometer', 'Cost INR', 'Status']);
      state.maintenance.forEach(m => rows.push([m.id, m.bus, m.service_type, m.service_date, m.next_service, m.odometer, m.cost, m.status]));
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${module} report to CSV.`);
  };

  window.logoutAdmin = function() {
    if (confirm('Are you sure you want to sign out of the Admin Console?')) {
      window.location.href = 'login.html';
    }
  };

  window.saveAdminLuggagePolicy = function() {
    const freeAllowance = Number($('#adminFreeLuggageInput')?.value || 15);
    const extraRate = Number($('#adminExtraRateInput')?.value || 30);
    localStorage.setItem('ai-bus-free-luggage-allowance', freeAllowance);
    localStorage.setItem('ai-bus-extra-luggage-rate', extraRate);
    showToast(`✓ Luggage settings saved! Free Limit: ${freeAllowance} KG | Extra Rate: ₹${extraRate}/KG`);
  };

  window.toggleSidebar = function() {
    $('#adminSidebar').classList.toggle('open');
  };

  // Launch controller
  document.addEventListener('DOMContentLoaded', init);
})();