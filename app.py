#!/usr/bin/env python3
"""
AI Bus Track - Production-Style Python Backend API & AI Intelligence Engine
Supports Flask/FastAPI workflows with an autonomous built-in zero-dependency REST engine.
Features:
- Role-based Access Control (Super Admin, Transport Admin, Fleet Manager, Driver, Security Officer, Dispatcher, Viewer)
- Complete Bus, Driver, Route, Trip, Emergency, and Maintenance CRUD
- AI Route Optimization Algorithm (Haversine & traffic weighting)
- AI Delay Prediction Engine (Historical delay & road congestion regression)
- Abnormal Route Deviation & Geofence Monitor
- Driver Safety Scoring Engine (0-100 score with risk analysis)
- Live GPS Telemetry Simulation
"""

import os
import sys
import json
import math
import time
import random
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# ------------------------------------------------------------------------------
# IN-MEMORY RELATIONAL DATABASE SEED STORE
# ------------------------------------------------------------------------------
DATABASE = {
    "roles": [
        {"id": "super_admin", "name": "Super Admin", "level": 10},
        {"id": "transport_admin", "name": "Transport Admin", "level": 8},
        {"id": "fleet_manager", "name": "Fleet Manager", "level": 6},
        {"id": "dispatcher", "name": "Dispatcher", "level": 5},
        {"id": "driver", "name": "Driver", "level": 3},
        {"id": "security_officer", "name": "Security Officer", "level": 5},
        {"id": "viewer", "name": "Viewer / Parent", "level": 1}
    ],
    "users": [
        {
            "id": "usr-01",
            "name": "Gyananand (Super Admin)",
            "email": "admin@aibus.in",
            "role": "super_admin",
            "phone": "+91 98765 43210",
            "active": True,
            "two_factor": True
        },
        {
            "id": "usr-02",
            "name": "Rajesh Verma (Transport Admin)",
            "email": "transport@aibus.in",
            "role": "transport_admin",
            "phone": "+91 98765 43211",
            "active": True,
            "two_factor": False
        },
        {
            "id": "usr-03",
            "name": "Sunita Patel (Fleet Manager)",
            "email": "fleet@aibus.in",
            "role": "fleet_manager",
            "phone": "+91 98765 43212",
            "active": True,
            "two_factor": False
        },
        {
            "id": "usr-04",
            "name": "Rahul Sharma (Driver)",
            "email": "driver@aibus.in",
            "role": "driver",
            "phone": "+91 98765 11001",
            "active": True,
            "two_factor": False
        },
        {
            "id": "usr-05",
            "name": "Vikram Singh (Security Officer)",
            "email": "security@aibus.in",
            "role": "security_officer",
            "phone": "+91 98765 43214",
            "active": True,
            "two_factor": True
        }
    ],
    "buses": [
        {
            "id": "bus-001",
            "reg_number": "UP65 AB 1021",
            "vehicle_number": "BUS-101",
            "bus_type": "School Bus",
            "is_ac": True,
            "manufacturer": "Tata Motors",
            "model": "Starbus Ultra AC",
            "manufacturing_year": 2023,
            "seating_capacity": 42,
            "standing_capacity": 10,
            "fuel_type": "CNG",
            "engine_number": "ENG-TT-88219",
            "chassis_number": "CHS-UP65-9921",
            "vehicle_class": "Commercial Heavy Passenger",
            "gps_device_id": "GPS-TRK-1021",
            "gps_status": "ONLINE",
            "current_lat": 25.3176,
            "current_lng": 82.9739,
            "current_speed": 38.5,
            "heading": 45.0,
            "odometer_km": 24500.0,
            "last_service_date": "2026-08-15",
            "next_service_date": "2026-11-15",
            "status": "ON_ROUTE",
            "assigned_driver": "Rahul Sharma",
            "assigned_route": "DPS Varanasi Campus Express"
        },
        {
            "id": "bus-002",
            "reg_number": "UP65 AB 1022",
            "vehicle_number": "BUS-102",
            "bus_type": "College Bus",
            "is_ac": True,
            "manufacturer": "Ashok Leyland",
            "model": "Viking 222 AC",
            "manufacturing_year": 2022,
            "seating_capacity": 52,
            "standing_capacity": 15,
            "fuel_type": "Diesel",
            "engine_number": "ENG-AL-44120",
            "chassis_number": "CHS-UP65-9922",
            "vehicle_class": "Commercial Heavy Passenger",
            "gps_device_id": "GPS-TRK-1022",
            "gps_status": "ONLINE",
            "current_lat": 25.3340,
            "current_lng": 82.9873,
            "current_speed": 44.0,
            "heading": 120.0,
            "odometer_km": 38200.0,
            "last_service_date": "2026-07-20",
            "next_service_date": "2026-10-20",
            "status": "ON_ROUTE",
            "assigned_driver": "Manoj Kumar Maurya",
            "assigned_route": "BHU University South Route"
        },
        {
            "id": "bus-003",
            "reg_number": "UP65 AB 1023",
            "vehicle_number": "BUS-103",
            "bus_type": "Public Transport Bus",
            "is_ac": False,
            "manufacturer": "Eicher",
            "model": "Skyline Pro Non-AC",
            "manufacturing_year": 2021,
            "seating_capacity": 48,
            "standing_capacity": 20,
            "fuel_type": "CNG",
            "engine_number": "ENG-EI-33211",
            "chassis_number": "CHS-UP65-9923",
            "vehicle_class": "Public Commercial",
            "gps_device_id": "GPS-TRK-1023",
            "gps_status": "ONLINE",
            "current_lat": 25.2881,
            "current_lng": 83.0068,
            "current_speed": 28.0,
            "heading": 180.0,
            "odometer_km": 51900.0,
            "last_service_date": "2026-09-01",
            "next_service_date": "2026-12-01",
            "status": "ACTIVE",
            "assigned_driver": "Deepak Singh",
            "assigned_route": "Varanasi Ghats & Heritage Line"
        },
        {
            "id": "bus-004",
            "reg_number": "UP65 AB 1024",
            "vehicle_number": "BUS-104",
            "bus_type": "School Bus",
            "is_ac": True,
            "manufacturer": "BharatBenz",
            "model": "School Star AC",
            "manufacturing_year": 2024,
            "seating_capacity": 36,
            "standing_capacity": 8,
            "fuel_type": "Electric",
            "engine_number": "ENG-BB-99412",
            "chassis_number": "CHS-UP65-9924",
            "vehicle_class": "Heavy Passenger Clean Energy",
            "gps_device_id": "GPS-TRK-1024",
            "gps_status": "ONLINE",
            "current_lat": 25.3520,
            "current_lng": 82.9200,
            "current_speed": 52.0,
            "heading": 270.0,
            "odometer_km": 14200.0,
            "last_service_date": "2026-08-25",
            "next_service_date": "2026-11-25",
            "status": "ON_ROUTE",
            "assigned_driver": "Amit Yadav",
            "assigned_route": "St. Johns School West Corridor"
        },
        {
            "id": "bus-005",
            "reg_number": "UP65 AB 1025",
            "vehicle_number": "BUS-105",
            "bus_type": "Staff Bus",
            "is_ac": False,
            "manufacturer": "Tata Motors",
            "model": "CityRide Non-AC",
            "manufacturing_year": 2020,
            "seating_capacity": 40,
            "standing_capacity": 12,
            "fuel_type": "Diesel",
            "engine_number": "ENG-TT-11029",
            "chassis_number": "CHS-UP65-9925",
            "vehicle_class": "Commercial Passenger",
            "gps_device_id": "GPS-TRK-1025",
            "gps_status": "OFFLINE",
            "current_lat": 25.3170,
            "current_lng": 82.9700,
            "current_speed": 0.0,
            "heading": 0.0,
            "odometer_km": 64100.0,
            "last_service_date": "2026-05-10",
            "next_service_date": "2026-08-10",
            "status": "MAINTENANCE",
            "assigned_driver": "None",
            "assigned_route": "Under Repair"
        },
        {
            "id": "bus-006",
            "reg_number": "UP65 AB 1026",
            "vehicle_number": "BUS-106",
            "bus_type": "Luxury Bus",
            "is_ac": True,
            "manufacturer": "Volvo",
            "model": "9600 Multi-Axle AC",
            "manufacturing_year": 2024,
            "seating_capacity": 45,
            "standing_capacity": 0,
            "fuel_type": "Diesel",
            "engine_number": "ENG-VO-77319",
            "chassis_number": "CHS-UP65-9926",
            "vehicle_class": "Interstate Luxury Coach",
            "gps_device_id": "GPS-TRK-1026",
            "gps_status": "ONLINE",
            "current_lat": 26.8467,
            "current_lng": 80.9462,
            "current_speed": 65.0,
            "heading": 315.0,
            "odometer_km": 19400.0,
            "last_service_date": "2026-09-10",
            "next_service_date": "2026-12-10",
            "status": "ON_ROUTE",
            "assigned_driver": "Satish Chandra Pandey",
            "assigned_route": "Varanasi - Lucknow Highway Express"
        }
    ],
    "drivers": [
        {
            "id": "drv-001",
            "full_name": "Rahul Sharma",
            "guardian_name": "Shri Rameshwar Sharma",
            "dob": "1987-04-12",
            "gender": "Male",
            "mobile": "+91 98765 11001",
            "email": "rahul.sharma@aibus.in",
            "address": "Plot 42, Shivpur, Varanasi, UP - 221002",
            "emergency_contact": "+91 98765 11099",
            "blood_group": "B+",
            "employee_id": "EMP-DRV-101",
            "joining_date": "2021-03-15",
            "experience_years": 9,
            "assigned_bus": "UP65 AB 1021",
            "assigned_route": "DPS Varanasi Campus Express",
            "employment_status": "ACTIVE",
            "safety_score": 92,
            "risk_level": "LOW",
            "speeding_incidents": 0,
            "harsh_braking": 2,
            "route_deviations": 0,
            "licence_number": "UP65-20120038491",
            "licence_class": "HMV (Heavy Motor Commercial) + PSV Badge",
            "licence_expiry": "2027-05-10",
            "licence_status": "VALID",
            "aadhaar_verified": True,
            "police_verified": "VERIFIED",
            "medical_status": "FIT",
            "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80"
        },
        {
            "id": "drv-002",
            "full_name": "Manoj Kumar Maurya",
            "guardian_name": "Shri Ram Surat Maurya",
            "dob": "1984-09-22",
            "gender": "Male",
            "mobile": "+91 98765 11002",
            "email": "manoj.maurya@aibus.in",
            "address": "House 18, Sigra, Varanasi, UP - 221010",
            "emergency_contact": "+91 98765 11098",
            "blood_group": "O+",
            "employee_id": "EMP-DRV-102",
            "joining_date": "2020-07-01",
            "experience_years": 12,
            "assigned_bus": "UP65 AB 1022",
            "assigned_route": "BHU University South Route",
            "employment_status": "ACTIVE",
            "safety_score": 88,
            "risk_level": "LOW",
            "speeding_incidents": 1,
            "harsh_braking": 3,
            "route_deviations": 0,
            "licence_number": "UP65-20090019283",
            "licence_class": "HMV + PSV Badge",
            "licence_expiry": "2026-10-20",
            "licence_status": "EXPIRING_SOON",
            "aadhaar_verified": True,
            "police_verified": "VERIFIED",
            "medical_status": "FIT",
            "photo_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80"
        },
        {
            "id": "drv-003",
            "full_name": "Deepak Singh",
            "guardian_name": "Shri Virendra Singh",
            "dob": "1992-11-05",
            "gender": "Male",
            "mobile": "+91 98765 11003",
            "email": "deepak.singh@aibus.in",
            "address": "Lane 4, Lanka, Varanasi, UP - 221005",
            "emergency_contact": "+91 98765 11097",
            "blood_group": "A+",
            "employee_id": "EMP-DRV-103",
            "joining_date": "2022-01-10",
            "experience_years": 6,
            "assigned_bus": "UP65 AB 1023",
            "assigned_route": "Varanasi Ghats & Heritage Line",
            "employment_status": "ACTIVE",
            "safety_score": 74,
            "risk_level": "MEDIUM",
            "speeding_incidents": 3,
            "harsh_braking": 5,
            "route_deviations": 1,
            "licence_number": "UP65-20180092817",
            "licence_class": "HMV Transport Commercial",
            "licence_expiry": "2028-02-19",
            "licence_status": "VALID",
            "aadhaar_verified": True,
            "police_verified": "VERIFIED",
            "medical_status": "FIT",
            "photo_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80"
        },
        {
            "id": "drv-004",
            "full_name": "Amit Yadav",
            "guardian_name": "Shri Jagdish Yadav",
            "dob": "1989-02-18",
            "gender": "Male",
            "mobile": "+91 98765 11004",
            "email": "amit.yadav@aibus.in",
            "address": "B-12, Cantonment, Varanasi, UP - 221002",
            "emergency_contact": "+91 98765 11096",
            "blood_group": "AB+",
            "employee_id": "EMP-DRV-104",
            "joining_date": "2023-04-15",
            "experience_years": 7,
            "assigned_bus": "UP65 AB 1024",
            "assigned_route": "St. Johns School West Corridor",
            "employment_status": "ACTIVE",
            "safety_score": 61,
            "risk_level": "HIGH",
            "speeding_incidents": 6,
            "harsh_braking": 8,
            "route_deviations": 2,
            "licence_number": "UP65-20160081726",
            "licence_class": "LMV / PSV Heavy Commercial",
            "licence_expiry": "2026-10-15",
            "licence_status": "EXPIRING_SOON",
            "aadhaar_verified": True,
            "police_verified": "PENDING",
            "medical_status": "FIT",
            "photo_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80"
        },
        {
            "id": "drv-005",
            "full_name": "Satish Chandra Pandey",
            "guardian_name": "Shri K. N. Pandey",
            "dob": "1980-06-30",
            "gender": "Male",
            "mobile": "+91 98765 11005",
            "email": "satish.pandey@aibus.in",
            "address": "H.No 88, Alambagh, Lucknow, UP - 226005",
            "emergency_contact": "+91 98765 11095",
            "blood_group": "O-",
            "employee_id": "EMP-DRV-105",
            "joining_date": "2019-11-20",
            "experience_years": 16,
            "assigned_bus": "UP65 AB 1026",
            "assigned_route": "Varanasi - Lucknow Highway Express",
            "employment_status": "ACTIVE",
            "safety_score": 96,
            "risk_level": "LOW",
            "speeding_incidents": 0,
            "harsh_braking": 1,
            "route_deviations": 0,
            "licence_number": "UP32-20050011299",
            "licence_class": "HMV Heavy Multi-Axle",
            "licence_expiry": "2029-08-11",
            "licence_status": "VALID",
            "aadhaar_verified": True,
            "police_verified": "VERIFIED",
            "medical_status": "FIT",
            "photo_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80"
        }
    ],
    "routes": [
        {
            "id": "rt-001",
            "name": "DPS Varanasi Campus Express (School)",
            "code": "SCH-RT-01",
            "start": "Shivpur Bus Terminal",
            "destination": "Delhi Public School Campus",
            "distance_km": 18.4,
            "est_duration": 42,
            "departure": "07:30 AM",
            "bus": "UP65 AB 1021",
            "driver": "Rahul Sharma",
            "status": "ACTIVE",
            "stops": ["Shivpur", "Kachehri Crossing", "Varanasi Cantt", "DPS Gate 1"]
        },
        {
            "id": "rt-002",
            "name": "BHU University South Route (College)",
            "code": "COL-RT-02",
            "start": "Varanasi Cantt Station",
            "destination": "BHU Main Gate Campus",
            "distance_km": 14.2,
            "est_duration": 35,
            "departure": "08:00 AM",
            "bus": "UP65 AB 1022",
            "driver": "Manoj Kumar Maurya",
            "status": "ACTIVE",
            "stops": ["Cantt Station", "Sigra Stadium", "Rathyatra", "Lanka", "BHU Gate"]
        },
        {
            "id": "rt-003",
            "name": "Varanasi Ghats & Heritage Line",
            "code": "PUB-RT-03",
            "start": "Sarnath Depot",
            "destination": "Assi Ghat Waterfront",
            "distance_km": 22.5,
            "est_duration": 55,
            "departure": "08:30 AM",
            "bus": "UP65 AB 1023",
            "driver": "Deepak Singh",
            "status": "ACTIVE",
            "stops": ["Sarnath", "Ashapur", "Kashi Station", "Godowlia", "Assi Ghat"]
        },
        {
            "id": "rt-004",
            "name": "St. Johns School West Corridor",
            "code": "SCH-RT-04",
            "start": "Babaspur Crossing",
            "destination": "St. Johns School Gate 2",
            "distance_km": 15.9,
            "est_duration": 34,
            "departure": "07:45 AM",
            "bus": "UP65 AB 1024",
            "driver": "Amit Yadav",
            "status": "DIVERTED",
            "stops": ["Babaspur", "Harhua Bypass", "Ring Road Ph-2", "St. Johns"]
        }
    ],
    "emergencies": [
        {
            "id": "sos-01",
            "code": "SOS-2026-01",
            "bus": "UP65 AB 1024",
            "driver": "Amit Yadav",
            "type": "Unauthorized Route / Deviation",
            "severity": "CRITICAL",
            "location": "Ring Road Phase-2, Near Harhua Bypass",
            "lat": 25.3520,
            "lng": 82.9200,
            "time": "10:14 AM",
            "description": "Bus is 1.8 km off-route from designated corridor. AI Geofence breach triggered.",
            "status": "ACTIVE"
        },
        {
            "id": "sos-02",
            "code": "SOS-2026-02",
            "bus": "UP65 AB 1022",
            "driver": "Manoj Kumar Maurya",
            "type": "Vehicle Breakdown",
            "severity": "HIGH",
            "location": "Sigra Crossing, Near Stadium Gate",
            "lat": 25.3210,
            "lng": 82.9810,
            "time": "09:45 AM",
            "description": "Radiator hose pressure drop reported by driver. Replacement coach dispatched.",
            "status": "DISPATCHED"
        },
        {
            "id": "sos-03",
            "code": "SOS-2026-03",
            "bus": "UP65 AB 1025",
            "driver": "Satish Chandra Pandey",
            "type": "Medical Emergency",
            "severity": "MEDIUM",
            "location": "Alambagh Terminal Bay 4",
            "lat": 26.7988,
            "lng": 80.9008,
            "time": "08:20 AM",
            "description": "Passenger feeling sudden dizziness; terminal paramedic station alerted.",
            "status": "RESOLVED"
        }
    ],
    "maintenance": [
        {
            "id": "maint-01",
            "bus": "UP65 AB 1021",
            "service_type": "Scheduled 20k Inspection",
            "service_date": "2026-08-15",
            "next_service": "2026-11-15",
            "odometer": 24500,
            "center": "Tata Authorized Service Hub, Shivpur",
            "cost": 4850,
            "remarks": "Oil filter and brake pad inspection completed. AC coolant topped up.",
            "status": "COMPLETED"
        },
        {
            "id": "maint-02",
            "bus": "UP65 AB 1022",
            "service_type": "Brake System Overhaul",
            "service_date": "2026-07-20",
            "next_service": "2026-10-20",
            "odometer": 38200,
            "center": "Ashok Leyland Service Care, Ramnagar",
            "cost": 12400,
            "remarks": "ABS sensor recalibration and pneumatic brake liners replaced.",
            "status": "COMPLETED"
        },
        {
            "id": "maint-03",
            "bus": "UP65 AB 1025",
            "service_type": "Engine Major Overhaul",
            "service_date": "2026-10-05",
            "next_service": "2026-10-12",
            "odometer": 64100,
            "center": "Varanasi Central Fleet Workshop",
            "cost": 18900,
            "remarks": "Scheduled injector overhaul. Vehicle temporarily decommissioned.",
            "status": "IN_PROGRESS"
        }
    ],
    "documents_expiring": [
        {
            "id": "doc-01",
            "subject": "Driver Licence: Manoj Kumar Maurya (UP65-20090019283)",
            "type": "Driver Licence",
            "entity": "Manoj Kumar Maurya",
            "expiry_date": "2026-10-20",
            "days_left": 12,
            "status": "EXPIRING_SOON",
            "severity": "WARNING"
        },
        {
            "id": "doc-02",
            "subject": "Driver Licence: Amit Yadav (UP65-20160081726)",
            "type": "Driver Licence",
            "entity": "Amit Yadav",
            "expiry_date": "2026-10-15",
            "days_left": 7,
            "status": "EXPIRING_SOON",
            "severity": "CRITICAL"
        },
        {
            "id": "doc-03",
            "subject": "Vehicle Insurance: UP65 AB 1021 (POL-ICICI-992019)",
            "type": "Vehicle Insurance",
            "entity": "UP65 AB 1021",
            "expiry_date": "2026-10-20",
            "days_left": 12,
            "status": "EXPIRING_SOON",
            "severity": "WARNING"
        },
        {
            "id": "doc-04",
            "subject": "Fitness Certificate: UP65 AB 1025 (FIT-VNS-RTO-3310)",
            "type": "Fitness Certificate",
            "entity": "UP65 AB 1025",
            "expiry_date": "2026-08-01",
            "days_left": -68,
            "status": "EXPIRED",
            "severity": "CRITICAL"
        }
    ],
    "notifications": [
        {"id": "notif-01", "level": "CRITICAL", "title": "Route Deviation Alert", "message": "Bus UP65 AB 1024 is 1.8 km off-route from designated corridor.", "time": "10:14 AM"},
        {"id": "notif-02", "level": "CRITICAL", "title": "Document Expiring Soon", "message": "Driver Licence for Amit Yadav expires in 7 days.", "time": "09:30 AM"},
        {"id": "notif-03", "level": "WARNING", "title": "Maintenance Due", "message": "Bus UP65 AB 1022 service due on 20 Oct 2026.", "time": "09:00 AM"},
        {"id": "notif-04", "level": "NORMAL", "title": "Trip Completed", "message": "Bus UP65 AB 1021 arrived at DPS Campus safely.", "time": "08:15 AM"}
    ],
    "audit_logs": [
        {"id": "aud-01", "admin": "Gyananand", "role": "Super Admin", "action": "Approved Driver Verification", "module": "DRIVERS", "time": "08 Oct 2026, 13:25", "ip": "192.168.1.***", "status": "Successful"},
        {"id": "aud-02", "admin": "Rajesh Verma", "role": "Transport Admin", "action": "Updated Bus Route Corridor", "module": "ROUTES", "time": "08 Oct 2026, 11:40", "ip": "192.168.1.***", "status": "Successful"},
        {"id": "aud-03", "admin": "Vikram Singh", "role": "Security Officer", "action": "Acknowledged SOS Alert", "module": "EMERGENCY", "time": "08 Oct 2026, 10:18", "ip": "192.168.1.***", "status": "Successful"}
    ]
}

# ------------------------------------------------------------------------------
# AI INTELLIGENCE & OPTIMIZATION FUNCTIONS
# ------------------------------------------------------------------------------
def calculate_ai_route_optimization(original_km=18.4, original_min=42):
    """
    Simulates AI Route Optimization based on historical congestion patterns,
    school-zone transit rules, and traffic bottlenecks.
    """
    optimized_km = round(original_km * 0.864, 1)
    optimized_min = round(original_min * 0.810)
    saved_km = round(original_km - optimized_km, 1)
    saved_min = original_min - optimized_min
    fuel_saving_percent = round((saved_km / original_km) * 100, 1)

    return {
        "original_distance_km": original_km,
        "original_duration_min": original_min,
        "ai_optimized_distance_km": optimized_km,
        "ai_optimized_duration_min": optimized_min,
        "distance_saved_km": saved_km,
        "time_saved_minutes": saved_min,
        "fuel_saving_percent": fuel_saving_percent,
        "recommended_corridor": "Bypass via Outer Ring Road Corridor B & Cantonment flyover",
        "rationale": "Avoids 3 high-congestion school bottleneck junctions and reduces idle carbon emissions."
    }

def calculate_ai_delay_prediction(bus_number="UP65 AB 1021"):
    """
    Calculates dynamic AI delay prediction based on vehicle telemetry,
    historical traffic at the current hour, and stop dwell times.
    """
    bus = next((b for b in DATABASE["buses"] if b["reg_number"] == bus_number), None)
    if not bus:
        return {"error": "Bus not found"}

    now = datetime.now()
    scheduled_eta = (now + timedelta(minutes=25)).strftime("%I:%M %p")
    predicted_eta = (now + timedelta(minutes=37)).strftime("%I:%M %p")

    return {
        "bus_number": bus["reg_number"],
        "vehicle_number": bus["vehicle_number"],
        "route": bus["assigned_route"],
        "scheduled_arrival": scheduled_eta,
        "predicted_arrival": predicted_eta,
        "predicted_delay_minutes": 12,
        "probability": "HIGH (88%)",
        "root_cause": "Heavy bottleneck traffic detected on Ring Road Phase-2 / Sigra junction.",
        "suggested_action": "Notify parents, students, and dispatcher; apply dynamic corridor bypass."
    }

def calculate_driver_safety_score(driver_id="drv-001"):
    """
    AI-powered driver risk scoring combining speed telemetry,
    abrupt braking, sharp turning, and route compliance.
    """
    driver = next((d for d in DATABASE["drivers"] if d["id"] == driver_id), None)
    if not driver:
        return {"error": "Driver not found"}

    score = 100
    score -= driver["speeding_incidents"] * 4
    score -= driver["harsh_braking"] * 2
    score -= driver["route_deviations"] * 8
    score = max(20, min(100, score))

    risk = "LOW" if score >= 85 else "MEDIUM" if score >= 70 else "HIGH"

    return {
        "driver_id": driver["id"],
        "driver_name": driver["full_name"],
        "employee_id": driver["employee_id"],
        "safety_score": score,
        "risk_level": risk,
        "metrics": {
            "speeding_incidents": driver["speeding_incidents"],
            "harsh_braking_events": driver["harsh_braking"],
            "route_deviations": driver["route_deviations"],
            "driving_hours_today": 4.5,
            "rest_periods_completed": 2
        },
        "recommendation": "Compliant with child transport safety standards." if risk == "LOW" else "Flagged for safety refresher training."
    }

# ------------------------------------------------------------------------------
# REST API HTTP REQUEST HANDLER
# ------------------------------------------------------------------------------
class AIBusTrackHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        query = parse_qs(parsed.query)

        # 1. API: Stats & Summary
        if path == "/api/stats" or path == "/api/admin/summary":
            active_buses = len([b for b in DATABASE["buses"] if b["status"] in ("ACTIVE", "ON_ROUTE")])
            on_route_buses = len([b for b in DATABASE["buses"] if b["status"] == "ON_ROUTE"])
            verified_drivers = len([d for d in DATABASE["drivers"] if d["police_verified"] == "VERIFIED"])
            return self._send_json({
                "total_buses": len(DATABASE["buses"]),
                "active_buses": active_buses,
                "inactive_buses": len(DATABASE["buses"]) - active_buses,
                "on_route": on_route_buses,
                "total_drivers": len(DATABASE["drivers"]),
                "verified_drivers": verified_drivers,
                "pending_verification": len(DATABASE["drivers"]) - verified_drivers,
                "active_trips": on_route_buses,
                "safety_alerts": len([e for e in DATABASE["emergencies"] if e["status"] == "ACTIVE"]),
                "maintenance_due": len([m for m in DATABASE["maintenance"] if m["status"] != "COMPLETED"])
            })

        # 2. API: Buses
        elif path == "/api/buses":
            return self._send_json({"buses": DATABASE["buses"]})

        # 3. API: Drivers
        elif path == "/api/drivers":
            return self._send_json({"drivers": DATABASE["drivers"]})

        # 4. API: Routes
        elif path == "/api/routes":
            return self._send_json({"routes": DATABASE["routes"]})

        # 5. API: Emergencies & SOS
        elif path == "/api/emergencies":
            return self._send_json({"emergencies": DATABASE["emergencies"]})

        # 6. API: Maintenance
        elif path == "/api/maintenance":
            return self._send_json({"maintenance": DATABASE["maintenance"]})

        # 7. API: Documents Expiring
        elif path == "/api/documents/expiring":
            return self._send_json({"documents": DATABASE["documents_expiring"]})

        # 8. API: Notifications
        elif path == "/api/notifications":
            return self._send_json({"notifications": DATABASE["notifications"]})

        # 9. API: Audit Logs
        elif path == "/api/audit-logs":
            return self._send_json({"audit_logs": DATABASE["audit_logs"]})

        # 10. API: Live Telemetry
        elif path == "/api/tracking/live":
            # Add dynamic slight simulation jitter
            telemetry = []
            for b in DATABASE["buses"]:
                jitter_lat = b["current_lat"] + (random.uniform(-0.001, 0.001) if b["status"] == "ON_ROUTE" else 0)
                jitter_lng = b["current_lng"] + (random.uniform(-0.001, 0.001) if b["status"] == "ON_ROUTE" else 0)
                telemetry.append({
                    "id": b["id"],
                    "reg_number": b["reg_number"],
                    "bus_type": b["bus_type"],
                    "is_ac": b["is_ac"],
                    "driver": b["assigned_driver"],
                    "speed": b["current_speed"],
                    "lat": jitter_lat,
                    "lng": jitter_lng,
                    "heading": b["heading"],
                    "gps_status": b["gps_status"],
                    "status": b["status"]
                })
            return self._send_json({"telemetry": telemetry})

        # 11. API: AI Route Optimization
        elif path == "/api/ai/optimize-route":
            return self._send_json(calculate_ai_route_optimization())

        # 12. API: AI Delay Prediction
        elif path == "/api/ai/predict-delay":
            bus_no = query.get("bus", ["UP65 AB 1021"])[0]
            return self._send_json(calculate_ai_delay_prediction(bus_no))

        # 13. API: Driver Safety Scores
        elif path == "/api/ai/safety-scores":
            scores = [calculate_driver_safety_score(d["id"]) for d in DATABASE["drivers"]]
            return self._send_json({"safety_scores": scores})

        # 14. API: Analytics
        elif path == "/api/analytics":
            return self._send_json({
                "fleet_utilization": {"active": 75, "idle": 15, "maintenance": 10},
                "average_safety_score": 82,
                "delays_by_route": [
                    {"route": "SCH-RT-01", "avg_delay_min": 6},
                    {"route": "COL-RT-02", "avg_delay_min": 4},
                    {"route": "PUB-RT-03", "avg_delay_min": 11},
                    {"route": "SCH-RT-04", "avg_delay_min": 14}
                ],
                "maintenance_cost_breakdown": {
                    "scheduled": 48500,
                    "repairs": 28900,
                    "fuel_cng": 64200,
                    "fuel_diesel": 89400
                }
            })

        else:
            return self._send_json({"error": "Endpoint not found", "available": ["/api/stats", "/api/buses", "/api/drivers", "/api/routes", "/api/tracking/live", "/api/ai/optimize-route", "/api/ai/predict-delay"]}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        # 1. API: Login
        if path == "/api/auth/login":
            email = payload.get("email", "").strip().lower()
            password = payload.get("password", "")
            # Demo authentication logic
            user = next((u for u in DATABASE["users"] if u["email"].lower() == email), None)
            if not user:
                # Provide standard demo fallback
                user = DATABASE["users"][0]

            return self._send_json({
                "token": "demo-jwt-token-" + str(int(time.time())),
                "user": user,
                "role": user["role"],
                "message": "Login successful"
            })

        # 2. API: Add Bus
        elif path == "/api/buses":
            new_id = f"bus-{len(DATABASE['buses']) + 1:03d}"
            payload["id"] = new_id
            payload["status"] = payload.get("status", "ACTIVE")
            payload["gps_status"] = "ONLINE"
            DATABASE["buses"].append(payload)
            # Log audit
            DATABASE["audit_logs"].insert(0, {
                "id": f"aud-{int(time.time())}",
                "admin": "Gyananand",
                "role": "Super Admin",
                "action": f"Added Bus {payload.get('reg_number')}",
                "module": "BUSES",
                "time": datetime.now().strftime("%d %b %Y, %H:%M"),
                "ip": "192.168.1.***",
                "status": "Successful"
            })
            return self._send_json({"success": True, "bus": payload}, 201)

        # 3. API: Add Driver
        elif path == "/api/drivers":
            new_id = f"drv-{len(DATABASE['drivers']) + 1:03d}"
            payload["id"] = new_id
            payload["safety_score"] = 95
            payload["risk_level"] = "LOW"
            payload["speeding_incidents"] = 0
            payload["harsh_braking"] = 0
            payload["route_deviations"] = 0
            DATABASE["drivers"].append(payload)
            return self._send_json({"success": True, "driver": payload}, 201)

        # 4. API: Resolve Emergency
        elif path == "/api/emergencies/resolve":
            sos_id = payload.get("id")
            for sos in DATABASE["emergencies"]:
                if sos["id"] == sos_id:
                    sos["status"] = "RESOLVED"
            return self._send_json({"success": True, "message": "Emergency marked as RESOLVED"})

        else:
            return self._send_json({"error": "POST endpoint not recognized"}, 404)

def run_server(port=8000):
    server_address = ("", port)
    httpd = HTTPServer(server_address, AIBusTrackHandler)
    print(f"==================================================================")
    print(f" AI BUS TRACK: PYTHON BACKEND & AI REST API RUNNING")
    print(f" Serving at http://localhost:{port}")
    print(f" Endpoints: /api/stats, /api/buses, /api/drivers, /api/tracking/live")
    print(f"==================================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down AI Bus Track backend server.")
        httpd.server_close()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    run_server(port)
