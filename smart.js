(() => {
  'use strict';
  const API='/api';
  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money=value=>`₹${Number(value).toLocaleString('en-IN')}`;
  const dateInput=$('#recommendDate'), driverDate=$('#driverDate');
  const today=new Date().toISOString().slice(0,10); dateInput.value=today;dateInput.min=today;driverDate.value=today;driverDate.min=today;$('#nearbyForm input[type=date]')?.setAttribute('min',today);
  try{const lastRoute=JSON.parse(localStorage.getItem('ai-bus-track-last-route')||'null');if(lastRoute){$('#recommendFrom').value=lastRoute.from||'Delhi';$('#recommendTo').value=lastRoute.to||'Jaipur';dateInput.value=lastRoute.date||today;}}catch(_){/* Ignore an invalid saved demo route. */}
  let cities=[];let driverBuses=[];let alertTimer;let toastTimer;let alertMap;let emergencyMarkers=[];
  async function api(url,options){const response=await fetch(`${API}${url}`,{...options,credentials:'same-origin'});const data=await response.json().catch(()=>({}));if(response.status===401){location.href=`login.html?next=${encodeURIComponent(location.pathname+location.hash)}`;throw new Error('Sign in to continue.');}if(!response.ok)throw new Error(data.error||`Request failed (${response.status})`);return data;}
  function toast(message){const node=$('#smartToast');node.textContent=message;node.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('visible'),3200);}
  function showError(target,error){target.innerHTML=`<div class="smart-empty error-state">${escapeHtml(error.message||error)}<br><small>Start the Express server with <b>npm start</b> and open this page from localhost:3000.</small></div>`;}
  function busCard(bus,index){
    const reasons=(bus.reasons||[]).map(reason=>`<li>${escapeHtml(reason)}</li>`).join('');
    return `<article class="recommend-card ${index===0?'top-pick':''}"><div class="recommend-rank">${index===0?'TOP PICK':`OPTION ${index+1}`}</div><div class="recommend-main"><div><small>${escapeHtml(bus.operator)} · ${escapeHtml(bus.ownership||'Demo operator')}</small><h3>${escapeHtml(bus.busNo)} <span>${escapeHtml(bus.type)}</span></h3><p>${escapeHtml(bus.departure)} ${escapeHtml(bus.source)} <i>→</i> ${escapeHtml(bus.arrival)} ${escapeHtml(bus.destination)} · ${escapeHtml(bus.duration)}</p></div><div class="recommend-score"><b>${bus.score}%</b><small>match score</small></div></div><div class="recommend-facts"><span><b>${escapeHtml(bus.crowd||'LOW')}</b> crowd</span><span><b>${bus.seatsAvailable}</b> seats left</span><span><b>${money(bus.fare)}</b> from</span><span><b>${bus.distance} km</b> route</span></div><ul class="recommend-reasons">${reasons}</ul><a href="Tracker.html#home" class="smart-text-link" data-book-route="${escapeHtml(bus.source)}|${escapeHtml(bus.destination)}">View route & select seats →</a></article>`;
  }
  async function loadCities(){
    try{const data=await api('/cities');cities=data.cities||[];const options=cities.map(city=>`<option value="${escapeHtml(city.name)}"></option>`).join('');$('#smartCities').innerHTML=options;$('#nearbyCity').innerHTML=cities.map(city=>`<option value="${escapeHtml(city.name)}">${escapeHtml(city.name)}</option>`).join('');}
    catch(error){showError($('#recommendResults'),error);$('#nearbyResults').innerHTML='';}
  }
  $$('.smart-tab').forEach(button=>button.addEventListener('click',()=>{
    $$('.smart-tab').forEach(tab=>tab.classList.toggle('active',tab===button));
    $$('.smart-panel').forEach(panel=>{const active=panel.id===`panel-${button.dataset.tab}`;panel.hidden=!active;panel.classList.toggle('active',active);});
    if(button.dataset.tab==='alerts'){initAlertMap();refreshAdmin();}
    if(button.dataset.tab==='nearby')loadPlacesByCity($('#nearbyCity').value);
  }));
  $('#recommendForm').addEventListener('submit',async event=>{
    event.preventDefault();const results=$('#recommendResults');results.innerHTML='<div class="smart-empty">Comparing route time, crowd and seats…</div>';
    try{const params=new URLSearchParams({from:$('#recommendFrom').value,to:$('#recommendTo').value,date:dateInput.value,missedBus:String($('#missedBus').checked)});const data=await api(`/recommendations?${params}`);const missedNotice=data.message?`<div class="missed-notice">${escapeHtml(data.message)}</div>`:'';results.innerHTML=missedNotice+(data.recommendations.length?data.recommendations.map(busCard).join(''):'<div class="smart-empty">No upcoming available buses remain on this route. Try another date or destination.</div>');}
    catch(error){showError(results,error);}
  });
  async function loadPlacesByCity(city){
    const target=$('#nearbyResults');if(!city)return;target.innerHTML='<div class="smart-empty">Finding places…</div>';
    try{const data=await api(`/places?city=${encodeURIComponent(city)}`);renderPlaces(data.places||[],target);}
    catch(error){showError(target,error);}
  }
  function renderPlaces(places,target){
    const stops=places.filter(place=>place.kind==='stop'),landmarks=places.filter(place=>place.kind==='landmark');
    if(!places.length){target.innerHTML='<div class="smart-empty">No places are listed for this location yet. Try a different city.</div>';return;}
    target.innerHTML=`<section class="place-group"><h3>Bus stops <span>${stops.length}</span></h3>${stops.length?stops.map(place=>`<article class="place-card"><span class="place-icon stop-icon">↗</span><div><b>${escapeHtml(place.name)}</b><small>${escapeHtml(place.city)} · ${place.distanceKm===undefined?'Stop in network':`${place.distanceKm} km away`}</small><small>${(place.buses||[]).length} listed services · Next sample bus ${escapeHtml(place.nextBus||'—')}</small></div><span class="place-kind">BUS STOP</span></article>`).join(''):'<p class="smart-empty">No stops listed nearby.</p>'}</section><section class="place-group"><h3>Landmarks <span>${landmarks.length}</span></h3>${landmarks.length?landmarks.map(place=>`<article class="place-card"><span class="place-icon landmark-icon">✦</span><div><b>${escapeHtml(place.name)}</b><small>${escapeHtml(place.city)} · ${escapeHtml(place.category||'Local place')}${place.distanceKm===undefined?'':` · ${place.distanceKm} km away`}</small></div><span class="place-kind">${escapeHtml(place.category||'LANDMARK').toUpperCase()}</span></article>`).join(''):'<p class="smart-empty">No landmarks listed nearby.</p>'}</section>`;
  }
  $('#nearbyForm').addEventListener('submit',event=>{event.preventDefault();loadPlacesByCity($('#nearbyCity').value);});
  $('#nearbyCity').addEventListener('change',()=>loadPlacesByCity($('#nearbyCity').value));
  $('#useLocationButton').addEventListener('click',()=>{
    if(!navigator.geolocation){toast('Location is not available in this browser. Choose a city instead.');return;}
    const button=$('#useLocationButton');button.disabled=true;button.textContent='Getting location…';
    navigator.geolocation.getCurrentPosition(async position=>{
      try{const {latitude,longitude}=position.coords,data=await api(`/places?lat=${latitude}&lng=${longitude}`);const near=(data.places||[]).filter(place=>place.distanceKm<=50);renderPlaces(near,$('#nearbyResults'));if(!near.length)toast('No listed stops or landmarks within 50 km.');}
      catch(error){showError($('#nearbyResults'),error);}
      finally{button.disabled=false;button.textContent='◎ Use my location';}
    },()=>{button.disabled=false;button.textContent='◎ Use my location';toast('Could not get your location. Allow location access or search by city.');},{enableHighAccuracy:false,timeout:9000,maximumAge:300000});
  });
  $('#lostForm').addEventListener('submit',async event=>{
    event.preventDefault();const form=event.currentTarget,payload=Object.fromEntries(new FormData(form).entries());
    try{const data=await api('/lost-found',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});$('#lostResult').innerHTML=`<div class="case-success"><span>✓</span><div><b>Report received</b><small>${escapeHtml(data.message)}</small></div><strong>${escapeHtml(data.caseId)}</strong></div>`;$('#caseLookupInput').value=data.caseId;form.reset();form.querySelector('[name=travelDate]').value=today;toast('Lost-item case created. Keep the case reference.');}
    catch(error){showError($('#lostResult'),error);}
  });
    $('#caseLookupForm').addEventListener('submit',async event=>{
      event.preventDefault();const result=$('#caseLookupResult');
      try{const data=await api(`/lost-found/${encodeURIComponent($('#caseLookupInput').value.trim())}`);result.innerHTML=`<div class="case-success"><span>✓</span><div><b>${escapeHtml(data.caseId)} · ${escapeHtml(data.status)}</b><small>${escapeHtml(data.itemType)} report for ${escapeHtml(data.busNo)} · ${escapeHtml(data.travelDate)}</small></div></div>`;}
      catch(error){showError(result,error);}
    });
  $('#driverSearchForm').addEventListener('submit',async event=>{
    event.preventDefault();const target=$('#driverControls');target.innerHTML='<div class="smart-empty">Loading buses for this route…</div>';
    try{const params=new URLSearchParams({from:$('#driverFrom').value,to:$('#driverTo').value,date:driverDate.value});const data=await api(`/buses?${params}`);driverBuses=data.buses||[];if(window.AIBusAuth?.user?.role==='driver')driverBuses=driverBuses.filter(bus=>window.AIBusAuth.user.busNos.includes(bus.busNo));renderDriverControls(target);}
    catch(error){showError(target,error);}
  });
  function renderDriverControls(target){
    if(!driverBuses.length){target.innerHTML='<div class="smart-empty">No sample services found. Choose two supported cities.</div>';return;}
    target.innerHTML=`<form class="driver-update-form" id="driverUpdateForm"><label>ASSIGNED DEMO BUS<select id="driverBusSelect">${driverBuses.map((bus,index)=>`<option value="${index}">${escapeHtml(bus.busNo)} · ${escapeHtml(bus.type)} · ${escapeHtml(bus.departure)}</option>`).join('')}</select></label><div class="driver-current" id="driverCurrent"></div><div class="driver-edit-row"><label>PASSENGERS ON BOARD<input id="passengerCount" type="number" min="0" max="${driverBuses[0].seatsTotal}" value="${driverBuses[0].occupiedSeats||0}"></label><label>TRIP STATUS<select id="driverStatus"><option>On time</option><option>Delayed</option><option>Route change</option><option>Departed</option><option>Arrived</option></select></label><button class="smart-primary" type="submit">Save demo update</button></div><small>Manual sample update only; real bus sensors are not connected.</small></form>`;
    const updateCurrent=()=>{const bus=driverBuses[Number($('#driverBusSelect').value)];$('#passengerCount').max=bus.seatsTotal;$('#passengerCount').value=bus.occupiedSeats||0;$('#driverCurrent').innerHTML=`<b>${escapeHtml(bus.source)} → ${escapeHtml(bus.destination)}</b><span>${escapeHtml(bus.ownership||'Demo operator')} · ${escapeHtml(bus.type)} · ${escapeHtml(bus.crowd||'LOW')} CROWD</span><span>${bus.seatsAvailable} seats available of ${bus.seatsTotal} · Simulated trip location</span>`;};
    $('#driverBusSelect').addEventListener('change',updateCurrent);updateCurrent();
    $('#driverUpdateForm').addEventListener('submit',async event=>{event.preventDefault();const bus=driverBuses[Number($('#driverBusSelect').value)];try{await api(`/driver/${encodeURIComponent(bus.id)}/status`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({passengerCount:Number($('#passengerCount').value),status:$('#driverStatus').value})});toast('Demo passenger and service status updated. Search this route again to see it.');}catch(error){toast(error.message);}});
  }
  async function createEmergency(bus=null){
    const payload={busId:bus?.id||null,busNo:bus?.busNo||'DEMO SERVICE',route:bus?`${bus.source} → ${bus.destination}`:`${$('#driverFrom').value} → ${$('#driverTo').value}`,locationLabel:bus?.source||'Demo location near selected route',lat:bus?.origin?.lat,lng:bus?.origin?.lng,description:'Driver initiated emergency simulation. No real emergency services are contacted.'};
    try{const alert=await api('/emergency',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});toast(`Demo alert ${alert.id} created. No real emergency services are contacted.`);refreshAdmin();}
    catch(error){toast(error.message);}
  }
  $('#driverEmergencyButton').addEventListener('click',()=>createEmergency(driverBuses[Number($('#driverBusSelect')?.value)]||null));
  async function refreshAdmin(){
    try{
      const [summary,alerts,notifications,cases]=await Promise.all([api('/admin/summary'),api('/emergency'),api('/notifications'),api('/lost-found')]);
      $('#adminMetrics').innerHTML=`<div class="smart-stat"><small>FLEET TEMPLATES</small><b>${summary.buses}</b></div><div class="smart-stat"><small>SUPPORTED ROUTE PAIRS</small><b>${Number(summary.routes).toLocaleString()}</b></div><div class="smart-stat emergency-stat"><small>ACTIVE ALERTS</small><b>${summary.activeEmergencies}</b></div><div class="smart-stat"><small>LOST-ITEM CASES</small><b>${summary.lostFoundCases}</b></div>`;
      renderNotifications(notifications.notifications||[]);renderEmergencies(alerts.emergencies||[]);renderCases(cases.cases||[]);renderEmergencyMap(alerts.emergencies||[]);
    }catch(error){showError($('#notificationList'),error);$('#emergencyList').innerHTML='';$('#caseList').innerHTML='';}
  }
  function initAlertMap(){
    if(!window.L||alertMap)return;
    alertMap=L.map('adminAlertMap',{scrollWheelZoom:false}).setView([22.8,79.2],4.5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap'}).addTo(alertMap);
    setTimeout(()=>alertMap.invalidateSize(),150);
  }
  function renderEmergencyMap(items){
    initAlertMap();if(!alertMap)return;
    emergencyMarkers.forEach(marker=>alertMap.removeLayer(marker));emergencyMarkers=[];
    items.filter(item=>item.location?.lat&&item.location?.lng).forEach(item=>{
      const marker=L.circleMarker([item.location.lat,item.location.lng],{radius:9,color:'#fff',weight:2,fillColor:'#c32338',fillOpacity:1}).addTo(alertMap);
      marker.bindPopup(`<b>${escapeHtml(item.id)} · SIMULATED</b><br>${escapeHtml(item.busNo)}<br>${escapeHtml(item.route)}<br>${escapeHtml(item.locationLabel)}`);emergencyMarkers.push(marker);
    });
    if(emergencyMarkers.length)alertMap.fitBounds(L.featureGroup(emergencyMarkers).getBounds().pad(.4),{maxZoom:9});
    setTimeout(()=>alertMap.invalidateSize(),120);
  }
  function renderNotifications(items){$('#notificationList').innerHTML=items.length?items.slice(0,8).map(item=>`<article class="notice-row ${item.level==='HIGH'?'notice-high':''}"><span class="notice-bullet">${item.level==='HIGH'?'!':'•'}</span><div><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.message)}</small><small>${new Date(item.createdAt).toLocaleString()}</small></div><span class="status-word">${escapeHtml(item.level)}</span></article>`).join(''):'<p class="smart-empty">No notifications yet. New demo emergency alerts appear here.</p>';}
  function renderEmergencies(items){$('#emergencyList').innerHTML=items.length?items.map(item=>`<article class="notice-row notice-high"><span class="notice-bullet">!</span><div><b>${escapeHtml(item.id)} · ${escapeHtml(item.status)}</b><small>${escapeHtml(item.busNo)} · ${escapeHtml(item.route)}</small><small>${escapeHtml(item.locationLabel)} · ${new Date(item.createdAt).toLocaleString()}</small></div>${item.status==='ACTIVE'?`<button class="resolve-button" data-resolve="${escapeHtml(item.id)}" type="button">Resolve</button>`:''}</article>`).join(''):'<p class="smart-empty">No active alerts. Use the driver demo to create a test alert.</p>';}
  function renderCases(items){$('#caseList').innerHTML=items.length?items.map(item=>`<article class="notice-row"><span class="notice-bullet">▣</span><div><b>${escapeHtml(item.caseId)} · ${escapeHtml(item.status)}</b><small>${escapeHtml(item.itemType)} · ${escapeHtml(item.busNo)} · seat ${escapeHtml(item.approximateSeat||'—')} · ${escapeHtml(item.travelDate)}</small><small>${escapeHtml(item.description)}</small><small>Protected follow-up contact: ${escapeHtml(item.contact)}</small></div><select class="case-status" data-case-status="${escapeHtml(item.caseId)}" aria-label="Set lost-item case status"><option ${item.status==='RECEIVED'?'selected':''}>RECEIVED</option><option ${item.status==='UNDER REVIEW'?'selected':''}>UNDER REVIEW</option><option ${item.status==='RESOLVED'?'selected':''}>RESOLVED</option></select></article>`).join(''):'<p class="smart-empty">No lost-item reports have been submitted.</p>';}
  $('#refreshAdminButton').addEventListener('click',refreshAdmin);
  $('#emergencyList').addEventListener('click',async event=>{const button=event.target.closest('[data-resolve]');if(!button)return;try{await api(`/emergency/${encodeURIComponent(button.dataset.resolve)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'RESOLVED'})});refreshAdmin();toast('Demo alert marked resolved.');}catch(error){toast(error.message);}});
  $('#caseList').addEventListener('change',async event=>{const select=event.target.closest('[data-case-status]');if(!select)return;try{await api(`/lost-found/${encodeURIComponent(select.dataset.caseStatus)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:select.value})});toast('Case status updated.');refreshAdmin();}catch(error){toast(error.message);}});
  window.AIBusAuth?.ready.then(user=>{
    $$('.smart-tab').forEach(button=>{if(button.dataset.tab==='driver'&&!['driver','admin'].includes(user?.role))button.hidden=true;if(button.dataset.tab==='alerts'&&user?.role!=='admin')button.hidden=true;});
    const requestedPanel=location.hash==='#panel-driver'&&['driver','admin'].includes(user?.role)?'driver':location.hash==='#panel-alerts'&&user?.role==='admin'?'alerts':null;
    if(requestedPanel)$(`.smart-tab[data-tab="${requestedPanel}"]`)?.click();
  });
  loadCities().then(()=>{if($('#nearbyCity').value)loadPlacesByCity($('#nearbyCity').value);$('#recommendForm').requestSubmit();});
  alertTimer=setInterval(()=>{if(!$('#panel-alerts').hidden)refreshAdmin();},12000);
  window.addEventListener('beforeunload',()=>clearInterval(alertTimer));
})();
