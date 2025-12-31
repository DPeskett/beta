# Python Log Monitor

A modular, configurable, and production‑safe log monitoring tool written in Python.  
Designed to watch log files in real time, detect patterns, and trigger alerts through multiple channels.

This project demonstrates clean architecture, defensive programming, modular design, and practical tooling — ideal for system monitoring, DevOps workflows, or backend diagnostics.

---

## 🚀 Features

- **Real‑time log monitoring** (tail‑like behavior)
- **Config‑driven** (no code changes needed for patterns or alert types)
- **Modular architecture** (`monitor.py`, `patterns.py`, `alerts.py`)
- **Multiple alert methods**
  - Console
  - File logging
  - Email (stub)
  - Webhook (Discord/Slack-ready)
- **Regex‑based pattern detection**
- **Handles log rotation** gracefully
- **Internal logging** for debugging and reliability
- **Extensible** for dashboards, threading, or multi‑file monitoring

---

## 📁 Project Structure
log-monitor/ 
│ 
├── monitor.py    # Main monitoring loop 
├── patterns.py   # Pattern loading + regex matching 
├── alerts.py     # Console, file, email, webhook alerts 
├── config.json   # User configuration 
├── logs/         # Internal logs + alert logs 
│   └── monitor.log 
└── README.md           

