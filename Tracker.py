#!/usr/bin/env python3
"""
Tracker.py - AI Bus Track Python Entrypoint
Redirects to the complete production-style REST API and AI engine in app.py.
"""
import os
import sys
from app import run_server

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting AI Bus Track via Tracker.py on port {port}...")
    run_server(port)
