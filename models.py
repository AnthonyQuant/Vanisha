from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Writing streak metrics
    current_streak_days = db.Column(db.Integer, default=0)
    best_streak_days = db.Column(db.Integer, default=0)
    last_writing_date = db.Column(db.Date, nullable=True)

    # Relationships
    sessions = db.relationship('WritingSession', backref='user', lazy='dynamic', cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class WritingSession(db.Model):
    __tablename__ = 'writing_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Session configurations
    mode = db.Column(db.String(20), nullable=False, default='classic')  # classic, sprint, practice
    status = db.Column(db.String(20), nullable=False, default='completed')  # completed, wiped
    target_words = db.Column(db.Integer, default=0)
    inactivity_threshold_seconds = db.Column(db.Integer, default=5)

    # Telemetry metadata
    total_words = db.Column(db.Integer, default=0)
    total_characters = db.Column(db.Integer, default=0)
    duration_seconds = db.Column(db.Integer, default=0)
    average_wpm = db.Column(db.Float, default=0.0)
    peak_wpm = db.Column(db.Float, default=0.0)
    pause_count = db.Column(db.Integer, default=0)
    longest_typing_streak_seconds = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    metrics = db.relationship('SessionMetric', backref='session', lazy='dynamic', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "mode": self.mode,
            "status": self.status,
            "target_words": self.target_words,
            "inactivity_threshold_seconds": self.inactivity_threshold_seconds,
            "total_words": self.total_words,
            "total_characters": self.total_characters,
            "duration_seconds": self.duration_seconds,
            "average_wpm": self.average_wpm,
            "peak_wpm": self.peak_wpm,
            "pause_count": self.pause_count,
            "longest_typing_streak_seconds": self.longest_typing_streak_seconds,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Prompt(db.Model):
    __tablename__ = 'prompts'

    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(32), nullable=False, index=True)
    genre = db.Column(db.String(32), nullable=False, default='Fantasy')
    story_length = db.Column(db.String(32), nullable=False, default='Flash Fiction')
    prompt_text = db.Column(db.Text, nullable=False)
    is_daily_challenge = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class SessionMetric(db.Model):
    __tablename__ = 'session_metrics'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('writing_sessions.id'), nullable=False)
    timestamp_offset_seconds = db.Column(db.Integer, nullable=False)
    wpm = db.Column(db.Float, default=0.0)
    word_count = db.Column(db.Integer, default=0)