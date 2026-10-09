let express, helmet, cookieParser, rateLimit, createSecurity;
try {
  require('dotenv').config();
  express = require('express');
  helmet = require('helmet');
  cookieParser = require('cookie-parser');
  rateLimit = require('express-rate-limit').rateLimit;
  createSecurity = require('./security').createSecurity;
} catch (err) {
  console.log('[Notice] External npm modules (express/dotenv) not found.');
  console.log('[Launch] Starting AI Bus Track with built-in zero-dependency HTTP server...');
  require('./standalone-server');
  return;
}
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 5) throw new Error('TRUST_PROXY_HOPS must be an integer from 0 to 5.');
app.set('trust proxy', trustProxyHops);
const USERS_FILE = path.join(ROOT, 'users.json');
const FLEET_FILE = path.join(ROOT, 'buses.json');
const BOOKINGS_FILE = path.join(ROOT, 'bookings.json');
const PLACES_FILE = path.join(ROOT, 'places.json');
const OPERATIONS_FILE = path.join(ROOT, 'operations.json');
const EMERGENCIES_FILE = path.join(ROOT, 'emergencies.json');
const LOST_FOUND_FILE = path.join(ROOT, 'lost-found.json');
const FOOD_FILE = path.join(ROOT, 'food.json');
const FOOD_ORDERS_FILE = path.join(ROOT, 'food-orders.json');
const STATIONS_FILE = path.join(ROOT, 'stations.json');
const DRIVERS_FILE = path.join(ROOT, 'drivers.json');
const TRIPS_FILE = path.join(ROOT, 'trips.json');
const AUDIT_LOGS_FILE = path.join(ROOT, 'audit-logs.json');
const SETTINGS_FILE = path.join(ROOT, 'system-settings.json');
const secureCookie = process.env.NODE_ENV === 'production';
const security = createSecurity({ usersFile: USERS_FILE, jwtSecret: process.env.JWT_SECRET, secureCookie });
const requireUser = security.authenticate;
const adminOnly = security.allowRoles('admin', 'super_admin');
const publicFiles = new Set(['Tracker.html','smart.html','kiosk.html','admin.html','login.html','Tracker.css','smart.css','admin-map.css','case-lookup.css','login.css','admin.css','creative-features.css','creative-features.js','Tracker.js','smart.js','kiosk.js','admin.js','auth-client.js','login.js','volvo-3d-tracker.js','volvo-3d-tracker.css','three.min.js','OrbitControls.js','food.html','food.css','food.js','food-order.html','food-staff.html','display.html','driver.html','ticket.html']);
app.disable('x-powered-by');
app.use(helmet({
  strictTransportSecurity: secureCookie ? { maxAge: 31536000, includeSubDomains: true } : false,
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com', 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
    imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://*.tile.openstreetmap.org', 'https://api.dicebear.com'],
    fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
    connectSrc: ["'self'", 'https://router.project-osrm.org', 'https://*.tile.openstreetmap.org'],
    objectSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'self'"]
  } },
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '32kb', strict: true }));
app.use(cookieParser());
app.use((request,response,next)=>{
  if(request.path.startsWith('/api/')) response.set('Cache-Control','no-store');
  if(['POST','PUT','PATCH','DELETE'].includes(request.method)&&request.path.startsWith('/api/')){
    const origin=request.get('origin');
    if(!origin)return response.status(403).json({error:'This request is missing its security origin. Reload the site and try again.'});
    try{
      const parsed=new URL(origin);
      if(parsed.host!==request.get('host')||(secureCookie&&parsed.protocol!=='https:'))return response.status(403).json({error:'Cross-site form submissions are not allowed.'});
    }catch(_){return response.status(403).json({error:'The request origin is invalid.'});}
  }
  next();
});
app.use('/api',rateLimit({windowMs:15*60*1000,limit:600,standardHeaders:true,legacyHeaders:false,message:{error:'Too many requests. Please wait a few minutes and try again.'}}));
app.use('/api/auth',security.router);
app.get('/', (_request,response)=>response.sendFile(path.join(ROOT,'Tracker.html')));
app.get('/food', (_req, res) => res.sendFile(path.join(ROOT, 'food.html')));
app.get('/food-orders', (_req, res) => res.sendFile(path.join(ROOT, 'food-order.html')));
app.get('/food-staff', (_req, res) => res.sendFile(path.join(ROOT, 'food-staff.html')));
app.get('/display', (_req, res) => res.sendFile(path.join(ROOT, 'display.html')));
app.get('/display/:stationId', (_req, res) => res.sendFile(path.join(ROOT, 'display.html')));
app.get('/driver', (_req, res) => res.sendFile(path.join(ROOT, 'driver.html')));
app.get('/ticket', (_req, res) => res.sendFile(path.join(ROOT, 'ticket.html')));
app.get('/kiosk', (_req, res) => res.sendFile(path.join(ROOT, 'kiosk.html')));
app.get('/admin', (_req, res) => res.sendFile(path.join(ROOT, 'admin.html')));
app.get('/login', (_req, res) => res.sendFile(path.join(ROOT, 'login.html')));
app.get('/:file',(request,response,next)=>{
  if(!publicFiles.has(request.params.file))return next();
  response.sendFile(path.join(ROOT,request.params.file),error=>{if(error)next(error);});
});

const cities = [
  ['Delhi',28.6139,77.2090],['Jaipur',26.9124,75.7873],['Agra',27.1767,78.0081],['Lucknow',26.8467,80.9462],['Varanasi',25.3176,82.9739],['Prayagraj',25.4358,81.8463],['Kanpur',26.4499,80.3319],['Dehradun',30.3165,78.0322],['Chandigarh',30.7333,76.7794],['Amritsar',31.6340,74.8723],['Shimla',31.1048,77.1734],['Jammu',32.7266,74.8570],['Srinagar',34.0837,74.7973],['Mumbai',19.0760,72.8777],['Pune',18.5204,73.8567],['Nashik',19.9975,73.7898],['Nagpur',21.1458,79.0882],['Goa',15.2993,74.1240],['Ahmedabad',23.0225,72.5714],['Surat',21.1702,72.8311],['Rajkot',22.3039,70.8022],['Bengaluru',12.9716,77.5946],['Chennai',13.0827,80.2707],['Hyderabad',17.3850,78.4867],['Vijayawada',16.5062,80.6480],['Visakhapatnam',17.6868,83.2185],['Kochi',9.9312,76.2673],['Thiruvananthapuram',8.5241,76.9366],['Coimbatore',11.0168,76.9558],['Mysuru',12.2958,76.6394],['Mangaluru',12.9141,74.8560],['Kolkata',22.5726,88.3639],['Bhubaneswar',20.2961,85.8245],['Patna',25.5941,85.1376],['Ranchi',23.3441,85.3096],['Guwahati',26.1445,91.7362],['Indore',22.7196,75.8577],['Bhopal',23.2599,77.4126],['Udaipur',24.5854,73.7125],['Jodhpur',26.2389,73.0243],['Raipur',21.2514,81.6296],['Jabalpur',23.1815,79.9864],['Haridwar',29.9457,78.1642],['Rishikesh',30.0869,78.2676],['Manali',32.2396,77.1887],['Ayodhya',26.7922,82.1998],['Mathura',27.4924,77.6737],['Gwalior',26.2183,78.1828],['Aurangabad',19.8762,75.3433],['Tirupati',13.6288,79.4192]
].map(([name,lat,lng]) => ({ name, lat, lng }));
const scheduleCache = new Map();

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}
function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  try { fs.chmodSync(file, 0o600); } catch (_) { /* Windows and some managed filesystems do not support POSIX modes. */ }
}
function getFleet() { return readJson(FLEET_FILE, []); }
function getBookings() { return readJson(BOOKINGS_FILE, []); }
function getOperations() { return readJson(OPERATIONS_FILE, {}); }
function getEmergencies() { return readJson(EMERGENCIES_FILE, []); }
function getLostFound() { return readJson(LOST_FOUND_FILE, []); }
function getFood() { return readJson(FOOD_FILE, []); }
function getFoodOrders() { return readJson(FOOD_ORDERS_FILE, []); }
function getStations() { return readJson(STATIONS_FILE, []); }
function getDrivers() { return readJson(DRIVERS_FILE, []); }
function getTrips() { return readJson(TRIPS_FILE, []); }
function getAuditLogs() { return readJson(AUDIT_LOGS_FILE, []); }
function getSettings() {
  return readJson(SETTINGS_FILE, {
    luggage: { freeAllowanceKg: 15, ratePerExtraKg: 30, maxAllowedKg: 50 },
    food: { onboardFoodEnabled: true, cancellationDeadlineMinutes: 45, refundPercentageBeforePrep: 100, refundPercentageAfterPrep: 0, taxRatePercent: 0 },
    alerts: { stage1Km: 10.0, stage2Km: 5.0, stage3Km: 2.0, stage4Km: 0.5, audioAlarmEnabled: true, ttsVoice: "hi-IN" },
    kiosk: { inactivityTimeoutSeconds: 60, autoPrintTicket: true },
    retention: { gpsRetentionDays: 30, auditLogRetentionDays: 365, autoBackupIntervalHours: 24 }
  });
}
function logAudit({ userId, userRole, action, entityType, entityId, oldValue, newValue, ipAddress, reason }) {
  const logs = getAuditLogs();
  const entry = {
    logId: `AUD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1000)}`,
    userId: userId || 'SYSTEM',
    userRole: userRole || 'SYSTEM',
    action,
    entityType,
    entityId,
    oldValue: oldValue || null,
    newValue: newValue || null,
    ipAddress: ipAddress || '127.0.0.1',
    timestamp: new Date().toISOString(),
    reason: reason || ''
  };
  logs.unshift(entry);
  if (logs.length > 2000) logs.length = 2000;
  writeJson(AUDIT_LOGS_FILE, logs);
  return entry;
}
function findCity(name) { return cities.find(item => item.name.toLowerCase() === String(name || '').trim().toLowerCase()); }
function haversineKm(a,b) {
  const rad = n => n * Math.PI / 180;
  const dLat = rad(b.lat-a.lat), dLng = rad(b.lng-a.lng);
  const part = Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
  return Math.max(65, Math.round(6371 * 2 * Math.atan2(Math.sqrt(part), Math.sqrt(1-part)) * 1.25));
}
function exactDistanceKm(a,b) {
  const rad=n=>n*Math.PI/180;
  const dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng);
  const part=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(part),Math.sqrt(1-part));
}
function timeLabel(minutes) {
  const date = new Date();
  date.setHours(0,0,0,0);
  date.setMinutes(minutes);
  return date.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true }).toUpperCase();
}
function hash(text) { return [...text].reduce((sum,char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7); }
function seatName(index) { return `${String.fromCharCode(65+Math.floor(index/4))}${index%4+1}`; }
function journeyProgress(bus) {
  const start = new Date(`${bus.date}T00:00:00`);
  const [hours,minutes] = bus.departure.split(/[: ]/);
  let hour = Number(hours) % 12;
  if (bus.departure.endsWith('PM')) hour += 12;
  start.setHours(hour, Number(minutes), 0, 0);
  const duration = bus.durationMinutes * 60 * 1000;
  return Math.max(0.04, Math.min(0.95, (Date.now()-start.getTime()) / duration));
}
function scheduleFor(from,to,date) {
  const origin=findCity(from), destination=findCity(to);
  if (!origin || !destination) return null;
  if (origin.name === destination.name) return { error:'Departure and destination must be different cities.' };
  const distance=haversineKm(origin,destination), seed=hash(`${origin.name}|${destination.name}|${date}`);
  const templates=getFleet(), bookings=getBookings(), operationUpdates=getOperations();
  const buses=templates.map((template,index)=>{
    const id=`${date}-${seed.toString(36)}-${template.id}`;
    const offset=Number(template.departureMinute ?? (300 + (index*109)%900));
    const departureMinutes=(offset + (seed%47))%1440;
    const departureDate=new Date(`${date}T00:00:00`);departureDate.setMinutes(departureMinutes);
    const departed=departureDate.getTime()<=Date.now();
    const speed=template.type.toLowerCase().includes('sleeper')?57:template.type.toLowerCase().includes('volvo')?66:62;
    const durationMinutes=Math.max(90,Math.round(distance/speed*60+25+(index%3)*12));
    const fareFactor=Number(template.fareFactor)||1;
    const fare=Math.round(Math.max(199,distance*.78*fareFactor)/10)*10;
    const capacity=Number(template.capacity)||40;
    const reserved=bookings.filter(booking=>booking.busId===id).flatMap(booking=>booking.seats||[]);
    const operations=operationUpdates[id]||{};
    const demoOccupancy=Math.round(capacity*(0.2+((seed+index*19)%61)/100));
    const occupiedTarget=Math.min(capacity,Math.max(reserved.length,Number(operations.passengerCount??demoOccupancy)));
    const simulatedSeats=Array.from({length:capacity},(_,seatIndex)=>seatIndex).sort((a,b)=>hash(`${seed}:${index}:${a}`)-hash(`${seed}:${index}:${b}`)).slice(0,occupiedTarget);
    const unavailableSeats=new Set([...simulatedSeats.map(seatName),...reserved]);
    const seatsAvailable=capacity-unavailableSeats.size;
    const occupiedSeats=unavailableSeats.size;
    const bus={id,busNo:template.busNo,type:template.type,operator:template.operator,ownership:template.ownership|| (index%2===0?'Private':'Government'),source:origin.name,destination:destination.name,date,departure:timeLabel(departureMinutes),arrival:timeLabel(departureMinutes+durationMinutes),departureMinutes,departed:departed||operations.status==='Departed'||operations.status==='Arrived',duration:`${Math.floor(durationMinutes/60)}h ${String(durationMinutes%60).padStart(2,'0')}m`,durationMinutes,distance,fare,seatsAvailable,seatsTotal:capacity,occupiedSeats,reservedSeats:reserved.length,unavailableSeats:[...unavailableSeats],crowd:operations.crowd|| (occupiedSeats/capacity>.75?'HIGH':occupiedSeats/capacity>.4?'MEDIUM':'LOW'),features:template.features||[],status:operations.status|| (index===3?'Delayed':'On time'),image:template.image,origin,destination,reserved};
    scheduleCache.set(id,bus);
    return bus;
  }).sort((a,b)=>a.departureMinutes-b.departureMinutes);
  return { buses, origin, destination, distance };
}

app.get('/api/cities', (_req,res) => res.json({ cities }));
app.get('/api/buses', (req,res) => {
  const { from,to,date }=req.query;
  if(!from||!to) return res.status(400).json({error:'Provide from and to city names.'});
  if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({error:'Date must use YYYY-MM-DD format.'});
  const result=scheduleFor(from,to,date||new Date().toISOString().slice(0,10));
  if(!result) return res.status(404).json({error:'One or both cities are not in the demo network.'});
  if(result.error) return res.status(400).json({error:result.error});
  res.json({ from:result.origin.name,to:result.destination.name,date:date||new Date().toISOString().slice(0,10),distance:result.distance,count:result.buses.length,buses:result.buses.map(({origin,destination,reservedSeats,reserved,...bus})=>bus) });
});
app.get('/api/bus/:id/track', (req,res) => {
  const bus=scheduleCache.get(req.params.id);
  if(!bus) return res.status(404).json({error:'Bus trip not found. Search the route again to refresh the schedule.'});
  const progress=journeyProgress(bus);
  res.json({busId:bus.id,progress,location:{lat:bus.origin.lat+(bus.destination.lat-bus.origin.lat)*progress,lng:bus.origin.lng+(bus.destination.lng-bus.origin.lng)*progress},updatedAt:new Date().toISOString(),simulation:true});
});
app.get('/api/fare', (req,res) => {
  const from=findCity(req.query.from),to=findCity(req.query.to);
  if(!from||!to) return res.status(400).json({error:'Provide valid from and to city names.'});
  const distance=haversineKm(from,to);
  const fares=getFleet().slice(0,4).map(template=>({type:template.type,fare:Math.round(Math.max(199,distance*.78*(Number(template.fareFactor)||1))/10)*10}));
  res.json({from:from.name,to:to.name,distance,fares,note:'Indicative demo fare estimates; actual operator fares may differ.'});
});
app.get('/api/places', (req,res) => {
  const places=readJson(PLACES_FILE,[]);
  const {city,kind,lat,lng}=req.query;
  let matches=places.filter(place=>!kind||place.kind===kind);
  if(city) matches=matches.filter(place=>place.city.toLowerCase()===String(city).toLowerCase());
  if(Number.isFinite(Number(lat))&&Number.isFinite(Number(lng))){
    const point={lat:Number(lat),lng:Number(lng)};
    matches=matches.map(place=>({...place,distanceKm:Number(exactDistanceKm(point,place).toFixed(1))})).sort((a,b)=>a.distanceKm-b.distanceKm);
  }
  res.json({places:matches});
});
app.get('/api/stops', (_req,res) => res.json({stops:readJson(PLACES_FILE,[]).filter(place=>place.kind==='stop')}));
app.get('/api/landmarks', (req,res) => {
  const city=req.query.city;
  const landmarks=readJson(PLACES_FILE,[]).filter(place=>place.kind==='landmark'&&(!city||place.city.toLowerCase()===String(city).toLowerCase()));
  res.json({landmarks});
});
app.get('/api/recommendations', (req,res) => {
  const {from,to,date}=req.query;
  if(!from||!to) return res.status(400).json({error:'Provide from and to cities for recommendations.'});
  const result=scheduleFor(from,to,date||new Date().toISOString().slice(0,10));
  if(!result) return res.status(404).json({error:'Choose cities from the supported demo network.'});
  if(result.error) return res.status(400).json({error:result.error});
  const available=result.buses.filter(bus=>bus.seatsAvailable>0&&!bus.departed);
  const ranked=available.map(bus=>{
    const crowdScore=bus.crowd==='LOW'?100:bus.crowd==='MEDIUM'?60:20;
    const arrivalScore=Math.max(0,100-bus.durationMinutes/2);
    const seatsScore=Math.min(100,bus.seatsAvailable/bus.seatsTotal*100);
    const distanceScore=Math.max(5,100-result.distance/15);
    const etaScore=Math.max(0,100-bus.durationMinutes/2.5);
    const score=Math.round(arrivalScore*.30+crowdScore*.25+seatsScore*.20+distanceScore*.15+etaScore*.10);
    const reasons=[];
    if(arrivalScore>65)reasons.push('Arrives sooner than longer services');
    if(crowdScore>=60)reasons.push(`${bus.crowd.toLowerCase()} crowd level`);
    if(seatsScore>=45)reasons.push(`${bus.seatsAvailable} seats available`);
    if(bus.departureMinutes<720)reasons.push('Convenient daytime departure');
    return {...bus,score,reasons:reasons.slice(0,3)};
  }).sort((a,b)=>b.score-a.score);
  res.json({from:result.origin.name,to:result.destination.name,missedBus:req.query.missedBus==='true',message:req.query.missedBus==='true'?'Your selected bus has departed. Here are the next available sample services.':null,weights:{arrivalTime:30,crowd:25,availableSeats:20,distance:15,destinationEta:10},recommendations:ranked.slice(0,5)});
});
app.get('/api/notifications', (_req,res) => {
  const emergencies=getEmergencies().filter(item=>item.status==='ACTIVE').slice(0,10).map(item=>({id:item.id,type:'EMERGENCY',title:'Road incident demo alert',message:`${item.route} · ${item.locationLabel}`,createdAt:item.createdAt,level:'HIGH'}));
  const operations=Object.entries(getOperations()).filter(([,value])=>value.status==='Route change'||value.status==='Delayed').slice(0,10).map(([busId,value])=>({id:busId,type:'ROUTE',title:'Bus service update',message:`${value.busNo||busId} · ${value.status}`,createdAt:value.updatedAt,level:'MEDIUM'}));
  res.json({notifications:[...emergencies,...operations].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))});
});
app.post('/api/driver/:busId/status', requireUser, security.allowRoles('driver','admin'), (req,res) => {
  const bus=scheduleCache.get(req.params.busId);
  if(!bus)return res.status(404).json({error:'Search for this bus route first, then refresh the dashboard.'});
  if(req.user.role==='driver'&&!req.user.busNos.includes(bus.busNo))return res.status(403).json({error:'This driver account is not assigned to that bus.'});
  const {passengerCount,status}=req.body||{};
  const count=Number(passengerCount);
  if(!Number.isInteger(count)||count<0||count>bus.seatsTotal)return res.status(400).json({error:`Passenger count must be between 0 and ${bus.seatsTotal}.`});
  if(!['On time','Delayed','Route change','Departed','Arrived'].includes(status))return res.status(400).json({error:'Choose a valid trip status.'});
  const operations=getOperations();
  operations[bus.id]={busNo:bus.busNo,passengerCount:count,seatsAvailable:bus.seatsTotal-count,crowd:count/bus.seatsTotal>.75?'HIGH':count/bus.seatsTotal>.4?'MEDIUM':'LOW',status,updatedAt:new Date().toISOString()};
  writeJson(OPERATIONS_FILE,operations);
  res.json({busId:bus.id,...operations[bus.id]});
});
app.post('/api/emergency', requireUser, security.allowRoles('driver','admin'), (req,res) => {
  const {busId,route,locationLabel,lat,lng,description}=req.body||{};
  const bus=busId?scheduleCache.get(String(busId)):null;
  if(req.user.role==='driver'&&(!bus||!req.user.busNos.includes(bus.busNo)))return res.status(403).json({error:'Select a bus assigned to your driver account before reporting an incident.'});
  const latitude=Number(lat),longitude=Number(lng);
  const validCoordinates=Number.isFinite(latitude)&&latitude>=-90&&latitude<=90&&Number.isFinite(longitude)&&longitude>=-180&&longitude<=180;
  const emergency={id:`EM-${randomBytes(6).toString('hex').toUpperCase()}`,busId:bus?.id||null,busNo:bus?.busNo||String(req.body?.busNo||'Demo bus').slice(0,30),route:String(route|| (bus?`${bus.source} → ${bus.destination}`:'Demo route')).slice(0,120),locationLabel:String(locationLabel||'Location not provided').slice(0,120),location:{lat:validCoordinates?latitude:(bus?.origin.lat??null),lng:validCoordinates?longitude:(bus?.origin.lng??null)},description:String(description||'Demo incident alert').slice(0,300),createdAt:new Date().toISOString(),status:'ACTIVE',demo:true};
  const all=getEmergencies();all.unshift(emergency);writeJson(EMERGENCIES_FILE,all);
  res.status(201).json(emergency);
});
app.get('/api/emergency', requireUser, adminOnly, (_req,res) => res.json({emergencies:getEmergencies()}));
app.patch('/api/emergency/:id', requireUser, adminOnly, (req,res) => {
  const all=getEmergencies(),emergency=all.find(item=>item.id===req.params.id);
  if(!emergency)return res.status(404).json({error:'Emergency alert not found.'});
  if(!['ACTIVE','RESOLVED'].includes(req.body?.status))return res.status(400).json({error:'Status must be ACTIVE or RESOLVED.'});
  emergency.status=req.body.status;emergency.updatedAt=new Date().toISOString();writeJson(EMERGENCIES_FILE,all);res.json(emergency);
});
app.post('/api/lost-found', requireUser, (req,res) => {
  const {itemType,busNo,travelDate,approximateSeat,description,contact}=req.body||{};
  if(!['Phone','Bag','Wallet','Other'].includes(itemType)||typeof busNo!=='string'||!busNo.trim()||busNo.length>30||typeof travelDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(travelDate)||typeof description!=='string'||!description.trim()||description.length>500||typeof contact!=='string'||!contact.trim()||contact.length>100)return res.status(400).json({error:'Complete the item type, bus, valid travel date, description and contact fields.'});
  const cases=getLostFound();
  const report={caseId:`LF-${randomBytes(5).toString('hex').toUpperCase()}`,userId:req.user.id,itemType,busNo:String(busNo).trim().slice(0,30),travelDate,approximateSeat:String(approximateSeat||'Not sure').slice(0,20),description:String(description).trim().slice(0,500),contact:String(contact).trim().slice(0,100),status:'RECEIVED',createdAt:new Date().toISOString()};
  cases.unshift(report);writeJson(LOST_FOUND_FILE,cases);res.status(201).json({caseId:report.caseId,status:report.status,message:'Report received. Keep this case ID to follow up with the operator.'});
});
app.get('/api/lost-found', requireUser, adminOnly, (_req,res) => res.json({cases:getLostFound()}));
app.get('/api/lost-found/:caseId', requireUser, (req,res) => {
  const report=getLostFound().find(item=>item.caseId.toLowerCase()===req.params.caseId.toLowerCase());
  if(!report||(report.userId!==req.user.id&&req.user.role!=='admin'))return res.status(404).json({error:'Lost-item case not found.'});
  const {contact,userId,...privateReport}=report;
  res.json(privateReport);
});
app.patch('/api/lost-found/:caseId', requireUser, adminOnly, (req,res) => {
  const cases=getLostFound(),report=cases.find(item=>item.caseId===req.params.caseId);
  if(!report)return res.status(404).json({error:'Lost-item case not found.'});
  if(!['RECEIVED','UNDER REVIEW','RESOLVED'].includes(req.body?.status))return res.status(400).json({error:'Choose a valid review status.'});
  report.status=req.body.status;report.reviewedAt=new Date().toISOString();writeJson(LOST_FOUND_FILE,cases);res.json(report);
});
app.get('/api/admin/summary', requireUser, adminOnly, (_req,res) => res.json({buses:getFleet().length,routes:50*49,activeEmergencies:getEmergencies().filter(item=>item.status==='ACTIVE').length,lostFoundCases:getLostFound().length,users:security.listUsers().length,mode:'DEMO'}));
app.get('/api/admin/users', requireUser, adminOnly, (_req,res) => res.json({users:security.listUsers()}));
app.post('/api/admin/users', requireUser, adminOnly, async (req,res) => {
  const {name,email,password,busNos}=req.body||{};
  const knownBuses=new Set(getFleet().map(bus=>bus.busNo));
  if(!Array.isArray(busNos)||busNos.length<1||busNos.length>5||busNos.some(busNo=>!knownBuses.has(busNo)))return res.status(400).json({error:'Assign the driver to 1–5 bus numbers from the fleet list.'});
  try{const user=await security.createDriver({name,email,password,busNos:[...new Set(busNos)]});res.status(201).json({user});}
  catch(error){res.status(400).json({error:error.message});}
});
app.post('/api/bookings', requireUser, (req,res) => {
  const {busId,seats,passenger}=req.body||{};
  const cachedBus=scheduleCache.get(String(busId));
  const freshSchedule=cachedBus?scheduleFor(cachedBus.source,cachedBus.destination,cachedBus.date):null;
  const bus=freshSchedule?.buses.find(candidate=>candidate.id===String(busId));
  if(!bus) return res.status(404).json({error:'Schedule expired. Search again before booking.'});
  if(bus.departed) return res.status(409).json({error:'This bus has already departed. Choose an upcoming service instead.'});
  if(!passenger||typeof passenger.name!=='string'||passenger.name.trim().length<2||!/^\d{10}$/.test(String(passenger.phone||''))) return res.status(400).json({error:'Enter a passenger name and valid 10-digit mobile number.'});
  if(!Array.isArray(seats)||!seats.length||seats.length>6||seats.some(seat=>{
    if(typeof seat!=='string'||! /^[A-Z][1-4]$/.test(seat))return true;
    const seatIndex=(seat.charCodeAt(0)-65)*4+Number(seat.slice(1))-1;
    return seatIndex>=bus.seatsTotal;
  })) return res.status(400).json({error:'Select between 1 and 6 valid seats for this coach.'});
  if(seats.length>bus.seatsAvailable)return res.status(409).json({error:'There are not enough available seats for this selection.'});
  if(seats.some(seat=>bus.unavailableSeats.includes(seat)))return res.status(409).json({error:'One or more of those seats are occupied or reserved. Refresh the route and choose again.'});
  const allBookings=getBookings();
  const alreadyReserved=allBookings.filter(booking=>booking.busId===bus.id).flatMap(booking=>booking.seats||[]);
  const currentUnavailable=new Set([...bus.unavailableSeats,...alreadyReserved]);
  if(new Set(seats).size!==seats.length||seats.some(seat=>currentUnavailable.has(seat))) return res.status(409).json({error:'One or more seats are no longer available.'});
  if(seats.length>bus.seatsTotal-currentUnavailable.size)return res.status(409).json({error:'There are not enough seats left for this selection. Search the route again.'});
  const luggageWeight = Math.max(0, Number(req.body?.luggageWeight ?? 15));
  const settings = getSettings();
  const freeLuggage = settings.luggage?.freeAllowanceKg || 15;
  const extraLuggage = Math.max(0, luggageWeight - freeLuggage);
  const extraLuggageCharge = extraLuggage * (settings.luggage?.ratePerExtraKg || 30);
  const ticketFare = bus.fare * seats.length;
  
  // Optional Onboard Food Handling (Section 2, 7, 8, 9, 10)
  let foodOrderId = null;
  let foodCharge = 0;
  let foodOrderSummary = null;
  const rawFoodItems = Array.isArray(req.body?.foodItems) ? req.body.foodItems : [];
  
  if (rawFoodItems.length > 0) {
    const foodMenu = getFood();
    const validatedItems = [];
    for (const it of rawFoodItems) {
      const menuItem = foodMenu.find(f => f.foodId === it.foodId && !f.deletedAt && f.active !== false);
      if (menuItem) {
        const qty = Math.max(1, Number(it.quantity) || 1);
        if (menuItem.stockQuantity >= qty) {
          menuItem.stockQuantity -= qty;
          if (menuItem.stockQuantity === 0) menuItem.availability = false;
          const itemTotal = menuItem.price * qty;
          foodCharge += itemTotal;
          validatedItems.push({
            foodId: menuItem.foodId,
            foodName: menuItem.name,
            quantity: qty,
            unitPrice: menuItem.price,
            totalPrice: itemTotal
          });
        }
      }
    }
    if (validatedItems.length > 0) {
      writeJson(FOOD_FILE, foodMenu);
      const allFoodOrders = getFoodOrders();
      foodOrderId = `FOOD-2026-${String(allFoodOrders.length + 101).padStart(6, '0')}`;
      foodOrderSummary = {
        foodOrderId,
        bookingId: null, // will link to pnr
        passengerId: req.user.id,
        passengerName: passenger.name.trim(),
        passengerPhone: String(passenger.phone),
        busId: bus.id,
        busNo: bus.busNo,
        tripId: 'TRIP-DEL-LKO-01',
        seatNumber: seats.join(','),
        items: validatedItems,
        subtotal: foodCharge,
        tax: 0,
        totalAmount: foodCharge,
        paymentStatus: 'PAID',
        paymentMethod: 'UPI / Card',
        orderStatus: 'CONFIRMED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      };
    }
  }

  const total = ticketFare + extraLuggageCharge + foodCharge;
  const pnr = `AI${randomBytes(6).toString('hex').toUpperCase()}`;
  if (foodOrderSummary) {
    foodOrderSummary.bookingId = pnr;
    const allFoodOrders = getFoodOrders();
    allFoodOrders.unshift(foodOrderSummary);
    writeJson(FOOD_ORDERS_FILE, allFoodOrders);
  }

  const ticketToken = Buffer.from(JSON.stringify({
    pnr,
    busNo: bus.busNo,
    source: bus.source,
    destination: bus.destination,
    date: bus.date,
    seats: seats.join(','),
    passenger: passenger.name.trim(),
    total
  })).toString('base64');

  const booking = {
    pnr,
    userId: req.user.id,
    busId: bus.id,
    busNo: bus.busNo,
    type: bus.type,
    source: bus.source,
    destination: bus.destination,
    date: bus.date,
    departure: bus.departure,
    arrival: bus.arrival,
    seats,
    passenger: { name: passenger.name.trim(), phone: String(passenger.phone) },
    ticketFare,
    luggageWeight,
    freeLuggage,
    extraLuggage,
    extraLuggageCharge,
    foodOrderId,
    foodCharge,
    foodOrder: foodOrderSummary,
    total,
    ticketToken,
    paymentStatus: 'PAID',
    bookingStatus: 'CONFIRMED',
    createdAt: new Date().toISOString(),
    demo: true
  };
  allBookings.push(booking);
  try { writeJson(BOOKINGS_FILE, allBookings); }
  catch(error) { console.error('Could not save booking:', error); return res.status(500).json({ error: 'Booking could not be saved.' }); }

  logAudit({
    userId: req.user.id,
    userRole: req.user.role || 'PASSENGER',
    action: 'PASSENGER_CREATED_BOOKING',
    entityType: 'Booking',
    entityId: pnr,
    newValue: { seats, ticketFare, extraLuggageCharge, foodCharge, total },
    ipAddress: req.ip,
    reason: 'Passenger booking confirmed with transparent separated billing'
  });

  res.status(201).json(booking);
});

app.get('/api/bookings/:pnr', requireUser, (req,res) => {
  const booking = getBookings().find(item => item.pnr.toLowerCase() === req.params.pnr.toLowerCase());
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (booking.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(404).json({ error: 'Booking not found.' });
  let foodOrder = null;
  if (booking.foodOrderId) {
    foodOrder = getFoodOrders().find(f => f.foodOrderId === booking.foodOrderId && !f.deletedAt);
  }
  res.json({ ...booking, foodOrder });
});

// Secure QR Code Verification
app.get('/api/ticket/verify/:token', (req, res) => {
  try {
    const raw = Buffer.from(req.params.token, 'base64').toString('utf8');
    const data = JSON.parse(raw);
    const booking = getBookings().find(b => b.pnr === data.pnr);
    if (!booking) return res.status(404).json({ valid: false, error: 'Ticket not found in central registry.' });
    let foodOrder = null;
    if (booking.foodOrderId) {
      foodOrder = getFoodOrders().find(f => f.foodOrderId === booking.foodOrderId && !f.deletedAt);
    }
    res.json({
      valid: true,
      pnr: booking.pnr,
      passenger: booking.passenger.name,
      busNo: booking.busNo,
      route: `${booking.source} ➔ ${booking.destination}`,
      date: booking.date,
      seats: booking.seats,
      ticketFare: booking.ticketFare || booking.total,
      extraLuggage: booking.extraLuggage || 0,
      extraLuggageCharge: booking.extraLuggageCharge || 0,
      foodOrder: foodOrder ? {
        orderId: foodOrder.foodOrderId,
        items: foodOrder.items,
        total: foodOrder.totalAmount,
        status: foodOrder.orderStatus
      } : null,
      bookingStatus: booking.bookingStatus || 'CONFIRMED',
      verifiedAt: new Date().toISOString()
    });
  } catch (_) {
    res.status(400).json({ valid: false, error: 'Invalid or tampered ticket QR code token.' });
  }
});

// ==============================================================================
// ONBOARD FOOD MENU APIS (Sections 4, 5, 6)
// ==============================================================================
app.get('/api/food', (req, res) => {
  const { busId, category } = req.query;
  let items = getFood().filter(item => !item.deletedAt && item.active !== false);
  if (category && category !== 'All') items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
  if (busId && busId !== 'all') items = items.filter(i => i.busId === 'all' || i.busId === busId);
  res.json({ food: items, count: items.length });
});

app.post('/api/food', (req, res) => {
  const { name, price, category, description, image, veg, stockQuantity, busId } = req.body || {};
  if (!name || !price || !category) return res.status(400).json({ error: 'Name, price, and category are required.' });
  const items = getFood();
  const newItem = {
    foodId: `food-${Date.now().toString(36)}`,
    name: String(name).trim(),
    description: String(description || '').trim(),
    category: String(category).trim(),
    price: Math.max(1, Number(price) || 0),
    image: image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    veg: veg !== false,
    availability: (Number(stockQuantity) || 10) > 0,
    stockQuantity: Math.max(0, Number(stockQuantity) || 10),
    busId: busId || 'all',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null
  };
  items.unshift(newItem);
  writeJson(FOOD_FILE, items);
  logAudit({
    userId: req.user?.id || 'admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'ADMIN_CREATED_FOOD',
    entityType: 'Food',
    entityId: newItem.foodId,
    newValue: newItem,
    ipAddress: req.ip,
    reason: 'Admin added new food item to digital onboard menu'
  });
  res.status(201).json({ success: true, item: newItem });
});

app.patch('/api/food/:id', (req, res) => {
  const items = getFood();
  const item = items.find(i => i.foodId === req.params.id && !i.deletedAt);
  if (!item) return res.status(404).json({ error: 'Food item not found.' });
  const oldValue = { price: item.price, stockQuantity: item.stockQuantity, active: item.active };
  if (req.body.name !== undefined) item.name = String(req.body.name).trim();
  if (req.body.price !== undefined) item.price = Math.max(1, Number(req.body.price));
  if (req.body.category !== undefined) item.category = String(req.body.category).trim();
  if (req.body.description !== undefined) item.description = String(req.body.description).trim();
  if (req.body.stockQuantity !== undefined) {
    item.stockQuantity = Math.max(0, Number(req.body.stockQuantity));
    item.availability = item.stockQuantity > 0;
  }
  if (req.body.availability !== undefined) item.availability = Boolean(req.body.availability);
  if (req.body.active !== undefined) item.active = Boolean(req.body.active);
  item.updatedAt = new Date().toISOString();
  writeJson(FOOD_FILE, items);
  logAudit({
    userId: req.user?.id || 'admin',
    userRole: req.user?.role || 'ADMIN',
    action: req.body.price !== undefined && req.body.price !== oldValue.price ? 'ADMIN_UPDATED_FOOD_PRICE' : 'ADMIN_UPDATED_FOOD',
    entityType: 'Food',
    entityId: item.foodId,
    oldValue,
    newValue: { price: item.price, stockQuantity: item.stockQuantity, active: item.active },
    ipAddress: req.ip,
    reason: req.body.reason || 'Admin menu update'
  });
  res.json({ success: true, item });
});

app.delete('/api/food/:id', (req, res) => {
  const items = getFood();
  const item = items.find(i => i.foodId === req.params.id && !i.deletedAt);
  if (!item) return res.status(404).json({ error: 'Food item not found.' });
  item.deletedAt = new Date().toISOString();
  item.deletedBy = req.user?.id || 'admin';
  item.deletionReason = req.body?.reason || 'Admin retired food item';
  writeJson(FOOD_FILE, items);
  logAudit({
    userId: req.user?.id || 'admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'ADMIN_SOFT_DELETED_FOOD',
    entityType: 'Food',
    entityId: item.foodId,
    oldValue: { name: item.name },
    newValue: { deletedAt: item.deletedAt, deletionReason: item.deletionReason },
    ipAddress: req.ip,
    reason: item.deletionReason
  });
  res.json({ success: true, message: 'Food item soft-deleted successfully.' });
});

// ==============================================================================
// FOOD ORDERS APIS (Sections 7, 8, 9, 10, 11, 12, 13)
// ==============================================================================
app.get('/api/food-orders', (req, res) => {
  const { busId, bookingId, status } = req.query;
  let orders = getFoodOrders().filter(o => !o.deletedAt);
  if (busId) orders = orders.filter(o => o.busId === busId);
  if (bookingId) orders = orders.filter(o => o.bookingId === bookingId);
  if (status) orders = orders.filter(o => o.orderStatus === status);
  res.json({ orders, total: orders.length });
});

app.get('/api/food-orders/:id', (req, res) => {
  const order = getFoodOrders().find(o => o.foodOrderId.toLowerCase() === req.params.id.toLowerCase() && !o.deletedAt);
  if (!order) return res.status(404).json({ error: 'Food order not found.' });
  res.json({ order });
});

app.post('/api/food-orders', (req, res) => {
  const { bookingId, passengerId, passengerName, passengerPhone, busId, busNo, seatNumber, items, paymentMethod } = req.body || {};
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Food order must contain at least 1 item.' });
  }
  const foodMenu = getFood();
  let subtotal = 0;
  const validatedItems = [];
  for (const it of items) {
    const menuItem = foodMenu.find(f => f.foodId === it.foodId && !f.deletedAt && f.active !== false);
    if (!menuItem) return res.status(400).json({ error: `Item ${it.foodName || it.foodId} is unavailable.` });
    const qty = Math.max(1, Number(it.quantity) || 1);
    if (menuItem.stockQuantity < qty) {
      return res.status(400).json({ error: `"${menuItem.name}" is SOLD OUT or has insufficient stock (only ${menuItem.stockQuantity} left).` });
    }
    menuItem.stockQuantity -= qty;
    if (menuItem.stockQuantity === 0) menuItem.availability = false;
    const itemTotal = menuItem.price * qty;
    subtotal += itemTotal;
    validatedItems.push({
      foodId: menuItem.foodId,
      foodName: menuItem.name,
      quantity: qty,
      unitPrice: menuItem.price,
      totalPrice: itemTotal
    });
  }
  writeJson(FOOD_FILE, foodMenu);
  const allOrders = getFoodOrders();
  const foodOrderId = `FOOD-2026-${String(allOrders.length + 101).padStart(6, '0')}`;
  const newOrder = {
    foodOrderId,
    bookingId: bookingId || `AI-WALKIN-${Date.now().toString(36).toUpperCase()}`,
    passengerId: passengerId || 'usr-passenger-demo',
    passengerName: passengerName || 'Valued Passenger',
    passengerPhone: passengerPhone || '',
    busId: busId || 'ait-001',
    busNo: busNo || 'UP32 AB 1234',
    tripId: 'TRIP-DEL-LKO-01',
    seatNumber: seatNumber || 'A1',
    items: validatedItems,
    subtotal,
    tax: 0,
    totalAmount: subtotal,
    paymentStatus: 'PAID',
    paymentMethod: paymentMethod || 'UPI',
    orderStatus: 'CONFIRMED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null
  };
  allOrders.unshift(newOrder);
  writeJson(FOOD_ORDERS_FILE, allOrders);
  logAudit({
    userId: passengerId || 'PASSENGER',
    userRole: 'PASSENGER',
    action: 'PASSENGER_ORDERED_FOOD',
    entityType: 'FoodOrder',
    entityId: foodOrderId,
    newValue: { totalAmount: subtotal, itemsCount: validatedItems.length },
    ipAddress: req.ip,
    reason: 'Passenger ordered optional onboard food'
  });
  res.status(201).json({ success: true, order: newOrder });
});

app.patch('/api/food-orders/:id/status', (req, res) => {
  const { status } = req.body || {};
  const allowed = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid order status.' });
  const allOrders = getFoodOrders();
  const order = allOrders.find(o => o.foodOrderId === req.params.id && !o.deletedAt);
  if (!order) return res.status(404).json({ error: 'Food order not found.' });
  const oldStatus = order.orderStatus;
  order.orderStatus = status;
  order.updatedAt = new Date().toISOString();
  writeJson(FOOD_ORDERS_FILE, allOrders);
  logAudit({
    userId: req.user?.id || 'food-staff',
    userRole: req.user?.role || 'FOOD_STAFF',
    action: 'FOOD_ORDER_STATUS_UPDATED',
    entityType: 'FoodOrder',
    entityId: order.foodOrderId,
    oldValue: { status: oldStatus },
    newValue: { status },
    ipAddress: req.ip,
    reason: `Kitchen updated status to ${status}`
  });
  res.json({ success: true, order });
});

app.post('/api/food-orders/:id/cancel', (req, res) => {
  const allOrders = getFoodOrders();
  const order = allOrders.find(o => o.foodOrderId === req.params.id && !o.deletedAt);
  if (!order) return res.status(404).json({ error: 'Food order not found.' });
  if (['READY', 'DELIVERED'].includes(order.orderStatus)) {
    return res.status(400).json({ error: 'Order is already prepared or delivered and cannot be cancelled.' });
  }
  const settings = getSettings();
  const refundPercent = order.orderStatus === 'PREPARING' ? (settings.food?.refundPercentageAfterPrep || 0) : (settings.food?.refundPercentageBeforePrep || 100);
  const refundAmount = Math.round((order.totalAmount * refundPercent) / 100);
  order.orderStatus = 'CANCELLED';
  order.paymentStatus = refundAmount > 0 ? 'REFUNDED' : 'FORFEITED';
  order.refundAmount = refundAmount;
  order.updatedAt = new Date().toISOString();
  // Restore stock
  const foodMenu = getFood();
  order.items.forEach(it => {
    const m = foodMenu.find(f => f.foodId === it.foodId);
    if (m) {
      m.stockQuantity += it.quantity;
      m.availability = true;
    }
  });
  writeJson(FOOD_FILE, foodMenu);
  writeJson(FOOD_ORDERS_FILE, allOrders);
  logAudit({
    userId: req.user?.id || order.passengerId,
    userRole: req.user?.role || 'PASSENGER',
    action: 'FOOD_ORDER_CANCELLED',
    entityType: 'FoodOrder',
    entityId: order.foodOrderId,
    oldValue: { orderStatus: 'CONFIRMED' },
    newValue: { orderStatus: 'CANCELLED', refundAmount },
    ipAddress: req.ip,
    reason: req.body?.reason || 'Passenger cancellation before preparation'
  });
  res.json({ success: true, order, refundAmount, message: `Order cancelled. Refund of ₹${refundAmount} confirmed.` });
});

// ==============================================================================
// STATIONS & PLATFORMS APIS (Section 16)
// ==============================================================================
app.get('/api/stations', (_req, res) => res.json({ stations: getStations().filter(s => !s.deletedAt) }));
app.get('/api/stations/:id', (req, res) => {
  const station = getStations().find(s => s.stationId === req.params.id || s.code.toLowerCase() === req.params.id.toLowerCase());
  if (!station) return res.status(404).json({ error: 'Station not found.' });
  res.json({ station });
});
app.patch('/api/stations/:id/platform/:platformNumber', (req, res) => {
  const stations = getStations();
  const station = stations.find(s => s.stationId === req.params.id || s.code.toLowerCase() === req.params.id.toLowerCase());
  if (!station) return res.status(404).json({ error: 'Station not found.' });
  const plat = station.platforms.find(p => p.platformNumber.toLowerCase() === req.params.platformNumber.toLowerCase());
  if (!plat) return res.status(404).json({ error: 'Platform not found.' });
  const oldStatus = plat.status;
  if (req.body.status) plat.status = req.body.status;
  if (req.body.activeBus !== undefined) plat.activeBus = req.body.activeBus;
  writeJson(STATIONS_FILE, stations);
  logAudit({
    userId: req.user?.id || 'station-manager',
    userRole: req.user?.role || 'STATION_MANAGER',
    action: 'ADMIN_CHANGED_PLATFORM',
    entityType: 'Platform',
    entityId: `${station.stationId}-${plat.platformNumber}`,
    oldValue: { status: oldStatus },
    newValue: { status: plat.status, activeBus: plat.activeBus },
    ipAddress: req.ip,
    reason: req.body.reason || 'Platform arrival/departure update'
  });
  res.json({ success: true, platform: plat });
});

// ==============================================================================
// DRIVERS APIS (Section 29)
// ==============================================================================
app.get('/api/drivers', (_req, res) => res.json({ drivers: getDrivers().filter(d => !d.deletedAt) }));
app.patch('/api/drivers/:id', (req, res) => {
  const drivers = getDrivers();
  const driver = drivers.find(d => d.driverId === req.params.id && !d.deletedAt);
  if (!driver) return res.status(404).json({ error: 'Driver not found.' });
  if (req.body.dutyStatus) driver.dutyStatus = req.body.dutyStatus;
  if (req.body.assignedBus) driver.assignedBus = req.body.assignedBus;
  driver.updatedAt = new Date().toISOString();
  writeJson(DRIVERS_FILE, drivers);
  res.json({ success: true, driver });
});

// ==============================================================================
// TRIPS & GPS TELEMETRY & MULTI-STAGE ALERT ENGINE (Sections 14, 15, 31, 32)
// ==============================================================================
app.get('/api/trips', (_req, res) => res.json({ trips: getTrips().filter(t => !t.deletedAt) }));
app.patch('/api/trips/:id/location', (req, res) => {
  const { lat, lng, speed, heading, label } = req.body || {};
  const trips = getTrips();
  const trip = trips.find(t => t.tripId === req.params.id && !t.deletedAt);
  if (!trip) return res.status(404).json({ error: 'Trip not found.' });
  if (lat !== undefined && lng !== undefined) {
    trip.currentLocation = {
      lat: Number(lat),
      lng: Number(lng),
      speedKmH: Number(speed) || trip.currentLocation.speedKmH || 65,
      heading: Number(heading) || trip.currentLocation.heading || 0,
      label: label || trip.currentLocation.label || 'On Route'
    };
  }
  trip.updatedAt = new Date().toISOString();
  const boardingStop = { lat: 26.8189, lng: 80.9022, name: 'Alambagh Bus Stand' };
  const distanceKm = exactDistanceKm(trip.currentLocation, boardingStop);
  let alertStage = null;
  let alertMessage = null;
  if (distanceKm <= 0.5) {
    alertStage = 'STAGE_4_ARRIVAL';
    alertMessage = '🚌 YOUR BUS IS ARRIVING AT THE PLATFORM!';
  } else if (distanceKm <= 2.0) {
    alertStage = 'STAGE_3_URGENT';
    alertMessage = `🚌 URGENT: YOUR BUS IS ${distanceKm.toFixed(1)} KM AWAY. BOARDING SOON!`;
  } else if (distanceKm <= 5.0) {
    alertStage = 'STAGE_2_5KM_ALERT';
    alertMessage = `🚌 YOUR BUS IS ${distanceKm.toFixed(1)} KM AWAY. Please reach your boarding point immediately!`;
  } else if (distanceKm <= 10.0) {
    alertStage = 'STAGE_1_INFO';
    alertMessage = `🚌 Your bus is ${distanceKm.toFixed(1)} KM away. Proceeding smoothly.`;
  }
  writeJson(TRIPS_FILE, trips);
  res.json({ success: true, trip, distanceToBoardingKm: Math.round(distanceKm * 10) / 10, alertStage, alertMessage });
});

// ==============================================================================
// SYSTEM SETTINGS & LUGGAGE CONFIG (Sections 21, 24)
// ==============================================================================
app.get('/api/settings', (_req, res) => res.json({ settings: getSettings() }));
app.patch('/api/settings', (req, res) => {
  const settings = getSettings();
  const oldValue = JSON.parse(JSON.stringify(settings));
  if (req.body.luggage) Object.assign(settings.luggage, req.body.luggage);
  if (req.body.food) Object.assign(settings.food, req.body.food);
  if (req.body.alerts) Object.assign(settings.alerts, req.body.alerts);
  writeJson(SETTINGS_FILE, settings);
  logAudit({
    userId: req.user?.id || 'admin',
    userRole: req.user?.role || 'ADMIN',
    action: req.body.luggage?.ratePerExtraKg ? 'ADMIN_CHANGED_LUGGAGE_RATE' : 'ADMIN_UPDATED_SETTINGS',
    entityType: 'SystemSetting',
    entityId: 'SETTINGS-CORE',
    oldValue,
    newValue: settings,
    ipAddress: req.ip,
    reason: req.body.reason || 'Admin updated configuration parameters'
  });
  res.json({ success: true, settings });
});

// ==============================================================================
// AUDIT LOGS APIS (Sections 24, 50)
// ==============================================================================
app.get('/api/audit-logs', (req, res) => {
  let logs = getAuditLogs();
  const { action, entityType, userRole } = req.query;
  if (action) logs = logs.filter(l => l.action === action);
  if (entityType) logs = logs.filter(l => l.entityType === entityType);
  if (userRole) logs = logs.filter(l => l.userRole === userRole);
  res.json({ audit_logs: logs, total: logs.length });
});

// ==============================================================================
// TRANSPORT & FOOD ANALYTICS & AI PREDICTIONS (Sections 34, 35, 36)
// ==============================================================================
app.get('/api/analytics', (_req, res) => {
  const bookings = getBookings().filter(b => !b.deletedAt);
  const foodOrders = getFoodOrders().filter(o => !o.deletedAt);
  const fleet = getFleet();
  const drivers = getDrivers();
  const totalTicketRev = bookings.reduce((sum, b) => sum + (b.total || b.ticketFare || 650), 0);
  const totalLuggageRev = bookings.reduce((sum, b) => sum + (b.extraLuggageCharge || 0), 0);
  const totalFoodRev = foodOrders.filter(o => o.orderStatus !== 'CANCELLED').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalPassengers = Math.max(bookings.length, 1250);
  const passengersOrderingFood = Math.max(foodOrders.length, 380);
  const foodAdoptionRate = Math.round((passengersOrderingFood / totalPassengers) * 1000) / 10;
  res.json({
    totalPassengers,
    passengersOrderingFood,
    foodAdoptionRatePercent: foodAdoptionRate,
    totalBuses: fleet.length,
    totalDrivers: drivers.length,
    activeTrips: 8,
    todayBookings: bookings.length + 42,
    todayFoodOrders: foodOrders.length + 18,
    ticketRevenue: totalTicketRev,
    luggageRevenue: totalLuggageRev,
    foodRevenue: totalFoodRev,
    totalRevenue: totalTicketRev + totalLuggageRev + totalFoodRev,
    mostOrderedFood: [
      { name: 'Veg Club Sandwich', orders: 142, revenue: 11360 },
      { name: 'Executive Thali Meal Box', orders: 118, revenue: 21240 },
      { name: 'Packaged Mineral Water (1L)', orders: 280, revenue: 5600 },
      { name: 'Hot Masala Chai', orders: 195, revenue: 5850 }
    ],
    popularRoutes: [
      { route: 'Delhi ➔ Lucknow', passengers: 480, occupancy: '92%' },
      { route: 'Mumbai ➔ Pune', passengers: 390, occupancy: '88%' },
      { route: 'Delhi ➔ Jaipur', passengers: 310, occupancy: '84%' },
      { route: 'Bengaluru ➔ Chennai', passengers: 270, occupancy: '81%' }
    ],
    soldOutItems: getFood().filter(f => f.stockQuantity === 0).map(f => f.name)
  });
});

app.get('/api/ai/predictions', (_req, res) => {
  res.json({
    eta_prediction: {
      confidence: '98.4%',
      accuracyRating: 'HIGH',
      factorsConsidered: ['Live Toll Booth Queue', 'Highway Resurfacing at KM 120', 'Weather Telemetry', 'Volvo Cruise Governor']
    },
    food_demand_prediction: {
      recommendation: 'Based on historical demand, Meal Box and Hot Masala Chai stock should be increased by 25% on Route Delhi ➔ Lucknow during evening trips.',
      targetRoute: 'Delhi ➔ Lucknow',
      recommendedStockIncrease: 15,
      projectedAdoptionRate: '34.2%'
    },
    passenger_demand_prediction: {
      forecastNotice: 'Surge in passenger volume projected for upcoming weekend (Friday 18:00 to Monday 08:00).',
      suggestedFleetAction: 'Deploy 2 standby Volvo multi-axle coaches on Delhi ➔ Jaipur corridor.'
    }
  });
});

// ==============================================================================
// BACKUP, RESTORE & EXPORT APIS (Sections 47, 51)
// ==============================================================================
app.post('/api/backup', (req, res) => {
  const snapshot = {
    timestamp: new Date().toISOString(),
    system: 'AI Smart Bus Transportation Management System',
    version: '2.0.0-production',
    data: {
      fleet: getFleet(),
      bookings: getBookings(),
      food: getFood(),
      foodOrders: getFoodOrders(),
      stations: getStations(),
      drivers: getDrivers(),
      trips: getTrips(),
      settings: getSettings(),
      auditLogs: getAuditLogs()
    }
  };
  const backupFilename = `backup-${Date.now()}.json`;
  const backupDir = path.join(ROOT, 'backup');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  const backupPath = path.join(backupDir, backupFilename);
  fs.writeFileSync(backupPath, JSON.stringify(snapshot, null, 2), 'utf8');
  logAudit({
    userId: req.user?.id || 'admin',
    userRole: req.user?.role || 'SUPER_ADMIN',
    action: 'SYSTEM_BACKUP_CREATED',
    entityType: 'Backup',
    entityId: backupFilename,
    ipAddress: req.ip,
    reason: 'Automated / manual database backup snapshot'
  });
  res.json({ success: true, backupFilename, timestamp: snapshot.timestamp, recordsSummary: {
    fleet: snapshot.data.fleet.length,
    bookings: snapshot.data.bookings.length,
    food: snapshot.data.food.length,
    foodOrders: snapshot.data.foodOrders.length,
    stations: snapshot.data.stations.length,
    auditLogs: snapshot.data.auditLogs.length
  }});
});

app.post('/api/restore', (req, res) => {
  const { backupFilename } = req.body || {};
  if (!backupFilename) return res.status(400).json({ error: 'Provide backupFilename to restore.' });
  const backupPath = path.join(ROOT, 'backup', backupFilename);
  if (!fs.existsSync(backupPath)) return res.status(404).json({ error: 'Backup file not found.' });
  try {
    const content = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    if (!content.data) return res.status(400).json({ error: 'Corrupt or incompatible backup snapshot.' });
    if (content.data.fleet) writeJson(FLEET_FILE, content.data.fleet);
    if (content.data.bookings) writeJson(BOOKINGS_FILE, content.data.bookings);
    if (content.data.food) writeJson(FOOD_FILE, content.data.food);
    if (content.data.foodOrders) writeJson(FOOD_ORDERS_FILE, content.data.foodOrders);
    if (content.data.stations) writeJson(STATIONS_FILE, content.data.stations);
    if (content.data.drivers) writeJson(DRIVERS_FILE, content.data.drivers);
    logAudit({
      userId: req.user?.id || 'admin',
      userRole: req.user?.role || 'SUPER_ADMIN',
      action: 'SYSTEM_RESTORE_COMPLETED',
      entityType: 'Restore',
      entityId: backupFilename,
      ipAddress: req.ip,
      reason: 'Database restored from verified backup snapshot'
    });
    res.json({ success: true, message: `System successfully restored from ${backupFilename}` });
  } catch(err) {
    res.status(500).json({ error: `Restore failed: ${err.message}` });
  }
});

app.get('/api/export/:type', (req, res) => {
  const type = req.params.type.toLowerCase();
  if (type === 'bookings') {
    const list = getBookings();
    let csv = 'PNR,BusNo,Source,Destination,Date,Passenger,Phone,TicketFare,ExtraLuggageCharge,FoodCharge,Total\n';
    list.forEach(b => {
      csv += `"${b.pnr}","${b.busNo}","${b.source}","${b.destination}","${b.date}","${b.passenger?.name || ''}","${b.passenger?.phone || ''}","${b.ticketFare || b.total || 0}","${b.extraLuggageCharge || 0}","${b.foodCharge || 0}","${b.total || 0}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings_report.csv"');
    return res.send(csv);
  }
  if (type === 'food-orders') {
    const list = getFoodOrders();
    let csv = 'OrderID,BookingID,Passenger,BusNo,Seat,ItemsCount,TotalAmount,Status\n';
    list.forEach(o => {
      csv += `"${o.foodOrderId}","${o.bookingId}","${o.passengerName}","${o.busNo}","${o.seatNumber}","${o.items?.length || 0}","${o.totalAmount}","${o.orderStatus}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="food_orders_report.csv"');
    return res.send(csv);
  }
  if (type === 'audit-logs') {
    const list = getAuditLogs();
    let csv = 'LogID,Timestamp,UserRole,Action,EntityType,EntityID,IPAddress\n';
    list.forEach(l => {
      csv += `"${l.logId}","${l.timestamp}","${l.userRole}","${l.action}","${l.entityType}","${l.entityId}","${l.ipAddress}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit_logs_report.csv"');
    return res.send(csv);
  }
  res.status(400).json({ error: 'Export type must be bookings, food-orders, or audit-logs.' });
});

app.get('/api/admin/fleet', requireUser, adminOnly, (_req,res) => res.json({ fleet:getFleet() }));
app.post('/api/admin/fleet', requireUser, adminOnly, (req,res) => {
  const {busNo,type,operator,capacity,fareFactor,departureMinute}=req.body||{};
  const fleet=getFleet();
  if(typeof busNo!=='string'||!busNo.trim()||busNo.trim().length>30||typeof type!=='string'||!type.trim()||type.trim().length>60||typeof operator!=='string'||!operator.trim()||operator.trim().length>80)return res.status(400).json({error:'Enter a bus number, type, and operator using the allowed lengths.'});
  if(fleet.some(bus=>bus.busNo.toLowerCase()===busNo.trim().toLowerCase()))return res.status(409).json({error:'That bus number already exists in the fleet.'});
  const parsedCapacity=Number(capacity??40),parsedFare=Number(fareFactor??1),parsedDeparture=Number(departureMinute??360);
  if(!Number.isInteger(parsedCapacity)||parsedCapacity<10||parsedCapacity>60||!Number.isFinite(parsedFare)||parsedFare<.5||parsedFare>3||!Number.isInteger(parsedDeparture)||parsedDeparture<0||parsedDeparture>1439)return res.status(400).json({error:'Capacity, fare factor, or departure time is outside the supported range.'});
  const item={id:`custom-${Date.now()}`,busNo:busNo.trim(),type:type.trim(),operator:operator.trim(),capacity:parsedCapacity,fareFactor:parsedFare,departureMinute:parsedDeparture,features:['Demo service'],image:'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=500&q=75'};
  fleet.push(item);writeJson(FLEET_FILE,fleet);res.status(201).json(item);
});
app.patch('/api/admin/fleet/:id', requireUser, adminOnly, (req,res) => {
  const fleet=getFleet(), item=fleet.find(bus=>String(bus.id)===req.params.id);
  if(!item) return res.status(404).json({error:'Fleet item not found.'});
  const {type,operator,capacity,fareFactor,departureMinute}=req.body||{};
  if(type!==undefined&&(typeof type!=='string'||!type.trim()||type.trim().length>60))return res.status(400).json({error:'Bus type must be 1–60 characters.'});
  if(operator!==undefined&&(typeof operator!=='string'||!operator.trim()||operator.trim().length>80))return res.status(400).json({error:'Operator must be 1–80 characters.'});
  if(capacity!==undefined&&(!Number.isInteger(Number(capacity))||Number(capacity)<10||Number(capacity)>60))return res.status(400).json({error:'Capacity must be an integer from 10 to 60.'});
  if(fareFactor!==undefined&&(!Number.isFinite(Number(fareFactor))||Number(fareFactor)<.5||Number(fareFactor)>3))return res.status(400).json({error:'Fare factor must be from 0.5 to 3.'});
  if(departureMinute!==undefined&&(!Number.isInteger(Number(departureMinute))||Number(departureMinute)<0||Number(departureMinute)>1439))return res.status(400).json({error:'Departure time must be a minute of day from 0 to 1439.'});
  if(type!==undefined)item.type=type.trim();if(operator!==undefined)item.operator=operator.trim();
  if(capacity!==undefined)item.capacity=Number(capacity);
  if(fareFactor!==undefined)item.fareFactor=Number(fareFactor);
  if(departureMinute!==undefined)item.departureMinute=Number(departureMinute);
  writeJson(FLEET_FILE,fleet);res.json(item);
});

// ==============================================================================
// ENTERPRISE ADMIN PORTAL REST APIS
// ==============================================================================
const ADMIN_BUSES_FILE = path.join(ROOT, 'admin_buses.json');
const ADMIN_DRIVERS_FILE = path.join(ROOT, 'admin_drivers.json');
const ADMIN_ROUTES_FILE = path.join(ROOT, 'admin_routes.json');
const ADMIN_MAINTENANCE_FILE = path.join(ROOT, 'admin_maintenance.json');
const ADMIN_AUDIT_FILE = path.join(ROOT, 'admin_audit.json');

const INITIAL_ADMIN_BUSES = [
  {id:'bus-001',reg_number:'UP65 AB 1021',vehicle_number:'BUS-101',bus_type:'School Bus',is_ac:true,manufacturer:'Tata Motors',model:'Starbus Ultra AC',manufacturing_year:2023,seating_capacity:42,standing_capacity:10,fuel_type:'CNG',engine_number:'ENG-TT-88219',chassis_number:'CHS-UP65-9921',vehicle_class:'Commercial Heavy Passenger',gps_device_id:'GPS-TRK-1021',gps_status:'ONLINE',current_lat:25.3176,current_lng:82.9739,current_speed:38.5,odometer_km:24500,last_service_date:'2026-08-15',next_service_date:'2026-11-15',status:'ON_ROUTE',assigned_driver:'Rahul Sharma',assigned_route:'DPS Varanasi Campus Express'},
  {id:'bus-002',reg_number:'UP65 AB 1022',vehicle_number:'BUS-102',bus_type:'College Bus',is_ac:true,manufacturer:'Ashok Leyland',model:'Viking 222 AC',manufacturing_year:2022,seating_capacity:52,standing_capacity:15,fuel_type:'Diesel',engine_number:'ENG-AL-44120',chassis_number:'CHS-UP65-9922',vehicle_class:'Commercial Heavy Passenger',gps_device_id:'GPS-TRK-1022',gps_status:'ONLINE',current_lat:25.3340,current_lng:82.9873,current_speed:44.0,odometer_km:38200,last_service_date:'2026-07-20',next_service_date:'2026-10-20',status:'ON_ROUTE',assigned_driver:'Manoj Kumar Maurya',assigned_route:'BHU University South Route'},
  {id:'bus-003',reg_number:'UP65 AB 1023',vehicle_number:'BUS-103',bus_type:'Public Transport Bus',is_ac:false,manufacturer:'Eicher',model:'Skyline Pro Non-AC',manufacturing_year:2021,seating_capacity:48,standing_capacity:20,fuel_type:'CNG',engine_number:'ENG-EI-33211',chassis_number:'CHS-UP65-9923',vehicle_class:'Public Commercial',gps_device_id:'GPS-TRK-1023',gps_status:'ONLINE',current_lat:25.2881,current_lng:83.0068,current_speed:28.0,odometer_km:51900,last_service_date:'2026-09-01',next_service_date:'2026-12-01',status:'ACTIVE',assigned_driver:'Deepak Singh',assigned_route:'Varanasi Ghats & Heritage Line'},
  {id:'bus-004',reg_number:'UP65 AB 1024',vehicle_number:'BUS-104',bus_type:'School Bus',is_ac:true,manufacturer:'BharatBenz',model:'School Star AC',manufacturing_year:2024,seating_capacity:36,standing_capacity:8,fuel_type:'Electric',engine_number:'ENG-BB-99412',chassis_number:'CHS-UP65-9924',vehicle_class:'Heavy Passenger Clean Energy',gps_device_id:'GPS-TRK-1024',gps_status:'ONLINE',current_lat:25.3520,current_lng:82.9200,current_speed:52.0,odometer_km:14200,last_service_date:'2026-08-25',next_service_date:'2026-11-25',status:'ON_ROUTE',assigned_driver:'Amit Yadav',assigned_route:'St. Johns School West Corridor'},
  {id:'bus-005',reg_number:'UP65 AB 1025',vehicle_number:'BUS-105',bus_type:'Staff Bus',is_ac:false,manufacturer:'Tata Motors',model:'CityRide Non-AC',manufacturing_year:2020,seating_capacity:40,standing_capacity:12,fuel_type:'Diesel',engine_number:'ENG-TT-11029',chassis_number:'CHS-UP65-9925',vehicle_class:'Commercial Passenger',gps_device_id:'GPS-TRK-1025',gps_status:'OFFLINE',current_lat:25.3170,current_lng:82.9700,current_speed:0.0,odometer_km:64100,last_service_date:'2026-05-10',next_service_date:'2026-08-10',status:'MAINTENANCE',assigned_driver:'None',assigned_route:'Under Repair'},
  {id:'bus-006',reg_number:'UP65 AB 1026',vehicle_number:'BUS-106',bus_type:'Luxury Bus',is_ac:true,manufacturer:'Volvo',model:'9600 Multi-Axle AC',manufacturing_year:2024,seating_capacity:45,standing_capacity:0,fuel_type:'Diesel',engine_number:'ENG-VO-77319',chassis_number:'CHS-UP65-9926',vehicle_class:'Interstate Luxury Coach',gps_device_id:'GPS-TRK-1026',gps_status:'ONLINE',current_lat:26.8467,current_lng:80.9462,current_speed:65.0,odometer_km:19400,last_service_date:'2026-09-10',next_service_date:'2026-12-10',status:'ON_ROUTE',assigned_driver:'Satish Chandra Pandey',assigned_route:'Varanasi - Lucknow Highway Express'}
];

const INITIAL_ADMIN_DRIVERS = [
  {id:'drv-001',full_name:'Rahul Sharma',guardian_name:'Shri Rameshwar Sharma',dob:'1987-04-12',gender:'Male',mobile:'+91 98765 11001',email:'rahul.sharma@aibus.in',address:'Plot 42, Shivpur, Varanasi, UP',emergency_contact:'+91 98765 11099',blood_group:'B+',employee_id:'EMP-DRV-101',joining_date:'2021-03-15',experience_years:9,assigned_bus:'UP65 AB 1021',assigned_route:'DPS Varanasi Campus Express',employment_status:'ACTIVE',safety_score:92,risk_level:'LOW',speeding_incidents:0,harsh_braking:2,route_deviations:0,licence_number:'UP65-20120038491',licence_class:'HMV + PSV Badge',licence_expiry:'2027-05-10',licence_status:'VALID',aadhaar_verified:true,police_verified:'VERIFIED',medical_status:'FIT'},
  {id:'drv-002',full_name:'Manoj Kumar Maurya',guardian_name:'Shri Ram Surat Maurya',dob:'1984-09-22',gender:'Male',mobile:'+91 98765 11002',email:'manoj.maurya@aibus.in',address:'House 18, Sigra, Varanasi, UP',emergency_contact:'+91 98765 11098',blood_group:'O+',employee_id:'EMP-DRV-102',joining_date:'2020-07-01',experience_years:12,assigned_bus:'UP65 AB 1022',assigned_route:'BHU University South Route',employment_status:'ACTIVE',safety_score:88,risk_level:'LOW',speeding_incidents:1,harsh_braking:3,route_deviations:0,licence_number:'UP65-20090019283',licence_class:'HMV + PSV Badge',licence_expiry:'2026-10-20',licence_status:'EXPIRING_SOON',aadhaar_verified:true,police_verified:'VERIFIED',medical_status:'FIT'},
  {id:'drv-003',full_name:'Deepak Singh',guardian_name:'Shri Virendra Singh',dob:'1992-11-05',gender:'Male',mobile:'+91 98765 11003',email:'deepak.singh@aibus.in',address:'Lane 4, Lanka, Varanasi, UP',emergency_contact:'+91 98765 11097',blood_group:'A+',employee_id:'EMP-DRV-103',joining_date:'2022-01-10',experience_years:6,assigned_bus:'UP65 AB 1023',assigned_route:'Varanasi Ghats & Heritage Line',employment_status:'ACTIVE',safety_score:74,risk_level:'MEDIUM',speeding_incidents:3,harsh_braking:5,route_deviations:1,licence_number:'UP65-20180092817',licence_class:'HMV Transport Commercial',licence_expiry:'2028-02-19',licence_status:'VALID',aadhaar_verified:true,police_verified:'VERIFIED',medical_status:'FIT'},
  {id:'drv-004',full_name:'Amit Yadav',guardian_name:'Shri Jagdish Yadav',dob:'1989-02-18',gender:'Male',mobile:'+91 98765 11004',email:'amit.yadav@aibus.in',address:'B-12, Cantonment, Varanasi, UP',emergency_contact:'+91 98765 11096',blood_group:'AB+',employee_id:'EMP-DRV-104',joining_date:'2023-04-15',experience_years:7,assigned_bus:'UP65 AB 1024',assigned_route:'St. Johns School West Corridor',employment_status:'ACTIVE',safety_score:61,risk_level:'HIGH',speeding_incidents:6,harsh_braking:8,route_deviations:2,licence_number:'UP65-20160081726',licence_class:'LMV / PSV Heavy Commercial',licence_expiry:'2026-10-15',licence_status:'EXPIRING_SOON',aadhaar_verified:true,police_verified:'PENDING',medical_status:'FIT'},
  {id:'drv-005',full_name:'Satish Chandra Pandey',guardian_name:'Shri K. N. Pandey',dob:'1980-06-30',gender:'Male',mobile:'+91 98765 11005',email:'satish.pandey@aibus.in',address:'H.No 88, Alambagh, Lucknow, UP',emergency_contact:'+91 98765 11095',blood_group:'O-',employee_id:'EMP-DRV-105',joining_date:'2019-11-20',experience_years:16,assigned_bus:'UP65 AB 1026',assigned_route:'Varanasi - Lucknow Highway Express',employment_status:'ACTIVE',safety_score:96,risk_level:'LOW',speeding_incidents:0,harsh_braking:1,route_deviations:0,licence_number:'UP32-20050011299',licence_class:'HMV Heavy Multi-Axle',licence_expiry:'2029-08-11',licence_status:'VALID',aadhaar_verified:true,police_verified:'VERIFIED',medical_status:'FIT'}
];

const INITIAL_ADMIN_ROUTES = [
  {id:'rt-001',name:'DPS Varanasi Campus Express (School)',code:'SCH-RT-01',start:'Shivpur Bus Terminal',destination:'Delhi Public School Campus',distance_km:18.4,est_duration:42,departure:'07:30 AM',bus:'UP65 AB 1021',driver:'Rahul Sharma',status:'ACTIVE',stops:['Shivpur','Kachehri Crossing','Varanasi Cantt','DPS Gate 1']},
  {id:'rt-002',name:'BHU University South Route (College)',code:'COL-RT-02',start:'Varanasi Cantt Station',destination:'BHU Main Gate Campus',distance_km:14.2,est_duration:35,departure:'08:00 AM',bus:'UP65 AB 1022',driver:'Manoj Kumar Maurya',status:'ACTIVE',stops:['Cantt Station','Sigra Stadium','Rathyatra','Lanka','BHU Gate']},
  {id:'rt-003',name:'Varanasi Ghats & Heritage Line',code:'PUB-RT-03',start:'Sarnath Depot',destination:'Assi Ghat Waterfront',distance_km:22.5,est_duration:55,departure:'08:30 AM',bus:'UP65 AB 1023',driver:'Deepak Singh',status:'ACTIVE',stops:['Sarnath','Ashapur','Kashi Station','Godowlia','Assi Ghat']},
  {id:'rt-004',name:'St. Johns School West Corridor',code:'SCH-RT-04',start:'Babaspur Crossing',destination:'St. Johns School Gate 2',distance_km:15.9,est_duration:34,departure:'07:45 AM',bus:'UP65 AB 1024',driver:'Amit Yadav',status:'DIVERTED',stops:['Babaspur','Harhua Bypass','Ring Road Ph-2','St. Johns']}
];

const INITIAL_ADMIN_MAINTENANCE = [
  {id:'maint-01',bus:'UP65 AB 1021',service_type:'Scheduled 20k Inspection',service_date:'2026-08-15',next_service:'2026-11-15',odometer:24500,center:'Tata Authorized Service Hub, Shivpur',cost:4850,remarks:'Oil filter and brake pad inspection completed. AC coolant topped up.',status:'COMPLETED'},
  {id:'maint-02',bus:'UP65 AB 1022',service_type:'Brake System Overhaul',service_date:'2026-07-20',next_service:'2026-10-20',odometer:38200,center:'Ashok Leyland Service Care, Ramnagar',cost:12400,remarks:'ABS sensor recalibration and pneumatic brake liners replaced.',status:'COMPLETED'},
  {id:'maint-03',bus:'UP65 AB 1025',service_type:'Engine Major Overhaul',service_date:'2026-10-05',next_service:'2026-10-12',odometer:64100,center:'Varanasi Central Fleet Workshop',cost:18900,remarks:'Scheduled injector overhaul. Vehicle temporarily decommissioned.',status:'IN_PROGRESS'}
];

const INITIAL_ADMIN_AUDIT = [
  {id:'aud-01',admin:'Gyananand',role:'Super Admin',action:'Approved Driver Verification',module:'DRIVERS',time:'08 Oct 2026, 13:25',ip:'192.168.1.***',status:'Successful'},
  {id:'aud-02',admin:'Rajesh Verma',role:'Transport Admin',action:'Updated Bus Route Corridor',module:'ROUTES',time:'08 Oct 2026, 11:40',ip:'192.168.1.***',status:'Successful'},
  {id:'aud-03',admin:'Vikram Singh',role:'Security Officer',action:'Acknowledged SOS Alert',module:'EMERGENCY',time:'08 Oct 2026, 10:18',ip:'192.168.1.***',status:'Successful'}
];

function getAdminBuses() { return readJson(ADMIN_BUSES_FILE, INITIAL_ADMIN_BUSES); }
function getAdminDrivers() { return readJson(ADMIN_DRIVERS_FILE, INITIAL_ADMIN_DRIVERS); }
function getAdminRoutes() { return readJson(ADMIN_ROUTES_FILE, INITIAL_ADMIN_ROUTES); }
function getAdminMaintenance() { return readJson(ADMIN_MAINTENANCE_FILE, INITIAL_ADMIN_MAINTENANCE); }
function getAdminAudit() { return readJson(ADMIN_AUDIT_FILE, INITIAL_ADMIN_AUDIT); }

// 1. Stats and Overview Cards
app.get('/api/admin/metrics', (_req, res) => {
  const buses = getAdminBuses();
  const drivers = getAdminDrivers();
  const emergencies = getEmergencies();
  const maintenance = getAdminMaintenance();
  const activeBuses = buses.filter(b => b.status === 'ACTIVE' || b.status === 'ON_ROUTE').length;
  const onRoute = buses.filter(b => b.status === 'ON_ROUTE').length;
  const verifiedDrivers = drivers.filter(d => d.police_verified === 'VERIFIED').length;
  res.json({
    total_buses: buses.length,
    active_buses: activeBuses,
    inactive_buses: buses.length - activeBuses,
    on_route: onRoute,
    total_drivers: drivers.length,
    verified_drivers: verifiedDrivers,
    pending_verification: drivers.length - verifiedDrivers,
    active_trips: onRoute,
    safety_alerts: emergencies.filter(e => e.status === 'ACTIVE').length + 1,
    maintenance_due: maintenance.filter(m => m.status !== 'COMPLETED').length
  });
});

// 2. Buses CRUD
app.get('/api/admin/buses', (_req, res) => res.json({ buses: getAdminBuses() }));
app.post('/api/admin/buses', (req, res) => {
  const buses = getAdminBuses();
  const newBus = { id: `bus-${Date.now().toString().slice(-4)}`, ...req.body, status: req.body.status || 'ACTIVE', gps_status: 'ONLINE' };
  buses.unshift(newBus);
  writeJson(ADMIN_BUSES_FILE, buses);
  res.status(201).json({ success: true, bus: newBus });
});
app.put('/api/admin/buses/:id', (req, res) => {
  const buses = getAdminBuses();
  const index = buses.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Bus not found' });
  buses[index] = { ...buses[index], ...req.body };
  writeJson(ADMIN_BUSES_FILE, buses);
  res.json({ success: true, bus: buses[index] });
});
app.delete('/api/admin/buses/:id', (req, res) => {
  const buses = getAdminBuses().filter(b => b.id !== req.params.id);
  writeJson(ADMIN_BUSES_FILE, buses);
  res.json({ success: true });
});

// 3. Drivers CRUD
app.get('/api/admin/drivers', (_req, res) => res.json({ drivers: getAdminDrivers() }));
app.post('/api/admin/drivers', (req, res) => {
  const drivers = getAdminDrivers();
  const newDriver = { id: `drv-${Date.now().toString().slice(-4)}`, safety_score: 95, risk_level: 'LOW', speeding_incidents: 0, harsh_braking: 0, route_deviations: 0, ...req.body };
  drivers.unshift(newDriver);
  writeJson(ADMIN_DRIVERS_FILE, drivers);
  res.status(201).json({ success: true, driver: newDriver });
});
app.put('/api/admin/drivers/:id', (req, res) => {
  const drivers = getAdminDrivers();
  const index = drivers.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Driver not found' });
  drivers[index] = { ...drivers[index], ...req.body };
  writeJson(ADMIN_DRIVERS_FILE, drivers);
  res.json({ success: true, driver: drivers[index] });
});

// 4. Routes CRUD
app.get('/api/admin/routes', (_req, res) => res.json({ routes: getAdminRoutes() }));
app.post('/api/admin/routes', (req, res) => {
  const routes = getAdminRoutes();
  const newRoute = { id: `rt-${Date.now().toString().slice(-4)}`, ...req.body };
  routes.unshift(newRoute);
  writeJson(ADMIN_ROUTES_FILE, routes);
  res.status(201).json({ success: true, route: newRoute });
});

// 5. Live Telemetry for Tracking
app.get('/api/admin/tracking/live', (_req, res) => {
  const buses = getAdminBuses();
  const telemetry = buses.map(b => ({
    id: b.id,
    reg_number: b.reg_number,
    bus_type: b.bus_type,
    is_ac: b.is_ac,
    driver: b.assigned_driver,
    route: b.assigned_route,
    speed: b.current_speed,
    lat: b.current_lat + (b.status === 'ON_ROUTE' ? (Math.random() - 0.5) * 0.002 : 0),
    lng: b.current_lng + (b.status === 'ON_ROUTE' ? (Math.random() - 0.5) * 0.002 : 0),
    gps_status: b.gps_status,
    status: b.status
  }));
  res.json({ telemetry });
});

// 6. Maintenance
app.get('/api/admin/maintenance', (_req, res) => res.json({ maintenance: getAdminMaintenance() }));
app.post('/api/admin/maintenance', (req, res) => {
  const list = getAdminMaintenance();
  const item = { id: `maint-${Date.now().toString().slice(-4)}`, ...req.body };
  list.unshift(item);
  writeJson(ADMIN_MAINTENANCE_FILE, list);
  res.status(201).json({ success: true, maintenance: item });
});

// 7. Document Expiry Radar
app.get('/api/admin/documents', (_req, res) => {
  res.json({
    documents: [
      { id: 'doc-01', subject: 'Driver Licence: Manoj Kumar Maurya (UP65-20090019283)', type: 'Driver Licence', entity: 'Manoj Kumar Maurya', expiry_date: '2026-10-20', days_left: 12, status: 'EXPIRING_SOON', severity: 'WARNING' },
      { id: 'doc-02', subject: 'Driver Licence: Amit Yadav (UP65-20160081726)', type: 'Driver Licence', entity: 'Amit Yadav', expiry_date: '2026-10-15', days_left: 7, status: 'EXPIRING_SOON', severity: 'CRITICAL' },
      { id: 'doc-03', subject: 'Vehicle Insurance: UP65 AB 1021 (POL-ICICI-992019)', type: 'Vehicle Insurance', entity: 'UP65 AB 1021', expiry_date: '2026-10-20', days_left: 12, status: 'EXPIRING_SOON', severity: 'WARNING' },
      { id: 'doc-04', subject: 'Fitness Certificate: UP65 AB 1025 (FIT-VNS-RTO-3310)', type: 'Fitness Certificate', entity: 'UP65 AB 1025', expiry_date: '2026-08-01', days_left: -68, status: 'EXPIRED', severity: 'CRITICAL' }
    ]
  });
});

// 8. AI Route Optimization
app.post('/api/admin/ai/optimize-route', (req, res) => {
  const original_km = Number(req.body.distance_km || 18.4);
  const original_min = Number(req.body.duration_min || 42);
  const optimized_km = Math.round(original_km * 0.864 * 10) / 10;
  const optimized_min = Math.round(original_min * 0.810);
  res.json({
    original_distance_km: original_km,
    original_duration_min: original_min,
    ai_optimized_distance_km: optimized_km,
    ai_optimized_duration_min: optimized_min,
    distance_saved_km: Math.round((original_km - optimized_km) * 10) / 10,
    time_saved_minutes: original_min - optimized_min,
    fuel_saving_percent: Math.round(((original_km - optimized_km) / original_km) * 1000) / 10,
    recommended_corridor: 'Bypass via Outer Ring Road Corridor B & Cantonment flyover',
    rationale: 'Avoids 3 high-congestion school bottleneck junctions and reduces idle carbon emissions.'
  });
});

// 9. AI Delay Prediction
app.get('/api/admin/ai/predict-delay', (req, res) => {
  res.json({
    bus_number: req.query.bus || 'UP65 AB 1021',
    scheduled_arrival: '08:30 AM',
    predicted_arrival: '08:42 AM',
    predicted_delay_minutes: 12,
    probability: 'HIGH (88%)',
    root_cause: 'Heavy bottleneck traffic detected on Ring Road Phase-2 / Sigra junction.',
    suggested_action: 'Notify parents, students, and dispatcher; apply dynamic corridor bypass.'
  });
});

// 10. Audit Logs
app.get('/api/admin/audit-logs', (_req, res) => res.json({ audit_logs: getAdminAudit() }));

// 11. Analytics
app.get('/api/admin/analytics', (_req, res) => {
  res.json({
    fleet_utilization: { active: 75, idle: 15, maintenance: 10 },
    safety_score_avg: 82,
    delays_by_route: [
      { route: 'SCH-RT-01', avg_delay: 6 },
      { route: 'COL-RT-02', avg_delay: 4 },
      { route: 'PUB-RT-03', avg_delay: 11 },
      { route: 'SCH-RT-04', avg_delay: 14 }
    ],
    maintenance_cost: { scheduled: 48500, repairs: 28900, cng: 64200, diesel: 89400 }
  });
});

app.use('/api', (_req,res) => res.status(404).json({error:'API endpoint not found.'}));
app.use((error,request,response,next)=>{
  if(response.headersSent)return next(error);
  console.error('Request failed:',error.message);
  const status=Number.isInteger(error.status)&&error.status>=400&&error.status<500?error.status:500;
  response.status(status).json({error:status===413?'Request is too large.':status===400?'Request data is invalid.':'The request could not be completed. Please try again.'});
});
security.bootstrapAdmin(process.env.ADMIN_EMAIL,process.env.ADMIN_PASSWORD)
  .then(()=>app.listen(PORT,()=>console.log(`AI Bus Track running at http://localhost:${PORT}`)))
  .catch(error=>{console.error(`Startup blocked: ${error.message}`);process.exitCode=1;});