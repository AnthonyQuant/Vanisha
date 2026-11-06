import csv
import io
import json
import os
import random
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session, Response
from sqlalchemy import event
from sqlalchemy.engine import Engine
from models import db, User, WritingSession, Prompt, SessionMetric

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'vanisha-hardened-secret-key-2026')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///vanisha.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    cursor.execute("PRAGMA cache_size=-64000;")
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.close()


def seed_prompts_and_guest():
    if Prompt.query.count() == 0:
        default_prompts = [
            Prompt(category="Fiction", genre="Fantasy", story_length="Flash Fiction", prompt_text="An ancient key turns in a door that wasn't there yesterday morning."),
            Prompt(category="Fiction", genre="Fantasy", story_length="Short Story", prompt_text="In a city where magic is forbidden, a young apprentice discovers a glowing scroll hidden inside the cathedral archives."),
            Prompt(category="Fiction", genre="Sci-Fi", story_length="Flash Fiction", prompt_text="An AI predicts every emotion you will feel three minutes in advance."),
            Prompt(category="Fiction", genre="Sci-Fi", story_length="Short Story", prompt_text="A deep-space salvage vessel picks up a distress signal from a ship that disappeared eighty years ago."),
            Prompt(category="Fiction", genre="Mystery", story_length="Flash Fiction", prompt_text="A detective receives a sealed envelope containing photographs of a crime that hasn't happened yet."),
            Prompt(category="Fiction", genre="Thriller", story_length="Novella", prompt_text="During a global network blackout, a lone technician realizes the power grid didn't fail—it was intentionally isolated."),
            Prompt(category="Fiction", genre="Romance", story_length="Short Story", prompt_text="Two strangers exchange handwritten letters hidden between the pages of old library books."),
            Prompt(category="Fiction", genre="Horror", story_length="Flash Fiction", prompt_text="Your reflection in the bathroom mirror pauses for a second before following your movements."),
            Prompt(category="Daily", genre="Fantasy", story_length="Flash Fiction", prompt_text="Write 300 words describing a floating island without taking a pause longer than 4 seconds.", is_daily_challenge=True)
        ]
        db.session.add_all(default_prompts)

    if User.query.filter_by(username='guest').first() is None:
        guest_user = User(username='guest', email='guest@vanisha.local')
        guest_user.set_password('guest-pass-2026')
        db.session.add(guest_user)

    db.session.commit()


with app.app_context():
    db.create_all()
    seed_prompts_and_guest()


def get_active_user_id():
    if 'user_id' in session:
        return session['user_id']
    guest = User.query.filter_by(username='guest').first()
    return guest.id if guest else 1


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/prompts/generate', methods=['GET'])
def generate_custom_prompt():
    genre = request.args.get('genre', 'all').strip()
    story_length = request.args.get('story_length', 'all').strip()

    query = Prompt.query

    if genre and genre.lower() != 'all':
        query = query.filter(Prompt.genre.ilike(genre))
    if story_length and story_length.lower() != 'all':
        query = query.filter(Prompt.story_length.ilike(story_length))

    prompts = query.all()

    if not prompts:
        prompts = Prompt.query.all()

    if not prompts:
        return jsonify({"error": "No prompts available."}), 404

    selected = random.choice(prompts)
    return jsonify({
        "id": selected.id,
        "genre": selected.genre,
        "story_length": selected.story_length,
        "prompt_text": selected.prompt_text
    })


@app.route('/api/prompts/random', methods=['GET'])
def get_random_prompt():
    category = request.args.get('category', 'all').strip()

    if category.lower() == 'daily':
        prompts = Prompt.query.filter_by(is_daily_challenge=True).all()
    elif category and category.lower() != 'all':
        prompts = Prompt.query.filter(Prompt.category.ilike(category)).all()
    else:
        prompts = Prompt.query.all()

    if not prompts:
        return jsonify({"error": "No prompts found for selected category."}), 404

    selected = random.choice(prompts)
    return jsonify({
        "id": selected.id,
        "category": selected.category,
        "prompt_text": selected.prompt_text,
        "is_daily_challenge": selected.is_daily_challenge
    })


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "Username or Email already registered."}), 409

    user = User(username=username, email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    session['user_id'] = user.id
    session['username'] = user.username

    return jsonify({
        "message": "Account created successfully.",
        "user": {"id": user.id, "username": user.username, "email": user.email}
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identity = data.get('identity', '').strip()
    password = data.get('password', '')

    if not identity or not password:
        return jsonify({"error": "Credentials missing."}), 400

    user = User.query.filter(
        (User.username == identity) | (User.email == identity.lower())
    ).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username/email or password."}), 401

    session['user_id'] = user.id
    session['username'] = user.username

    return jsonify({
        "message": "Login successful.",
        "user": {"id": user.id, "username": user.username, "email": user.email}
    }), 200


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully."}), 200


@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({
            "authenticated": False,
            "user": {"id": get_active_user_id(), "username": "Guest User"}
        })

    user = User.query.get(user_id)
    if not user:
        session.clear()
        return jsonify({"authenticated": False, "user": None})

    return jsonify({
        "authenticated": True,
        "user": {"id": user.id, "username": user.username, "email": user.email}
    })


@app.route('/api/sessions/save', methods=['POST'])
def save_session():
    data = request.get_json() or {}
    user_id = get_active_user_id()

    new_session = WritingSession(
        user_id=user_id,
        mode=data.get('mode', 'classic'),
        status=data.get('status', 'completed'),
        target_words=int(data.get('target_words', 0)),
        inactivity_threshold_seconds=int(data.get('inactivity_threshold', 5)),
        total_words=int(data.get('total_words', 0)),
        total_characters=int(data.get('total_characters', 0)),
        duration_seconds=int(data.get('duration_seconds', 0)),
        average_wpm=float(data.get('average_wpm', 0.0)),
        peak_wpm=float(data.get('peak_wpm', 0.0)),
        pause_count=int(data.get('pause_count', 0)),
        longest_typing_streak_seconds=int(data.get('longest_streak_seconds', 0))
    )

    db.session.add(new_session)
    db.session.commit()

    return jsonify({
        "message": "Session telemetry saved securely.",
        "session_id": new_session.id
    }), 201


@app.route('/api/sessions/history', methods=['GET'])
def get_session_history():
    user_id = get_active_user_id()
    sessions = WritingSession.query.filter_by(user_id=user_id).order_by(WritingSession.created_at.desc()).all()

    total_sessions = len(sessions)
    total_words = sum(s.total_words for s in sessions)
    avg_wpm = round(sum(s.average_wpm for s in sessions) / total_sessions, 1) if total_sessions > 0 else 0
    completed_count = sum(1 for s in sessions if s.status == 'completed')
    completion_rate = round((completed_count / total_sessions) * 100) if total_sessions > 0 else 0

    history_data = []
    for s in sessions:
        history_data.append({
            "id": s.id,
            "mode": s.mode,
            "status": s.status,
            "total_words": s.total_words,
            "duration_seconds": s.duration_seconds,
            "average_wpm": s.average_wpm,
            "created_at": s.created_at.strftime("%b %d, %Y %H:%M")
        })

    return jsonify({
        "lifetime": {
            "total_sessions": total_sessions,
            "total_words": total_words,
            "average_wpm": avg_wpm,
            "completion_rate": completion_rate
        },
        "history": history_data
    })


@app.route('/api/analytics/detailed', methods=['GET'])
def get_detailed_analytics():
    user_id = get_active_user_id()
    sessions = WritingSession.query.filter_by(user_id=user_id).order_by(WritingSession.created_at.asc()).all()

    mode_counts = {"classic": 0, "sprint": 0, "practice": 0}
    wpm_trend = []
    dates = []

    for s in sessions:
        mode_key = s.mode.lower()
        if mode_key in mode_counts:
            mode_counts[mode_key] += 1
        wpm_trend.append(round(s.average_wpm, 1))
        dates.append(s.created_at.strftime("%b %d"))

    return jsonify({
        "wpm_trend": wpm_trend[-10:],
        "dates": dates[-10:],
        "mode_breakdown": mode_counts
    })


@app.route('/api/export/csv', methods=['GET'])
def export_csv():
    user_id = get_active_user_id()
    sessions = WritingSession.query.filter_by(user_id=user_id).order_by(WritingSession.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Session ID", "Mode", "Status", "Target Words", "Inactivity Threshold (s)",
        "Total Words", "Total Characters", "Duration (s)", "Average WPM",
        "Peak WPM", "Pause Count", "Longest Streak (s)", "Created At"
    ])

    for s in sessions:
        writer.writerow([
            s.id, s.mode, s.status, s.target_words, s.inactivity_threshold_seconds,
            s.total_words, s.total_characters, s.duration_seconds, s.average_wpm,
            s.peak_wpm, s.pause_count, s.longest_typing_streak_seconds,
            s.created_at.strftime("%Y-%m-%d %H:%M:%S") if s.created_at else ""
        ])

    response = Response(output.getvalue(), mimetype='text/csv')
    response.headers['Content-Disposition'] = 'attachment; filename=vanisha_writing_history.csv'
    return response


@app.route('/api/export/json', methods=['GET'])
def export_json():
    user_id = get_active_user_id()
    user = User.query.get(user_id)
    sessions = WritingSession.query.filter_by(user_id=user_id).order_by(WritingSession.created_at.desc()).all()

    total_sessions = len(sessions)
    total_words = sum(s.total_words for s in sessions)
    avg_wpm = round(sum(s.average_wpm for s in sessions) / total_sessions, 1) if total_sessions > 0 else 0
    completed_count = sum(1 for s in sessions if s.status == 'completed')
    completion_rate = round((completed_count / total_sessions) * 100) if total_sessions > 0 else 0

    backup_data = {
        "version": "1.0",
        "exported_at": datetime.utcnow().isoformat(),
        "user": user.to_dict() if user else {"id": user_id, "username": "Guest"},
        "summary": {
            "total_sessions": total_sessions,
            "total_words": total_words,
            "average_wpm": avg_wpm,
            "completion_rate": completion_rate
        },
        "sessions": [s.to_dict() for s in sessions]
    }

    response = Response(json.dumps(backup_data, indent=2), mimetype='application/json')
    response.headers['Content-Disposition'] = 'attachment; filename=vanisha_telemetry_backup.json'
    return response


@app.route('/api/export/summary', methods=['GET'])
def export_summary():
    user_id = get_active_user_id()
    user = User.query.get(user_id)
    sessions = WritingSession.query.filter_by(user_id=user_id).order_by(WritingSession.created_at.desc()).all()

    total_sessions = len(sessions)
    total_words = sum(s.total_words for s in sessions)
    total_duration = sum(s.duration_seconds for s in sessions)
    avg_wpm = round(sum(s.average_wpm for s in sessions) / total_sessions, 1) if total_sessions > 0 else 0
    peak_wpm_overall = max((s.peak_wpm for s in sessions), default=0.0)
    completed_count = sum(1 for s in sessions if s.status == 'completed')
    completion_rate = round((completed_count / total_sessions) * 100) if total_sessions > 0 else 0

    username = user.username if user else "Guest User"
    report_date = datetime.utcnow().strftime("%B %d, %Y")

    report_lines = [
        f"# Vanisha Executive Writing Telemetry Report",
        f"**User:** {username}  |  **Generated:** {report_date}\n",
        f"## 1. Executive Summary",
        f"- **Lifetime Total Words Written:** {total_words:,}",
        f"- **Total Writing Time:** {total_duration // 60} mins {total_duration % 60} secs",
        f"- **Total Sessions Tracked:** {total_sessions}",
        f"- **Average Typing Velocity:** {avg_wpm} WPM",
        f"- **Peak Recorded Velocity:** {peak_wpm_overall} WPM",
        f"- **Session Completion Rate:** {completion_rate}%\n",
        f"## 2. Recent Session Activity Log",
        f"| Date | Mode | Status | Words | Duration | Avg WPM | Peak WPM |",
        f"| --- | --- | --- | --- | --- | --- | --- |"
    ]

    for s in sessions[:15]:
        date_str = s.created_at.strftime("%Y-%m-%d %H:%M") if s.created_at else "N/A"
        dur_str = f"{s.duration_seconds // 60}m {s.duration_seconds % 60}s"
        report_lines.append(f"| {date_str} | {s.mode.capitalize()} | {s.status.upper()} | {s.total_words} | {dur_str} | {s.average_wpm} | {s.peak_wpm} |")

    report_content = "\n".join(report_lines)
    response = Response(report_content, mimetype='text/markdown')
    response.headers['Content-Disposition'] = 'attachment; filename=vanisha_summary_report.md'
    return response


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=os.environ.get('FLASK_DEBUG', 'False').lower() == 'true', port=port)