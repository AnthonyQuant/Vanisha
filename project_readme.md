# 🪶 Vanisha — Distraction-Free Disappearing Text Writing Challenge

**Vanisha** is a full-stack, distraction-free writing web application designed to defeat writer's block through high-momentum writing challenges, interactive story prompts, real-time velocity analytics, and customizable focus acoustics.

If you pause for too long, your text vanishes! The goal is to keep your hands moving, bypass self-editing, and achieve deep creative flow.

---

## ✨ Key Features

### ⏱️ Writing Modes & Finite State Machine
* **Classic Mode:** A continuous typing race. If you stop typing past your threshold (e.g., 5s, 10s, 15s, 20s), your current draft is wiped.
* **Sprint Mode:** Target fixed duration (5, 10, or 20 minutes) and word count goals with a real-time progress bar and victory audio cues.
* **Practice Mode:** Softened challenge mode offering visual warning vignettes and a customizable grace period before text vanishes.
* **Dynamic Timer Ring & Red Vignette:** SVG ring indicators and screen edge glow alert you when time is running low.

### 🎭 Built-in Story Prompt Generator
* Integrated prompt engine filtering by **Genre** (*Fantasy, Sci-Fi, Mystery, Thriller, Romance, Horror*) and **Story Length** (*Flash Fiction, Short Story, Novella*).
* Seamlessly transfers generated prompts straight into active writing sessions with a single click.

### 📊 Performance Insights & Telemetry
* **WPM Velocity Charts:** Interactive velocity line graphs powered by Chart.js.
* **Session Summary Modal:** Evaluates total words, character count, duration, peak WPM, pause count, and longest unbroken typing streak.
* **Lifetime History & Profile Dashboard:** Tracks completed vs. wiped sessions, lifetime words written, and overall completion rate.

### 🎧 Zen Audio & Visual Themes
* **Synthesized Audio:** Web Audio API sound effects for mechanical keystrokes, warning alerts, milestone unlocks, and victory chimes.
* **Ambient Soundscapes:** Built-in audio generators for *Gentle Rain*, *Ocean Waves*, and *Deep Focus Hum*.
* **Custom Themes:** Visual themes including *Midnight Purple*, *Cyberpunk Neon*, *Vintage Sepia*, and *Monokai Dark*.
* **Auto-Dimming Zen Mode:** Automatically fades UI navigation controls while active typing is detected.

### 🔒 Privacy & Offline PWA
* **100% Private:** Unsaved text contents are held entirely in browser RAM—never sent or saved to external servers.
* **Export Options:** Download completed sessions as plain text (`.TXT`) or Markdown (`.MD`).
* **Progressive Web App (PWA):** Service worker support for offline usage and standalone web desktop/mobile installation.

---

## 🛠️ Tech Stack

* **Backend:** Python 3.x, Flask, Flask-SQLAlchemy
* **Database:** SQLite (Development) / PostgreSQL-ready (Production)
* **Frontend:** HTML5, Modern CSS3 (CSS Custom Properties & Grid), JavaScript (ES6+ Vanilla FSM)
* **Libraries & Web APIs:** Chart.js, FontAwesome 6, Web Audio API, Service Worker API

---

## 📁 Directory Structure

```text
Vanisha/
├── app.py                  # Flask Application Core & REST API Endpoints
├── models.py               # SQLAlchemy Database Models (SessionLog, Prompt)
├── requirements.txt        # Python Dependencies
├── Procfile                # Gunicorn Deployment Configuration
├── gunicorn.conf.py        # Web Server Production Settings
├── templates/
│   └── index.html          # Single-Page Application (SPA) HTML Layout & Modals
└── static/
    ├── manifest.json       # PWA Application Web Manifest
    ├── sw.js               # Service Worker for Offline Caching
    ├── css/
    │   └── style.css       # Design System, CSS Variables, & Themes
    └── js/
        └── app.js          # Client State Machine, DOM Controllers, & Web Audio
```

---

## 🚀 Local Installation & Setup Guide

### 1. Prerequisites
Ensure you have **Python 3.9+** installed on your machine.

### 2. Setup Virtual Environment
Clone your repository and open a terminal in the project root directory:

```bash
# Create virtual environment
python -m venv venv

# Activate on Windows (Command Prompt / PowerShell)
venv\Scripts\activate

# Activate on macOS / Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application
```bash
python app.py
```

Open your browser and navigate to **`http://127.0.0.1:5001`**.

---

## 🔌 API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Serves the main Single-Page Application (`index.html`) |
| `GET` | `/api/prompts/generate` | Query params: `genre`, `story_length`. Returns a randomized writing prompt |
| `POST` | `/api/sessions/save` | Receives JSON telemetry payload to save completed or wiped session records |
| `GET` | `/api/sessions/history` | Fetches session logs, total words, and lifetime telemetry statistics |
| `GET` | `/api/analytics/detailed` | Returns breakdown data and WPM velocity history for Chart.js rendering |
| `GET` | `/api/sessions/export/summary` | Downloads a structured Markdown summary report of past sessions |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more details.