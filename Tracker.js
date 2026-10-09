(() => {
	'use strict';

	const API_BASE = '/api';
	const CITY_FALLBACK = [
		['Delhi',28.6139,77.2090],['Jaipur',26.9124,75.7873],['Agra',27.1767,78.0081],['Lucknow',26.8467,80.9462],['Varanasi',25.3176,82.9739],['Prayagraj',25.4358,81.8463],['Kanpur',26.4499,80.3319],['Dehradun',30.3165,78.0322],['Chandigarh',30.7333,76.7794],['Amritsar',31.6340,74.8723],['Shimla',31.1048,77.1734],['Jammu',32.7266,74.8570],['Srinagar',34.0837,74.7973],['Mumbai',19.0760,72.8777],['Pune',18.5204,73.8567],['Nashik',19.9975,73.7898],['Nagpur',21.1458,79.0882],['Goa',15.2993,74.1240],['Ahmedabad',23.0225,72.5714],['Surat',21.1702,72.8311],['Rajkot',22.3039,70.8022],['Bengaluru',12.9716,77.5946],['Chennai',13.0827,80.2707],['Hyderabad',17.3850,78.4867],['Vijayawada',16.5062,80.6480],['Visakhapatnam',17.6868,83.2185],['Kochi',9.9312,76.2673],['Thiruvananthapuram',8.5241,76.9366],['Coimbatore',11.0168,76.9558],['Mysuru',12.2958,76.6394],['Mangaluru',12.9141,74.8560],['Kolkata',22.5726,88.3639],['Bhubaneswar',20.2961,85.8245],['Patna',25.5941,85.1376],['Ranchi',23.3441,85.3096],['Guwahati',26.1445,91.7362],['Indore',22.7196,75.8577],['Bhopal',23.2599,77.4126],['Udaipur',24.5854,73.7125],['Jodhpur',26.2389,73.0243],['Raipur',21.2514,81.6296],['Jabalpur',23.1815,79.9864],['Haridwar',29.9457,78.1642],['Rishikesh',30.0869,78.2676],['Manali',32.2396,77.1887],['Ayodhya',26.7922,82.1998],['Mathura',27.4924,77.6737],['Gwalior',26.2183,78.1828],['Aurangabad',19.8762,75.3433],['Tirupati',13.6288,79.4192]
	].map(([name,lat,lng]) => ({name,lat,lng}));
	const images = [
		'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=500&q=75',
		'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=500&q=75',
		'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=500&q=75',
		'https://images.unsplash.com/photo-1557223562-6c77ef16210f?auto=format&fit=crop&w=500&q=75'
	];
	const fleet = [
		{type:'Volvo AC Sleeper',operator:'AI Fleet Select',features:['AC Sleeper','USB charging','Blanket'],capacity:36,priceFactor:1.9},
		{type:'AC Seater',operator:'InterCity Express',features:['AC Seater','Live location','Water'],capacity:42,priceFactor:1.3},
		{type:'Janrath AC',operator:'Stateway Travels',features:['AC Seater','Recliner','Water'],capacity:45,priceFactor:1.2},
		{type:'Ordinary',operator:'Roadline Transit',features:['Non-AC','2+2 seating','Affordable'],capacity:52,priceFactor:.8},
		{type:'Volvo Multi-Axle',operator:'Highway Select',features:['AC Seater','Premium','Charging'],capacity:40,priceFactor:1.65},
		{type:'AC Sleeper',operator:'Night Owl Coaches',features:['AC Sleeper','Curtains','Charging'],capacity:32,priceFactor:1.55},
		{type:'Non-AC Seater',operator:'People’s Transit',features:['Non-AC','Recliner','Value'],capacity:48,priceFactor:.9},
		{type:'Scania AC',operator:'Royal Route',features:['AC Seater','Extra legroom','Wi-Fi'],capacity:40,priceFactor:1.8}
	];
	let cities = CITY_FALLBACK;
	let map;
	let routeLine;
	let busMarker;
	let endpointMarkers = [];
	let animationTimer;
	let backendAvailable = false;
	let currentRoute = null;
	let currentBuses = [];
	let toastTimer;
	const $ = (selector, root=document) => root.querySelector(selector);
	const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

	const localDate = new Date();
	const dateInput = $('#travelDate');
	dateInput.min = localDate.toISOString().slice(0,10);
	dateInput.value = localDate.toISOString().slice(0,10);

	function city(name) { return cities.find(item => item.name.toLowerCase() === String(name).trim().toLowerCase()); }
	function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
	function money(value) { return `₹${Number(value).toLocaleString('en-IN')}`; }
	function prettyDate(value) { return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'}); }
	function toast(message) {
		const element = $('#toast'); element.textContent = message; element.classList.add('visible');
		clearTimeout(toastTimer); toastTimer = setTimeout(() => element.classList.remove('visible'), 2800);
	}
	async function getJson(url, options) {
		const response = await fetch(url, options);
		if (!response.ok) throw new Error((await response.json().catch(()=>({}))).error || `Request failed (${response.status})`);
		return response.json();
	}

	async function loadCities() {
		try { const data = await getJson(`${API_BASE}/cities`); if (data.cities?.length) cities = data.cities; backendAvailable = true; }
		catch (_) { /* Live Server/file preview uses the local city list. */ }
		$('#cityOptions').innerHTML = cities.map(item => `<option value="${escapeHtml(item.name)}"></option>`).join('');
	}

	function initMap() {
		if (!window.L || map) return;
		map = L.map('routeMap',{zoomControl:false,scrollWheelZoom:false}).setView([22.8,79.2],4.4);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap'}).addTo(map);
		L.control.zoom({position:'bottomright'}).addTo(map);
	}

	function formatTime(minutes) {
		const time = new Date(); time.setHours(0,0,0,0); time.setMinutes(minutes);
		return time.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true}).toUpperCase();
	}
	function estimateKm(origin,destination) {
		const rad = degree => degree*Math.PI/180;
		const dLat=rad(destination.lat-origin.lat), dLng=rad(destination.lng-origin.lng);
		const a=Math.sin(dLat/2)**2+Math.cos(rad(origin.lat))*Math.cos(rad(destination.lat))*Math.sin(dLng/2)**2;
		return Math.max(65,Math.round(6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))*1.25));
	}
	function demoBuses(from,to,date) {
		const start = city(from), end = city(to), km=estimateKm(start,end);
		const seed = [...`${from}-${to}-${date}`].reduce((sum,ch)=>sum+ch.charCodeAt(0),0);
		const base = 300 + (seed%6)*53;
		return fleet.map((service,index)=>{
			const departureMinutes=base+index*117;
			const departureDate=new Date(`${date}T00:00:00`);departureDate.setMinutes(departureMinutes);
			const departed=departureDate.getTime()<=Date.now();
			const duration=Math.max(90,Math.round(km/(index===0||index===5?58:67)*60+24+(index%3)*17));
			const total=service.capacity, booked=(seed+index*13)%(total-8)+5;
			const occupiedSeats=total-booked;
			const unavailableSeats=Array.from({length:occupiedSeats},(_,seatIndex)=>`${String.fromCharCode(65+Math.floor(seatIndex/4))}${seatIndex%4+1}`);
			return {id:`demo-${seed}-${index+1}`,busNo:`IN ${String((seed+index*37)%90+10).padStart(2,'0')} ${String.fromCharCode(65+index)}${String.fromCharCode(65+(seed+index)%26)} ${String((seed*17+index*181)%9000+1000)}`,type:service.type,operator:service.operator,ownership:index%2===0?'Private':'Government',source:start.name,destination:end.name,departure:formatTime(departureMinutes),arrival:formatTime(departureMinutes+duration),departureMinutes,departed,duration:`${Math.floor(duration/60)}h ${String(duration%60).padStart(2,'0')}m`,durationMinutes:duration,distance:km,fare:Math.round(Math.max(199,km*.78)*service.priceFactor/10)*10,seatsAvailable:total-booked,seatsTotal:total,occupiedSeats,reservedSeats:Math.round(occupiedSeats*.35),unavailableSeats,crowd:occupiedSeats/total>.75?'HIGH':occupiedSeats/total>.4?'MEDIUM':'LOW',features:service.features,status:index===2?'Delayed':'On time',image:images[index%images.length],progress:((seed+index*9)%69+12)/100};
		}).sort((a,b)=>a.departureMinutes-b.departureMinutes);
	}

	function busCard(bus,index) {
		const delayed=bus.status?.toLowerCase().includes('delay');
		const departed=Boolean(bus.departed);
		const features=(bus.features||[]).slice(0,2).map(feature=>`<span class="bus-tag">${escapeHtml(feature)}</span>`).join('');
		return `<article class="bus-card" data-bus-id="${escapeHtml(bus.id)}">
			<div class="bus-card-main"><img class="bus-image" src="${escapeHtml(bus.image||images[index%images.length])}" alt="${escapeHtml(bus.type)} coach" loading="lazy" onerror="this.src='${images[index%images.length]}'">
				<div class="bus-info"><div class="bus-operator">${escapeHtml(bus.operator||'Intercity Bus Service')} · ${escapeHtml(bus.busNo)}</div><h3 class="bus-title">${escapeHtml(bus.type)}</h3><div class="bus-subtitle">${escapeHtml(bus.source)} → ${escapeHtml(bus.destination)}</div><div class="bus-tags">${features}<span class="bus-tag">${escapeHtml(bus.ownership||'Private')}</span><span class="bus-tag ${String(bus.crowd).toLowerCase()==='high'?'crowd-high':String(bus.crowd).toLowerCase()==='medium'?'crowd-medium':'accent'}">${escapeHtml(bus.crowd||'LOW')} CROWD</span><span class="bus-tag accent">${escapeHtml(bus.status||'On time')}</span></div>
					<div class="timing-block"><div class="time-column"><b>${escapeHtml(bus.departure)}</b><small>${escapeHtml(bus.source)}</small></div><div class="journey-duration"><i></i>${escapeHtml(bus.duration)}</div><div class="time-column"><b>${escapeHtml(bus.arrival)}</b><small>${escapeHtml(bus.destination)}</small></div></div>
				</div><div class="bus-purchase"><div class="seat-status"><strong>${bus.seatsAvailable}</strong> available · ${bus.reservedSeats||0} reserved <span>of ${bus.seatsTotal}</span></div><div class="fare-price">${money(bus.fare)}<small>onwards / seat</small></div><button class="book-button" type="button" data-book="${escapeHtml(bus.id)}" ${departed?'disabled':''}>${departed?'Departed':'Select seats'}</button></div>
			</div><div class="bus-card-footer"><span class="live-status ${delayed?'delayed':''}"><i></i>${delayed?'Running behind schedule':'Live trip updates available'}</span><button type="button" data-track="${escapeHtml(bus.id)}">Track bus ↗</button></div></article>`;
	}

	async function searchBuses(from,to,date) {
		const start=city(from), end=city(to);
		if (!start || !end) { toast('Choose cities from the list of available destinations.'); return; }
		if (start.name===end.name) { toast('Choose two different cities for your journey.'); return; }
		currentRoute={from:start.name,to:end.name,date,origin:start,destination:end};
		localStorage.setItem('ai-bus-track-last-route',JSON.stringify({from:start.name,to:end.name,date}));
		const section=$('#resultsSection'); section.hidden=false;
		$('#resultsTitle').textContent=`${start.name} to ${end.name}`;
		$('#resultsSubtitle').textContent=`${prettyDate(date)} · Compare departure times, arrival estimates and available seats.`;
		$('#resultCount').textContent='Finding available buses…';
		$('#busList').innerHTML='<div class="loading-shimmer"></div><div class="loading-shimmer"></div><div class="loading-shimmer"></div>';
		section.scrollIntoView({behavior:'smooth',block:'start'});
		try {
			let data;
			try { data=await getJson(`${API_BASE}/buses?from=${encodeURIComponent(start.name)}&to=${encodeURIComponent(end.name)}&date=${encodeURIComponent(date)}`); }
			catch (_) { backendAvailable=false; data={buses:demoBuses(start.name,end.name,date)}; }
			currentBuses=data.buses||[];
			$('#busLookup').value='';
			$('#resultCount').textContent=`${currentBuses.length} buses found`;
			$('#busList').innerHTML=currentBuses.length?currentBuses.map(busCard).join(''):'<div class="empty-state"><b>No buses found for this journey</b><p>Try another date or a nearby destination. Our network is growing every day.</p></div>';
			updateMap(start,end,currentBuses.find(bus=>!bus.departed)||currentBuses[0]);
		} catch (error) {
			$('#resultCount').textContent='Unable to load buses';
			$('#busList').innerHTML=`<div class="empty-state"><b>We couldn’t find your buses right now</b><p>${escapeHtml(error.message)}. Please try again.</p></div>`;
		}
	}

	function pointAt(points,progress) {
		if (!points?.length) return [0,0];
		const position=Math.max(0,Math.min(.99,progress))*(points.length-1), index=Math.floor(position), fraction=position-index;
		const next=points[Math.min(index+1,points.length-1)];
		return [points[index][0]+(next[0]-points[index][0])*fraction,points[index][1]+(next[1]-points[index][1])*fraction];
	}

	async function updateMap(start,end,bus) {
		initMap(); if (!map) return;
		clearInterval(animationTimer);
		$('#mapRouteLabel').textContent=`${start.name} → ${end.name}`;
		const origin=[start.lat,start.lng], destination=[end.lat,end.lng];
		let points=[origin,destination];
		if (routeLine) map.removeLayer(routeLine); if (busMarker) map.removeLayer(busMarker);
		endpointMarkers.forEach(marker=>map.removeLayer(marker)); endpointMarkers=[];
		try {
			const coordinates=`${start.lng},${start.lat};${end.lng},${end.lat}`;
			const route=await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`).then(response=>response.ok?response.json():null);
			if(route?.routes?.[0]?.geometry?.coordinates) points=route.routes[0].geometry.coordinates.map(([lng,lat])=>[lat,lng]);
		} catch (_) { /* Keep a straight-line preview when routing is unavailable. */ }
		routeLine=L.polyline(points,{color:'#a91d32',weight:4,opacity:.8,dashArray:points.length===2?'7 7':null}).addTo(map);
		endpointMarkers.push(L.circleMarker(origin,{radius:6,color:'#fff',weight:2,fillColor:'#31946e',fillOpacity:1}).addTo(map).bindPopup(`<span class="map-popup">${escapeHtml(start.name)} · departure</span>`));
		endpointMarkers.push(L.circleMarker(destination,{radius:6,color:'#fff',weight:2,fillColor:'#34475b',fillOpacity:1}).addTo(map).bindPopup(`<span class="map-popup">${escapeHtml(end.name)} · arrival</span>`));
		const icon=L.divIcon({className:'',html:'<div class="bus-marker"><span>↗</span></div>',iconSize:[29,29],iconAnchor:[14,22]});
		let progress=bus?.progress||.22;
		busMarker=L.marker(pointAt(points,progress),{icon}).addTo(map).bindPopup(`<span class="map-popup">${escapeHtml(bus?.busNo||'Sample bus')} · simulated live position</span>`);
		map.fitBounds(routeLine.getBounds(),{padding:[20,20],maxZoom:8});
		setTimeout(()=>map.invalidateSize(),150);
		animationTimer=setInterval(async()=>{
			progress=progress>=.96?.15:progress+.015;
			if(busMarker) busMarker.setLatLng(pointAt(points,progress));
			if(bus?.id&&!String(bus.id).startsWith('demo-')) {
				try {
					const data=await getJson(`${API_BASE}/bus/${encodeURIComponent(bus.id)}/track`);
					if(data.location&&busMarker) busMarker.setLatLng([data.location.lat,data.location.lng]);
				} catch (_) { /* The simulated marker continues moving. */ }
			}
		},5000);
	}

	function openModal(markup) { $('#modalContent').innerHTML=markup; $('#bookingDialog').setAttribute('open',''); $('#modalBackdrop').hidden=false; document.body.style.overflow='hidden'; }
	function closeModal() { $('#bookingDialog').removeAttribute('open'); $('#modalBackdrop').hidden=true; document.body.style.overflow=''; }
	function openBooking(bus) {
		const seatButtons=Array.from({length:Math.min(bus.seatsTotal||40,60)},(_,i)=>{
			const seatNo=`${String.fromCharCode(65+Math.floor(i/4))}${i%4+1}`;
			const unavailable=Array.isArray(bus.unavailableSeats)?bus.unavailableSeats.includes(seatNo):(i*7+(bus.seatsTotal||40))%11===0;
			return `<button class="seat ${unavailable?'unavailable':''}" type="button" data-seat="${seatNo}" ${unavailable?'disabled':''}>${seatNo}</button>`;
		}).join('');

		const fallbackMenu = [
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

		openModal(`<span class="modal-kicker">MAKE IT YOURS</span><h2 class="modal-title" id="modalTitle">Choose your seats & options</h2><p class="modal-description">${escapeHtml(bus.type)} · ${escapeHtml(bus.departure)} from ${escapeHtml(bus.source)} · ${money(bus.fare)} per seat</p>
			<div class="coach-strip">FRONT OF BUS</div><div class="seat-grid">${seatButtons}</div><div class="seat-legend"><span><i></i> Available</span><span><i class="taken"></i> Taken</span><span><i class="chosen"></i> Selected</span></div>
			
			<div class="booking-luggage-picker">
				<div class="picker-label-row">
					<span>🧳 Luggage Weight (लगेज वजन)</span>
					<span style="color:#047857; font-weight:700;">15 KG FREE ALLOWANCE</span>
				</div>
				<div class="luggage-stepper">
					<button type="button" class="stepper-btn" id="btnLuggageMinus" aria-label="Decrease luggage">−</button>
					<input type="number" id="bookingLuggageWeight" class="stepper-input" value="15" min="0" max="60" readonly>
					<button type="button" class="stepper-btn" id="btnLuggagePlus" aria-label="Increase luggage">+</button>
					<span style="font-size:12px; color:#475569; font-weight:600;">KG Total Baggage</span>
				</div>
				<div id="bookingLuggageChargeInfo" class="luggage-charge-pill" style="background:#ecfdf5; color:#047857;">
					✓ 15 KG Free Allowance included (₹0 extra charge)
				</div>
			</div>

			<!-- MANDATORY ONBOARD FOOD POLICY & SELECTION (Section 2, 3, 4, 8) -->
			<div class="onboard-food-policy-banner">
				<h4>🍱 Onboard Food Available</h4>
				<ul class="policy-points-list">
					<li>Food is optional and is NOT included in your bus ticket.</li>
					<li>Food and beverages will be charged separately.</li>
					<li>Choose only if you want to order.</li>
				</ul>
			</div>

			<div class="food-flow-options">
				<button type="button" class="btn-food-choice btn-choice-skip active" id="btnChoiceSkipFood">
					<i class="fa-solid fa-ban"></i> Skip Food (No Meals)
				</button>
				<button type="button" class="btn-food-choice btn-choice-order" id="btnChoiceOrderFood">
					<i class="fa-solid fa-utensils"></i> Order Food (Optional)
				</button>
			</div>

			<div class="food-selection-drawer" id="foodDrawer" style="display:none;">
				<div style="display:flex; justify-content:space-between; align-items:center;">
					<b style="font-size:13px; color:#0f172a;">Select Refreshments (Delivered to your seat)</b>
					<small style="color:#64748b;">Charged Separately</small>
				</div>
				<div class="food-menu-items-grid" id="foodItemsGrid"></div>
			</div>

			<label class="field-label" for="passengerName" style="margin-top:14px;">PASSENGER NAME</label><input class="booking-input" id="passengerName" placeholder="Name for the booking" maxlength="70" required><label class="field-label" for="passengerPhone">MOBILE NUMBER</label><input class="booking-input" id="passengerPhone" placeholder="10-digit mobile number" inputmode="numeric" maxlength="10" required>
			
			<!-- SEPARATE BILLING BREAKDOWN (Section 8) -->
			<div class="separated-checkout-summary">
				<div class="checkout-line-row"><span>Bus Ticket Fare (<span id="countSeatsSelected">0</span> seat):</span> <strong id="sumSeatFare">₹0</strong></div>
				<div class="checkout-line-row"><span>Extra Luggage Fee:</span> <strong id="sumLuggageFee">₹0 (15 KG Free)</strong></div>
				<div class="checkout-line-row"><span>Optional Food:</span> <strong id="sumFoodFee" style="color:#64748b;">₹0 (Skipped)</strong></div>
				<div class="checkout-line-row total-row"><span>TOTAL PAYABLE:</span> <span class="total-amount-val" id="sumTotalFare">₹0</span></div>
			</div>

			<button class="confirm-button" id="confirmBooking" type="button" disabled>Confirm booking →</button>
			<p class="modal-description" style="margin:8px 0 0">Demo only. No payment will be collected and this is not a real ticket.</p>`);

		const chosen=new Set(), price=Number(bus.fare);
		let luggageWeight = 15;
		let foodOrdered = false;
		const foodCart = new Map(); // foodId -> { item, quantity }
		let currentMenu = fallbackMenu;

		// Fetch fresh menu if backend available
		if (backendAvailable) {
			fetch(`${API_BASE}/food`).then(r => r.json()).then(data => {
				if (Array.isArray(data) && data.length) {
					currentMenu = data.filter(f => !f.deletedAt && f.active !== false);
					renderFoodMenu();
				}
			}).catch(() => {});
		}

		function getLuggageInfo(weight) {
			const w = Math.max(0, Number(weight) || 0);
			const excess = Math.max(0, w - 15);
			const fee = excess * 30; // ₹30 per excess kg over 15kg limit
			return { weight: w, excess, fee, isFree: excess === 0 };
		}

		function getFoodTotal() {
			let total = 0;
			for (const { item, quantity } of foodCart.values()) {
				total += (item.price * quantity);
			}
			return total;
		}

		function renderFoodMenu() {
			const grid = $('#foodItemsGrid');
			if (!grid) return;
			grid.innerHTML = currentMenu.map(item => {
				const isSoldOut = item.stockQuantity <= 0 || item.availability === false;
				const currentQty = foodCart.get(item.foodId)?.quantity || 0;
				return `
					<div class="food-card-compact ${isSoldOut ? 'sold-out' : ''}">
						<img src="${item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80'}" class="food-img-thumb" alt="${escapeHtml(item.name)}">
						<div class="food-info-col">
							<div class="food-name-line">
								<span class="veg-icon" title="${item.veg !== false ? 'Vegetarian' : 'Non-Veg'}"></span>
								<span>${escapeHtml(item.name)}</span>
							</div>
							<div class="food-price-line">₹${item.price}</div>
							<div>
								${isSoldOut ? '<span class="food-stock-badge badge-soldout">SOLD OUT</span>' : `<span class="food-stock-badge badge-available">In Stock (${item.stockQuantity})</span>`}
							</div>
						</div>
						<div class="food-qty-stepper">
							<button type="button" class="btn-qty" data-qty-minus="${item.foodId}" ${currentQty <= 0 ? 'disabled' : ''}>−</button>
							<span class="qty-display" id="foodQty_${item.foodId}">${currentQty}</span>
							<button type="button" class="btn-qty" data-qty-plus="${item.foodId}" ${isSoldOut || currentQty >= item.stockQuantity ? 'disabled' : ''}>+</button>
						</div>
					</div>
				`;
			}).join('');

			// Attach stepper handlers
			$$('[data-qty-minus]', grid).forEach(btn => {
				btn.addEventListener('click', () => {
					const foodId = btn.dataset.qtyMinus;
					const current = foodCart.get(foodId);
					if (current && current.quantity > 0) {
						current.quantity -= 1;
						if (current.quantity === 0) foodCart.delete(foodId);
						renderFoodMenu();
						updateFareSummary();
					}
				});
			});
			$$('[data-qty-plus]', grid).forEach(btn => {
				btn.addEventListener('click', () => {
					const foodId = btn.dataset.qtyPlus;
					const item = currentMenu.find(f => f.foodId === foodId);
					if (item && item.stockQuantity > 0) {
						const current = foodCart.get(foodId) || { item, quantity: 0 };
						if (current.quantity < item.stockQuantity) {
							current.quantity += 1;
							foodCart.set(foodId, current);
							renderFoodMenu();
							updateFareSummary();
						}
					}
				});
			});
		}

		renderFoodMenu();

		function updateFareSummary() {
			const info = getLuggageInfo(luggageWeight);
			const seatsCost = chosen.size * price;
			const foodCost = foodOrdered ? getFoodTotal() : 0;
			const totalCost = chosen.size > 0 ? (seatsCost + info.fee + foodCost) : 0;
			
			const pill = $('#bookingLuggageChargeInfo');
			if (pill) {
				if (info.isFree) {
					pill.style.background = '#ecfdf5';
					pill.style.color = '#047857';
					pill.textContent = '✓ 15 KG Free Allowance included (₹0 extra charge)';
				} else {
					pill.style.background = '#fef2f2';
					pill.style.color = '#b91c1c';
					pill.textContent = `⚠ +${info.excess} KG Over 15 KG Limit: +₹${info.fee} Excess Baggage Fee (@ ₹30/kg)`;
				}
			}

			if ($('#countSeatsSelected')) $('#countSeatsSelected').textContent = chosen.size;
			if ($('#sumSeatFare')) $('#sumSeatFare').textContent = money(seatsCost);
			if ($('#sumLuggageFee')) $('#sumLuggageFee').textContent = info.isFree ? '₹0 (15 KG Free)' : `+${money(info.fee)} (${info.excess} KG Extra)`;
			
			if ($('#sumFoodFee')) {
				if (foodOrdered && foodCost > 0) {
					$('#sumFoodFee').textContent = `+${money(foodCost)} (${foodCart.size} item${foodCart.size>1?'s':''})`;
					$('#sumFoodFee').style.color = '#a91d32';
				} else {
					$('#sumFoodFee').textContent = '₹0 (Skipped)';
					$('#sumFoodFee').style.color = '#64748b';
				}
			}

			if ($('#sumTotalFare')) $('#sumTotalFare').textContent = money(totalCost);
			updateConfirmState();
		}

		$('#btnChoiceSkipFood')?.addEventListener('click', () => {
			foodOrdered = false;
			$('#btnChoiceSkipFood').classList.add('active');
			$('#btnChoiceOrderFood').classList.remove('active');
			$('#foodDrawer').style.display = 'none';
			foodCart.clear();
			renderFoodMenu();
			updateFareSummary();
		});

		$('#btnChoiceOrderFood')?.addEventListener('click', () => {
			foodOrdered = true;
			$('#btnChoiceOrderFood').classList.add('active');
			$('#btnChoiceSkipFood').classList.remove('active');
			$('#foodDrawer').style.display = 'block';
			updateFareSummary();
		});

		$('#btnLuggageMinus')?.addEventListener('click', () => {
			if (luggageWeight > 5) {
				luggageWeight -= 5;
				const input = $('#bookingLuggageWeight');
				if (input) input.value = luggageWeight;
				updateFareSummary();
			}
		});

		$('#btnLuggagePlus')?.addEventListener('click', () => {
			if (luggageWeight < 60) {
				luggageWeight += 5;
				const input = $('#bookingLuggageWeight');
				if (input) input.value = luggageWeight;
				updateFareSummary();
			}
		});

		$$('.seat:not(.unavailable)',$('#modalContent')).forEach(button=>button.addEventListener('click',()=>{
			if(chosen.has(button.dataset.seat)){chosen.delete(button.dataset.seat);button.classList.remove('selected');}
			else if(chosen.size<6){chosen.add(button.dataset.seat);button.classList.add('selected');}
			else toast('You can select up to 6 seats per booking.');
			updateFareSummary();
		}));

		function updateConfirmState(){
			const name=$('#passengerName')?.value.trim(), phone=$('#passengerPhone')?.value.trim();
			$('#confirmBooking').disabled=!(chosen.size&&name&&/^[6-9]\d{9}$/.test(phone||''));
		}
		$('#passengerName').addEventListener('input',updateConfirmState); $('#passengerPhone').addEventListener('input',updateConfirmState);
		
		$('#confirmBooking').addEventListener('click',async()=>{
			const button=$('#confirmBooking');button.disabled=true;button.textContent='Proceeding to Payment…';
			const passenger={name:$('#passengerName').value.trim(),phone:$('#passengerPhone').value.trim()};
			const luggageInfo = getLuggageInfo(luggageWeight);
			const baseFare = chosen.size * price;
			const luggageFee = luggageInfo.fee;
			let activeFoodCost = foodOrdered ? getFoodTotal() : 0;
			let totalCost = baseFare + luggageFee + activeFoodCost;

			const foodItemsPayload = [];
			if (foodOrdered) {
				for (const { item, quantity } of foodCart.values()) {
					if (quantity > 0) foodItemsPayload.push({ foodId: item.foodId, quantity });
				}
			}

			// Step 1: Mock Payment Gateway Modal with Separated Accounting (Section 8, 9)
			function renderPaymentModal() {
				const hasFood = activeFoodCost > 0;
				openModal(`
					<div class="payment-card">
						<span class="modal-kicker">MOCK PAYMENT GATEWAY · DEMO SECURE</span>
						<h2 class="modal-title" style="font-size:20px; margin:4px 0 12px;">Complete Payment</h2>
						<p style="font-size:12px; color:#64748b; margin-bottom:14px;">Review your separated fare items before authorizing payment for ${escapeHtml(passenger.name)}.</p>

						<!-- TRANSPARENT SEPARATED BILLING -->
						<div class="separated-checkout-summary" style="background:#ffffff;">
							<div class="checkout-line-row"><span>Bus Ticket Fare (${chosen.size} seat${chosen.size>1?'s':''})</span><strong>${money(baseFare)}</strong></div>
							<div class="checkout-line-row"><span>Extra Luggage (${luggageInfo.weight} KG)</span><strong style="${luggageInfo.isFree?'color:#10b981':'color:#b91c1c'}">${luggageInfo.isFree?'₹0 (15 KG Included)':'+'+money(luggageFee)}</strong></div>
							<div class="checkout-line-row"><span>Optional Onboard Food</span><strong style="${hasFood?'color:#a91d32':'color:#64748b'}">${hasFood ? '+'+money(activeFoodCost) : '₹0 (Not Ordered)'}</strong></div>
							<div class="checkout-line-row total-row"><span>TOTAL PAYABLE</span><span class="total-amount-val">${money(totalCost)}</span></div>

							${hasFood ? `
								<div class="optional-food-notice">
									<span>🍱 Food is optional. Remove food to continue without food.</span>
									<button type="button" class="btn-remove-food-text" id="btnRemoveFoodFromCheckout">[Remove Food]</button>
								</div>
							` : ''}
						</div>

						<div class="payment-options-row">
							<button type="button" class="payment-option-btn active" id="payOptUPI"><i class="fa-solid fa-mobile-screen"></i><br>UPI / QR</button>
							<button type="button" class="payment-option-btn" id="payOptCard"><i class="fa-regular fa-credit-card"></i><br>Card</button>
							<button type="button" class="payment-option-btn" id="payOptNet"><i class="fa-solid fa-building-columns"></i><br>Net Banking</button>
						</div>

						<button class="confirm-button" id="btnExecutePay" type="button" style="margin-top:12px;">Pay ${money(totalCost)} & Issue Ticket →</button>
					</div>
				`);

				$('#btnRemoveFoodFromCheckout')?.addEventListener('click', () => {
					foodCart.clear();
					foodOrdered = false;
					activeFoodCost = 0;
					totalCost = baseFare + luggageFee;
					renderPaymentModal();
				});

				$('#btnExecutePay').addEventListener('click', async () => {
					const payBtn = $('#btnExecutePay');
					payBtn.disabled = true;
					payBtn.textContent = 'Processing Payment…';

					const payload = {
						busId: bus.id,
						seats: [...chosen],
						passenger,
						journey: currentRoute,
						luggageWeight: luggageInfo.weight,
						luggageFee,
						foodItems: foodItemsPayload
					};

					let booking;
					try {
						if (backendAvailable) {
							booking = await getJson(`${API_BASE}/bookings`, {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(payload)
							});
						} else {
							booking = {
								pnr: `AI${Math.random().toString(36).slice(2,8).toUpperCase()}`,
								bus,
								seatNumbers: [...chosen],
								passenger,
								ticketFare: baseFare,
								luggageWeight: luggageInfo.weight,
								extraLuggageCharge: luggageFee,
								foodCharge: activeFoodCost,
								total: totalCost,
								foodOrder: activeFoodCost > 0 ? {
									foodOrderId: `FOOD-2026-${Math.floor(100000 + Math.random() * 900000)}`,
									items: [...foodCart.values()].map(v => ({ foodName: v.item.name, quantity: v.quantity, unitPrice: v.item.price, totalPrice: v.item.price * v.quantity })),
									totalAmount: activeFoodCost,
									orderStatus: 'CONFIRMED'
								} : null,
								date: currentRoute?.date || new Date().toISOString().slice(0, 10)
							};
						}
					} catch (error) {
						payBtn.disabled = false;
						payBtn.textContent = `Pay ${money(totalCost)} & Issue Ticket →`;
						toast(error.message);
						return;
					}
					localStorage.setItem('ai-bus-track-last-pnr', booking.pnr);

					setTimeout(() => {
						// Step 2: Digital Boarding Pass with QR Code AND Separate Food Order Receipt (Section 10, 11)
						const foodOrder = booking.foodOrder;
						openModal(`
							<div class="ticket-success">
								<div class="success-icon">✓</div>
								<span class="modal-kicker">PAYMENT SUCCESSFUL · CONFIRMED</span>
								<h2 class="modal-title" style="font-size:20px; margin:4px 0 10px;">Booking & Digital Pass Confirmed</h2>
								<p class="modal-description" style="font-size:12px; margin-bottom:14px;">Show this verified QR digital boarding pass to the bus conductor.</p>

								<!-- 1. BUS TICKET BOARDING PASS -->
								<div class="digital-ticket-card">
									<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:10px; margin-bottom:12px;">
										<div><strong style="font-size:15px; color:#a91d32;">AI BUS TRACK</strong><div style="font-size:11px; color:#64748b;">Smart Intercity Express</div></div>
										<div style="text-align:right;"><span style="font-size:11px; color:#64748b;">PNR NUMBER</span><div style="font-weight:800; font-size:16px; color:#0f172a; font-family:monospace;">${escapeHtml(booking.pnr)}</div></div>
									</div>

									<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px; margin-bottom:12px;">
										<div><span style="color:#64748b;">PASSENGER</span><br><strong>${escapeHtml(passenger.name)}</strong></div>
										<div><span style="color:#64748b;">PHONE</span><br><strong>${escapeHtml(passenger.phone)}</strong></div>
										<div><span style="color:#64748b;">ROUTE</span><br><strong>${escapeHtml(bus.source)} ➔ ${escapeHtml(bus.destination)}</strong></div>
										<div><span style="color:#64748b;">BUS NO / TYPE</span><br><strong>${escapeHtml(bus.busNo || 'UP32 AB 1234')} · ${escapeHtml(bus.type)}</strong></div>
										<div><span style="color:#64748b;">SEAT(S)</span><br><strong style="color:#a91d32;">Seat${chosen.size>1?'s':''} ${[...chosen].join(', ')}</strong></div>
										<div><span style="color:#64748b;">LUGGAGE WEIGHT</span><br><strong>${luggageInfo.weight} KG ${luggageInfo.isFree ? '(15 KG Free Limit)' : '(+'+money(luggageFee)+' Extra)'}</strong></div>
									</div>

									<!-- SVG QR Code for verification -->
									<div class="ticket-qr-box">
										<svg viewBox="0 0 100 100" width="84" height="84" aria-label="Ticket QR Code">
											<rect width="100" height="100" fill="#ffffff"/>
											<path d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z" fill="#0f172a"/>
											<path d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z" fill="#0f172a"/>
											<path d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z" fill="#0f172a"/>
											<rect x="45" y="15" width="8" height="20" fill="#0f172a"/>
											<rect x="45" y="45" width="10" height="10" fill="#a91d32"/>
											<rect x="60" y="55" width="25" height="8" fill="#0f172a"/>
											<rect x="70" y="70" width="15" height="15" fill="#0f172a"/>
										</svg>
									</div>
									<div style="text-align:center; font-size:11px; color:#10b981; font-weight:700;">✓ DIGITAL TICKET VERIFIED BY AI BUS DESK</div>
								</div>

								<!-- 2. SEPARATE FOOD RECEIPT & DELIVERY TRACKER (Section 10, 11) -->
								${foodOrder ? `
									<div class="food-receipt-card" style="text-align:left;">
										<div class="receipt-header">
											<div>
												<span class="receipt-tag">SEPARATE FOOD RECEIPT</span>
												<div style="font-size:11px; color:#64748b; margin-top:3px;">Onboard Catering Service · Not Included in Ticket</div>
											</div>
											<div class="receipt-order-id">${escapeHtml(foodOrder.foodOrderId)}</div>
										</div>

										<div class="receipt-meta-grid">
											<div><small>PASSENGER</small><strong>${escapeHtml(passenger.name)}</strong></div>
											<div><small>BUS / SEAT</small><strong>${escapeHtml(bus.busNo || 'UP32 AB 1234')} · Seat ${[...chosen].join(', ')}</strong></div>
											<div><small>PAYMENT</small><strong style="color:#10b981;">PAID (₹${foodOrder.totalAmount || activeFoodCost})</strong></div>
											<div><small>ORDER STATUS</small><strong style="color:#f59e0b;">CONFIRMED</strong></div>
										</div>

										<table class="receipt-items-table">
											<thead><tr><th>ITEM</th><th>QTY</th><th style="text-align:right;">PRICE</th></tr></thead>
											<tbody>
												${(foodOrder.items || []).map(it => `
													<tr>
														<td>${escapeHtml(it.foodName || it.name)}</td>
														<td>${it.quantity}</td>
														<td style="text-align:right;">₹${it.totalPrice || (it.unitPrice * it.quantity)}</td>
													</tr>
												`).join('')}
											</tbody>
										</table>

										<div class="receipt-total-bar">
											<span>FOOD TOTAL:</span>
											<span style="color:#a91d32;">₹${foodOrder.totalAmount || activeFoodCost}</span>
										</div>

										<!-- IN-BUS FOOD DELIVERY TRACKER (Section 11) -->
										<div class="food-delivery-progression">
											<div style="display:flex; justify-content:space-between; align-items:center; font-size:11px;">
												<span>🍱 In-Bus Seat Delivery Tracker:</span>
												<b style="color:#f59e0b;">CONFIRMED (Preparing in Pantry)</b>
											</div>
											<div class="delivery-steps-track">
												<div class="delivery-step-node completed"><div class="node-circle">✓</div>Placed</div>
												<div class="delivery-step-node active"><div class="node-circle">2</div>Confirmed</div>
												<div class="delivery-step-node"><div class="node-circle">3</div>Preparing</div>
												<div class="delivery-step-node"><div class="node-circle">4</div>Ready</div>
												<div class="delivery-step-node"><div class="node-circle">5</div>Delivered</div>
											</div>
										</div>

										<div style="text-align:center; margin-top:10px;">
											<a href="food-order.html?orderId=${encodeURIComponent(foodOrder.foodOrderId)}" target="_blank" style="font-size:12px; color:#a91d32; font-weight:700; text-decoration:none;">
												Track Live Food Delivery Onboard ➔
											</a>
										</div>
									</div>
								` : `
									<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; margin:12px 0; font-size:12px; color:#64748b; text-align:center;">
										🍱 Onboard Food: None (Optional service skipped by passenger)
									</div>
								`}

								<div style="display:flex; gap:10px; margin-top:16px;">
									<button class="outline-button" type="button" style="flex:1;" onclick="window.print()">Print Ticket ⎙</button>
									<button class="confirm-button" id="doneButton" type="button" style="flex:1;">Done</button>
								</div>
							</div>
						`);
						$('#doneButton').addEventListener('click', closeModal);
					}, 600);
				});
			}

			renderPaymentModal();
		});
	}

	function showFare() {
		if(!currentRoute){toast('Search for a route first to see its fare estimates.');$('#fromCity').focus();return;}
		const km=estimateKm(currentRoute.origin,currentRoute.destination);
		const rows=[['Ordinary',Math.max(199,Math.round(km*.78/10)*10)],['AC Seater',Math.max(299,Math.round(km*1.15/10)*10)],['AC Sleeper',Math.max(499,Math.round(km*1.55/10)*10)],['Volvo / Premium',Math.max(699,Math.round(km*1.9/10)*10)]];
		openModal(`<span class="modal-kicker">A CLEARER WAY TO PLAN</span><h2 class="modal-title" id="modalTitle">${escapeHtml(currentRoute.from)} → ${escapeHtml(currentRoute.to)}</h2><p class="modal-description">Estimated road distance ${km} km · indicative fares for ${prettyDate(currentRoute.date)}.</p><div class="fare-card">${rows.map(([type,price])=>`<div class="fare-row"><span>${type}</span><b>from ${money(price)}</b></div>`).join('')}<small class="fare-disclaimer">Demo estimates only; actual operator fares may differ.</small></div><button class="confirm-button" id="doneButton" type="button" style="margin-top:18px">Back to buses</button>`);
		$('#doneButton').addEventListener('click',closeModal);
	}

	function findBus(id){return currentBuses.find(bus=>String(bus.id)===String(id));}
	async function requirePassengerSignIn(){
		if(!backendAvailable)return true;
		await window.AIBusAuth?.ready;
		if(window.AIBusAuth?.user)return true;
		const next=location.pathname+'#resume-search';
		location.href=`login.html?next=${encodeURIComponent(next)}`;
		return false;
	}
	function showTrack(bus){
		if(!currentRoute){toast('Search a route first to view bus tracking.');return;}
		updateMap(currentRoute.origin,currentRoute.destination,bus);
		$('#resultsSection').scrollIntoView({behavior:'smooth',block:'center'});
		toast(`Showing a simulated live preview for ${bus.busNo}.`);
	}

	$('#searchForm').addEventListener('submit',event=>{event.preventDefault();searchBuses($('#fromCity').value,$('#toCity').value,dateInput.value);});
	$('#swapButton').addEventListener('click',()=>{const from=$('#fromCity'),to=$('#toCity');[from.value,to.value]=[to.value,from.value];});
	$$('[data-route]').forEach(button=>button.addEventListener('click',()=>{const [from,to]=button.dataset.route.split('|');$('#fromCity').value=from;$('#toCity').value=to;$('#searchForm').requestSubmit();}));
	$('#busList').addEventListener('click',async event=>{
		const book=event.target.closest('[data-book]');const track=event.target.closest('[data-track]');
		if(book){const bus=findBus(book.dataset.book);if(bus&&await requirePassengerSignIn())openBooking(bus);}
		if(track){const bus=findBus(track.dataset.track);if(bus)showTrack(bus);}
	});
	function filterVisibleBuses(query){
		const normalized=query.trim().toLowerCase();let visible=0;
		$$('.bus-card',$('#busList')).forEach(card=>{
			const bus=findBus(card.dataset.busId);
			const matches=!normalized||`${bus?.busNo} ${bus?.operator} ${bus?.type}`.toLowerCase().includes(normalized);
			card.hidden=!matches;if(matches)visible++;
		});
		$('#resultCount').textContent=normalized?`${visible} matching buses`:`${currentBuses.length} buses found`;
	}
	$('#busLookup').addEventListener('input',event=>filterVisibleBuses(event.target.value));
	$('#voiceSearchButton').addEventListener('click',()=>{
		const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
		if(!SpeechRecognition){toast('Voice search is not supported here. Type a bus number or operator instead.');return;}
		const recognition=new SpeechRecognition();recognition.lang='en-IN';recognition.interimResults=false;recognition.maxAlternatives=1;
		$('#voiceSearchButton').classList.add('listening');$('#voiceSearchHelp').textContent='Listening…';
		recognition.onresult=event=>{const spoken=event.results[0][0].transcript.replace(/^bus\s+/i,'').trim();$('#busLookup').value=spoken;filterVisibleBuses(spoken);};
		recognition.onerror=()=>toast('Could not hear that. Please type the bus number instead.');
		recognition.onend=()=>{$('#voiceSearchButton').classList.remove('listening');$('#voiceSearchHelp').textContent='Try: bus 1234';};recognition.start();
	});
		$('#smartRecommendationsLink').addEventListener('click',()=>{if(currentRoute)localStorage.setItem('ai-bus-track-last-route',JSON.stringify({from:currentRoute.from,to:currentRoute.to,date:currentRoute.date}));});
	$('#fareButton').addEventListener('click',showFare);
	$('#modalClose').addEventListener('click',closeModal);
	$('#modalBackdrop').addEventListener('click',event=>{if(event.target.id==='modalBackdrop')closeModal();});
	document.addEventListener('keydown',event=>{if(event.key==='Escape')closeModal();});
	$('#menuButton').addEventListener('click',()=>$('.main-nav').classList.toggle('open'));
	$$('.main-nav a').forEach(link=>link.addEventListener('click',()=>$('.main-nav').classList.remove('open')));
	async function openBookings(){
		if(!await requirePassengerSignIn())return;
		const previous=localStorage.getItem('ai-bus-track-last-pnr');
		openModal(`<span class="modal-kicker">YOUR TRIPS, ALL IN ONE PLACE</span><h2 class="modal-title" id="modalTitle">Find a booking</h2><p class="modal-description">Enter your demo booking reference. Your latest reference is filled in if you booked in this browser.</p><label class="field-label" for="lookupPnr">BOOKING REFERENCE</label><input class="booking-input" id="lookupPnr" value="${escapeHtml(previous||'')}" placeholder="For example, AI4A8K2D"><div id="bookingLookupResult"></div><button class="confirm-button" id="lookupButton" type="button">Look up booking</button>`);
		$('#lookupButton').addEventListener('click',async()=>{
			const pnr=$('#lookupPnr').value.trim();if(!pnr){toast('Enter a booking reference.');return;}
			let booking;
			try{booking=await getJson(`${API_BASE}/bookings/${encodeURIComponent(pnr)}`);}catch(_){toast('No booking found. Demo bookings are saved by the server.');return;}
			$('#bookingLookupResult').innerHTML=`<div class="pnr-box">DEMO BOOKING · ${escapeHtml(booking.passenger?.name||'Passenger')}<b>${escapeHtml(booking.pnr)}</b>${escapeHtml(booking.source||'')} → ${escapeHtml(booking.destination||'')} · ${escapeHtml((booking.seats||[]).join(', '))}</div>`;
		});
	}
	$('#myBookingButton').addEventListener('click',openBookings);
	$('#helpButton').addEventListener('click',()=>toast('This is a demo service. Please contact your bus operator for travel assistance.'));
	$('#footerHelp').addEventListener('click',()=>toast('Demo support: check trip details with the selected operator.'));

	loadCities().then(()=>{
		try{const saved=JSON.parse(localStorage.getItem('ai-bus-track-last-route')||'null');if(saved){$('#fromCity').value=saved.from||'Delhi';$('#toCity').value=saved.to||'Jaipur';dateInput.value=saved.date||dateInput.value;}}catch(_){/* Ignore old or malformed locally saved route state. */}
		if(['#demo-search','#resume-search'].includes(location.hash))searchBuses($('#fromCity').value,$('#toCity').value,dateInput.value);
	});
	window.addEventListener('beforeunload',()=>clearInterval(animationTimer));
})();
