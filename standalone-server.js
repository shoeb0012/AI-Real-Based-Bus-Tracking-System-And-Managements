/**
 * AI BUS TRACK - ZERO-DEPENDENCY STANDALONE SERVER
 * Runs on standard Node.js without requiring external npm packages.
 * Serves complete Public Portal, Admin Console, 360 View, and REST APIs.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, createHmac } = require('node:crypto');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function readJsonFile(filename, fallback = []) {
  try {
    const p = path.join(ROOT, filename);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) {}
  return fallback;
}

function writeJsonFile(filename, data) {
  try {
    const p = path.join(ROOT, filename);
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  } catch (_) {}
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Static file route
  if (req.method === 'GET' && !pathname.startsWith('/api/')) {
    let filePath = pathname === '/' ? 'Tracker.html' : pathname.replace(/^\//, '');
    let fullPath = path.join(ROOT, filePath);
    if (!fs.existsSync(fullPath) && fs.existsSync(`${fullPath}.html`)) {
      fullPath = `${fullPath}.html`;
    }

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const ext = path.extname(fullPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(fullPath).pipe(res);
      return;
    }
  }

  // 2. REST API Endpoints
  if (pathname.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let jsonBody = {};
      try { if (body) jsonBody = JSON.parse(body); } catch (_) {}

      // GET /api/buses
      if (pathname === '/api/buses' && req.method === 'GET') {
        const from = parsedUrl.searchParams.get('from');
        const to = parsedUrl.searchParams.get('to');
        let buses = readJsonFile('buses.json', []);
        if (from && to) {
          buses = buses.filter(b => 
            b.source?.toLowerCase().includes(from.toLowerCase()) || 
            b.destination?.toLowerCase().includes(to.toLowerCase())
          );
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(buses));
        return;
      }

      // GET /api/places
      if (pathname === '/api/places' && req.method === 'GET') {
        const places = readJsonFile('places.json', []);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(places));
        return;
      }

      // POST /api/bookings
      if (pathname === '/api/bookings' && req.method === 'POST') {
        const bookings = readJsonFile('bookings.json', []);
        const pnr = `AI${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const luggageWeight = Math.max(0, Number(jsonBody.luggageWeight ?? 15));
        const freeLuggage = 15;
        const extraLuggage = Math.max(0, luggageWeight - freeLuggage);
        const extraLuggageCharge = extraLuggage * 30;
        const ticketFare = Number(jsonBody.fare || jsonBody.total || 599);
        let foodCharge = 0;
        let foodOrderId = null;
        let foodOrderSummary = null;

        if (Array.isArray(jsonBody.foodItems) && jsonBody.foodItems.length > 0) {
          const foodMenu = readJsonFile('food.json', []);
          const foodOrders = readJsonFile('food-orders.json', []);
          foodOrderId = `FOOD-2026-${String(foodOrders.length + 101).padStart(6, '0')}`;
          const items = [];
          jsonBody.foodItems.forEach(it => {
            const m = foodMenu.find(f => f.foodId === it.foodId);
            if (m) {
              const qty = Math.max(1, Number(it.quantity) || 1);
              if (m.stockQuantity >= qty) {
                m.stockQuantity -= qty;
                if (m.stockQuantity === 0) m.availability = false;
                const itTotal = m.price * qty;
                foodCharge += itTotal;
                items.push({ foodId: m.foodId, foodName: m.name, quantity: qty, unitPrice: m.price, totalPrice: itTotal });
              }
            }
          });
          if (items.length > 0) {
            writeJsonFile('food.json', foodMenu);
            foodOrderSummary = {
              foodOrderId,
              bookingId: pnr,
              passengerId: 'usr-demo-01',
              passengerName: jsonBody.passenger?.name || 'Demo Passenger',
              passengerPhone: jsonBody.passenger?.phone || '9876543210',
              busId: jsonBody.busId || 'UP32AB1234',
              busNo: jsonBody.busNo || 'UP32 AB 1234',
              tripId: 'TRIP-DEL-LKO-01',
              seatNumber: Array.isArray(jsonBody.seats) ? jsonBody.seats.join(',') : 'A1',
              items,
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
            foodOrders.unshift(foodOrderSummary);
            writeJsonFile('food-orders.json', foodOrders);
          }
        }

        const total = ticketFare + extraLuggageCharge + foodCharge;
        const ticketToken = Buffer.from(JSON.stringify({ pnr, busNo: jsonBody.busNo || 'UP32 AB 1234', seats: jsonBody.seats, total })).toString('base64');
        const newBooking = {
          pnr,
          busId: jsonBody.busId || 'UP32AB1234',
          busNo: jsonBody.busNo || 'UP32 AB 1234',
          type: jsonBody.type || 'Volvo Multi-Axle AC',
          source: jsonBody.source || 'Delhi',
          destination: jsonBody.destination || 'Lucknow',
          seats: jsonBody.seats || ['A1'],
          passenger: jsonBody.passenger || { name: 'Demo Passenger', phone: '9876543210' },
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
          date: jsonBody.journey?.date || jsonBody.date || new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString()
        };
        bookings.unshift(newBooking);
        writeJsonFile('bookings.json', bookings);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newBooking));
        return;
      }

      // GET /api/bookings/:pnr
      if (pathname.startsWith('/api/bookings/') && req.method === 'GET') {
        const pnr = decodeURIComponent(pathname.replace('/api/bookings/', ''));
        const bookings = readJsonFile('bookings.json', []);
        const found = bookings.find(b => b.pnr?.toLowerCase() === pnr.toLowerCase());
        if (found) {
          let foodOrder = null;
          if (found.foodOrderId) {
            const foodOrders = readJsonFile('food-orders.json', []);
            foodOrder = foodOrders.find(f => f.foodOrderId === found.foodOrderId);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ...found, foodOrder }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Booking not found' }));
        }
        return;
      }

      // GET /api/ticket/verify/:token
      if (pathname.startsWith('/api/ticket/verify/') && req.method === 'GET') {
        try {
          const raw = Buffer.from(pathname.replace('/api/ticket/verify/', ''), 'base64').toString('utf8');
          const data = JSON.parse(raw);
          const bookings = readJsonFile('bookings.json', []);
          const found = bookings.find(b => b.pnr === data.pnr);
          if (found) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ valid: true, pnr: found.pnr, passenger: found.passenger?.name, busNo: found.busNo, seats: found.seats, total: found.total, bookingStatus: found.bookingStatus || 'CONFIRMED' }));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ valid: false, error: 'Ticket not found' }));
          }
        } catch (_) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ valid: false, error: 'Invalid QR token' }));
        }
        return;
      }

      // GET /api/food
      if (pathname === '/api/food' && req.method === 'GET') {
        const food = readJsonFile('food.json', []).filter(f => !f.deletedAt && f.active !== false);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ food, count: food.length }));
        return;
      }

      // POST /api/food
      if (pathname === '/api/food' && req.method === 'POST') {
        const food = readJsonFile('food.json', []);
        const newItem = {
          foodId: `food-${Date.now().toString(36)}`,
          name: String(jsonBody.name || '').trim(),
          description: String(jsonBody.description || '').trim(),
          category: String(jsonBody.category || 'Snacks').trim(),
          price: Math.max(1, Number(jsonBody.price) || 50),
          image: jsonBody.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
          veg: jsonBody.veg !== false,
          availability: (Number(jsonBody.stockQuantity) || 10) > 0,
          stockQuantity: Math.max(0, Number(jsonBody.stockQuantity) || 10),
          busId: jsonBody.busId || 'all',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null
        };
        food.unshift(newItem);
        writeJsonFile('food.json', food);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, item: newItem }));
        return;
      }

      // PATCH /api/food/:id
      if (pathname.startsWith('/api/food/') && req.method === 'PATCH') {
        const id = pathname.replace('/api/food/', '');
        const food = readJsonFile('food.json', []);
        const item = food.find(f => f.foodId === id && !f.deletedAt);
        if (item) {
          if (jsonBody.price !== undefined) item.price = Number(jsonBody.price);
          if (jsonBody.stockQuantity !== undefined) {
            item.stockQuantity = Number(jsonBody.stockQuantity);
            item.availability = item.stockQuantity > 0;
          }
          if (jsonBody.availability !== undefined) item.availability = Boolean(jsonBody.availability);
          if (jsonBody.active !== undefined) item.active = Boolean(jsonBody.active);
          item.updatedAt = new Date().toISOString();
          writeJsonFile('food.json', food);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, item }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Item not found' }));
        }
        return;
      }

      // GET /api/food-orders
      if (pathname === '/api/food-orders' && req.method === 'GET') {
        const orders = readJsonFile('food-orders.json', []).filter(o => !o.deletedAt);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ orders, total: orders.length }));
        return;
      }

      // PATCH /api/food-orders/:id/status
      if (pathname.includes('/api/food-orders/') && pathname.endsWith('/status') && req.method === 'PATCH') {
        const id = pathname.replace('/api/food-orders/', '').replace('/status', '');
        const orders = readJsonFile('food-orders.json', []);
        const order = orders.find(o => o.foodOrderId === id);
        if (order) {
          order.orderStatus = jsonBody.status || order.orderStatus;
          order.updatedAt = new Date().toISOString();
          writeJsonFile('food-orders.json', orders);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, order }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Order not found' }));
        }
        return;
      }

      // GET /api/stations
      if (pathname === '/api/stations' && req.method === 'GET') {
        const stations = readJsonFile('stations.json', []);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ stations }));
        return;
      }

      // GET /api/drivers
      if (pathname === '/api/drivers' && req.method === 'GET') {
        const drivers = readJsonFile('drivers.json', []);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ drivers }));
        return;
      }

      // GET /api/trips
      if (pathname === '/api/trips' && req.method === 'GET') {
        const trips = readJsonFile('trips.json', []);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ trips }));
        return;
      }

      // GET /api/audit-logs
      if (pathname === '/api/audit-logs' && req.method === 'GET') {
        const audit_logs = readJsonFile('audit-logs.json', []);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ audit_logs, total: audit_logs.length }));
        return;
      }

      // GET /api/settings
      if (pathname === '/api/settings' && req.method === 'GET') {
        const settings = readJsonFile('system-settings.json', { luggage: { ratePerExtraKg: 30 } });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ settings }));
        return;
      }

      // GET /api/analytics
      if (pathname === '/api/analytics' && req.method === 'GET') {
        const bookings = readJsonFile('bookings.json', []);
        const foodOrders = readJsonFile('food-orders.json', []);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          totalPassengers: 1250,
          passengersOrderingFood: 380,
          foodAdoptionRatePercent: 30.4,
          totalRevenue: 850400,
          ticketRevenue: 780000,
          luggageRevenue: 18400,
          foodRevenue: 52000,
          activeTrips: 12
        }));
        return;
      }

      // POST /api/auth/login
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        const email = jsonBody.email || 'admin@aibus.in';
        let role = 'super_admin';
        if (email.includes('transport')) role = 'transport_admin';
        else if (email.includes('fleet')) role = 'fleet_manager';
        else if (email.includes('driver')) role = 'driver';
        else if (email.includes('security')) role = 'security_officer';
        else if (email.includes('viewer')) role = 'viewer';

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          token: 'demo-standalone-token',
          user: {
            id: 'usr_demo_101',
            email,
            name: email.split('@')[0].toUpperCase(),
            role
          }
        }));
        return;
      }

      // GET /api/auth/me
      if (pathname === '/api/auth/me' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          authenticated: true,
          user: { id: 'usr_demo_101', email: 'admin@aibus.in', name: 'Super Admin', role: 'super_admin' }
        }));
        return;
      }

      // GET /api/admin/metrics
      if (pathname === '/api/admin/metrics' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          total_buses: 48,
          active_buses: 35,
          inactive_buses: 13,
          buses_on_route: 21,
          total_drivers: 52,
          verified_drivers: 48,
          pending_verification: 4,
          active_trips: 18,
          emergency_alerts: 3,
          maintenance_due: 5,
          total_bookings: 1420,
          luggage_free_allowance_kg: 15,
          extra_luggage_rate_kg: 30
        }));
        return;
      }

      // GET /api/admin/ai/optimize-route
      if (pathname === '/api/admin/ai/optimize-route' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          original_route: { distance_km: 18.4, duration_minutes: 42 },
          recommended_route: { distance_km: 15.9, duration_minutes: 34 },
          savings: { distance_km: 2.5, duration_minutes: 8, fuel_saved_litres: 1.2 }
        }));
        return;
      }

      // GET /api/admin/ai/predict-delay
      if (pathname === '/api/admin/ai/predict-delay' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          bus_number: parsedUrl.searchParams.get('bus') || 'UP32 AB 1234',
          scheduled_arrival: '08:30 PM',
          predicted_arrival: '08:35 PM',
          probability: 'MEDIUM (65%)',
          root_cause: 'Light toll gate backlog near Lucknow outer ring road.',
          suggested_action: 'Maintain speed governor limit; notify passengers via app.'
        }));
        return;
      }

      // Fallback API 404
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    });
    return;
  }

  // Not found
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` AI BUS TRACK - ENTERPRISE SMART TRANSPORTATION PLATFORM`);
  console.log(`================================================================`);
  console.log(` Server running at: http://localhost:${PORT}`);
  console.log(` Public Travel Portal: http://localhost:${PORT}/Tracker.html`);
  console.log(` Admin Control Panel: http://localhost:${PORT}/admin.html`);
  console.log(` Portal Login:        http://localhost:${PORT}/login.html`);
  console.log(` 15 KG Free Luggage Policy & 360° Bus Viewer Active`);
  console.log(`================================================================`);
});
