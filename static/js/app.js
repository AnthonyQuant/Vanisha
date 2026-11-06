document.addEventListener('DOMContentLoaded', () => {
    // DOM Element Selectors
    const canvas = document.getElementById('writing-canvas');
    const statWords = document.getElementById('stat-words');
    const statChars = document.getElementById('stat-chars');
    const statWpm = document.getElementById('stat-wpm');
    const statTimer = document.getElementById('stat-timer');
    const statModeBadge = document.getElementById('stat-mode-badge');
    const statusText = document.getElementById('session-status-text');
    const timerRing = document.getElementById('timer-ring-circle');
    const dangerVignette = document.getElementById('danger-vignette');
    const finishSessionBtn = document.getElementById('finish-session-btn');
    const modeCards = document.querySelectorAll('.mode-card');
    const toastContainer = document.getElementById('milestone-toast-container');

    // Navigation & View Containers
    const homeView = document.getElementById('home-view');
    const editorView = document.getElementById('editor-view');
    const promptGeneratorView = document.getElementById('prompt-generator-view');
    const brandHomeLogo = document.getElementById('brand-home-logo');
    const navHomeBtn = document.getElementById('nav-home-btn');
    const navAnalyticsBtn = document.getElementById('nav-analytics-btn');
    const navHistoryBtn = document.getElementById('nav-history-btn');
    const navSettingsBtn = document.getElementById('nav-settings-btn');
    const navProfileBtn = document.querySelector('.nav-profile-btn');
    const startChallengeBtn = document.getElementById('start-challenge-btn');
    const featurePromptBtn = document.getElementById('feature-prompt-btn');
    const featureAnalyticsBtn = document.getElementById('feature-analytics-btn');
    const featureMilestonesBtn = document.getElementById('feature-milestones-btn');
    const startPromptChallengeBtn = document.getElementById('start-prompt-challenge-btn');

    // Screen 2 Story Prompt Generator Elements
    const screen2GenerateBtn = document.getElementById('screen2-generate-btn');
    const screen2LengthSelect = document.getElementById('screen2-length-select');
    const screen2GenreSelect = document.getElementById('screen2-genre-select');
    const screen2PromptDisplay = document.getElementById('screen2-prompt-display');
    const activePromptBanner = document.getElementById('active-prompt-banner');
    const activePromptText = document.getElementById('active-prompt-text');

    // Mode Card Time Selectors
    const classicTimeSelect = document.getElementById('classic-time-select');
    const sprintTimeSelect = document.getElementById('sprint-time-select');
    const practiceGraceSelect = document.getElementById('practice-grace-select');

    // Header & Layout Controls
    const appHeader = document.querySelector('.app-header');
    const bottomBar = document.querySelector('.bottom-bar');
    const themeSelect = document.getElementById('theme-select');
    const ambientSoundSelect = document.getElementById('ambient-sound-select');

    // Modals
    const summaryModal = document.getElementById('summary-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalContinueBtn = document.getElementById('modal-continue-btn');
    const exportTxtBtn = document.getElementById('export-txt-btn');
    const exportMdBtn = document.getElementById('export-md-btn');

    const summaryWords = document.getElementById('summary-words');
    const summaryChars = document.getElementById('summary-chars');
    const summaryDuration = document.getElementById('summary-duration');
    const summaryAvgWpm = document.getElementById('summary-avg-wpm');
    const summaryPeakWpm = document.getElementById('summary-peak-wpm');
    const summaryPauses = document.getElementById('summary-pauses');
    const summaryStreak = document.getElementById('summary-streak');

    const historyModal = document.getElementById('history-modal');
    const historyModalCloseBtn = document.getElementById('history-modal-close-btn');
    const lifeWords = document.getElementById('life-words');
    const lifeSessions = document.getElementById('life-sessions');
    const lifeWpm = document.getElementById('life-wpm');
    const lifeRate = document.getElementById('life-rate');
    const historyLogsContainer = document.getElementById('history-logs-container');

    const analyticsModal = document.getElementById('analytics-modal');
    const analyticsModalCloseBtn = document.getElementById('analytics-modal-close-btn');
    const analyticsClassicCount = document.getElementById('analytics-classic-count');
    const analyticsSprintCount = document.getElementById('analytics-sprint-count');
    const analyticsPracticeCount = document.getElementById('analytics-practice-count');

    const settingsModal = document.getElementById('settings-modal');
    const settingsModalCloseBtn = document.getElementById('settings-modal-close-btn');

    const profileModal = document.getElementById('profile-modal');
    const profileModalCloseBtn = document.getElementById('profile-modal-close-btn');
    const profileWordsTotal = document.getElementById('profile-words-total');
    const profileSessionsTotal = document.getElementById('profile-sessions-total');
    const profileWpmAvg = document.getElementById('profile-wpm-avg');
    const profileCompletionRate = document.getElementById('profile-completion-rate');

    const achievementsModal = document.getElementById('achievements-modal');
    const achievementsModalCloseBtn = document.getElementById('achievements-modal-close-btn');

    // Sprint & Practice Elements
    const sprintGoalContainer = document.getElementById('sprint-goal-container');
    const sprintTargetDisplay = document.getElementById('sprint-target-display');
    const sprintTimeDisplay = document.getElementById('sprint-time-display');
    const sprintProgressFill = document.getElementById('sprint-progress-fill');
    const practiceGraceBanner = document.getElementById('practice-grace-banner');

    const RING_CIRCUMFERENCE = 2 * Math.PI * 18;
    if (timerRing) {
        timerRing.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
    }

    // Explicit Finite State Machine Definitions
    const STATES = {
        IDLE: 'IDLE',
        WRITING: 'WRITING',
        WARNING: 'WARNING',
        COMPLETED: 'COMPLETED',
        EXPIRED: 'EXPIRED'
    };

    let currentState = STATES.IDLE;
    let currentMode = 'classic';
    let inactivityThreshold = 15;
    let practiceGraceSeconds = 5;
    let inPracticeGrace = false;

    let sprintDurationSeconds = 300;
    let sprintRemainingSeconds = sprintDurationSeconds;
    let sprintTargetWords = 300;
    let sprintTimerInterval = null;

    let timeRemaining = inactivityThreshold;
    let targetDeadline = null;
    let soundEnabled = true;
    let startTime = null;
    let timerInterval = null;
    let countdownInterval = null;

    let totalWords = 0;
    let totalCharacters = 0;
    let peakWPM = 0;
    let pauseCount = 0;
    let lastKeyTime = null;
    let currentTypingStreak = 0;
    let longestTypingStreak = 0;

    let isPasteOperation = false;
    let pastedWordCount = 0;
    let previousTextLength = 0;

    let wpmHistory = [];
    let wpmTimeLabels = [];
    let wpmChartInstance = null;
    let analyticsChartInstance = null;
    let savedTextBuffer = "";

    const milestoneThresholds = [100, 250, 500, 1000];
    let hitMilestones = new Set();
    let zenFadeTimeout = null;

    // Navigation & View Routing
    function showView(viewToShow) {
        [homeView, editorView, promptGeneratorView].forEach(v => {
            if (v) v.classList.add('hidden');
        });
        if (viewToShow) viewToShow.classList.remove('hidden');
    }

    if (brandHomeLogo) brandHomeLogo.addEventListener('click', () => showView(homeView));
    if (navHomeBtn) navHomeBtn.addEventListener('click', () => showView(homeView));

    if (startChallengeBtn) {
        startChallengeBtn.addEventListener('click', () => {
            showView(editorView);
            if (canvas) canvas.focus();
        });
    }

    if (featurePromptBtn) {
        featurePromptBtn.addEventListener('click', () => showView(promptGeneratorView));
    }

    if (startPromptChallengeBtn) {
        startPromptChallengeBtn.addEventListener('click', () => {
            const promptText = screen2PromptDisplay ? screen2PromptDisplay.innerText : '';
            if (promptText && !promptText.includes('Click "Generate Prompt"')) {
                if (activePromptText) activePromptText.innerText = promptText;
                if (activePromptBanner) activePromptBanner.classList.remove('hidden');
            }
            showView(editorView);
            if (canvas) canvas.focus();
        });
    }

    // Modal Triggers for Settings, Profile, and Achievements
    if (navSettingsBtn) {
        navSettingsBtn.addEventListener('click', () => {
            if (settingsModal) settingsModal.classList.remove('hidden');
        });
    }
    if (settingsModalCloseBtn) {
        settingsModalCloseBtn.addEventListener('click', () => {
            if (settingsModal) settingsModal.classList.add('hidden');
        });
    }

    async function loadProfileDashboard() {
        try {
            const res = await fetch('/api/sessions/history');
            if (!res.ok) throw new Error("Failed to load profile history");
            const data = await res.json();

            if (profileWordsTotal) profileWordsTotal.innerText = data.lifetime.total_words;
            if (profileSessionsTotal) profileSessionsTotal.innerText = data.lifetime.total_sessions;
            if (profileWpmAvg) profileWpmAvg.innerText = `${data.lifetime.average_wpm} WPM`;
            if (profileCompletionRate) profileCompletionRate.innerText = `${data.lifetime.completion_rate}%`;
        } catch (e) {
            console.error("Failed to load profile telemetry:", e);
        }
    }

    if (navProfileBtn) {
        navProfileBtn.addEventListener('click', () => {
            loadProfileDashboard();
            if (profileModal) profileModal.classList.remove('hidden');
        });
    }
    if (profileModalCloseBtn) {
        profileModalCloseBtn.addEventListener('click', () => {
            if (profileModal) profileModal.classList.add('hidden');
        });
    }

    if (featureMilestonesBtn) {
        featureMilestonesBtn.addEventListener('click', () => {
            if (achievementsModal) achievementsModal.classList.remove('hidden');
        });
    }
    if (achievementsModalCloseBtn) {
        achievementsModalCloseBtn.addEventListener('click', () => {
            if (achievementsModal) achievementsModal.classList.add('hidden');
        });
    }

    // Mode Card Selection & Dropdown Dynamic Configuration
    modeCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.tagName === 'SELECT') return;

            if (currentState === STATES.WRITING || currentState === STATES.WARNING) {
                if (!confirm("Changing modes will reset your current session. Continue?")) return;
                resetSessionState();
            }

            modeCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            currentMode = card.dataset.mode;
            syncSettingsFromCardSelects();
        });
    });

    function syncSettingsFromCardSelects() {
        if (classicTimeSelect) inactivityThreshold = parseInt(classicTimeSelect.value, 10) || 15;
        if (sprintTimeSelect) sprintDurationSeconds = parseInt(sprintTimeSelect.value, 10) || 300;
        if (practiceGraceSelect) practiceGraceSeconds = parseInt(practiceGraceSelect.value, 10) || 5;

        if (statModeBadge) statModeBadge.innerText = currentMode.toUpperCase();

        if (currentMode === 'classic') {
            if (sprintGoalContainer) sprintGoalContainer.classList.add('hidden');
            if (practiceGraceBanner) practiceGraceBanner.classList.add('hidden');
        } else if (currentMode === 'sprint') {
            inactivityThreshold = 15;
            if (sprintGoalContainer) sprintGoalContainer.classList.remove('hidden');
            if (practiceGraceBanner) practiceGraceBanner.classList.add('hidden');
            updateSprintProgress();
        } else if (currentMode === 'practice') {
            inactivityThreshold = 15;
            if (sprintGoalContainer) sprintGoalContainer.classList.add('hidden');
        }

        timeRemaining = inactivityThreshold;
        updateCountdownRing();
    }

    if (classicTimeSelect) classicTimeSelect.addEventListener('change', syncSettingsFromCardSelects);
    if (sprintTimeSelect) sprintTimeSelect.addEventListener('change', syncSettingsFromCardSelects);
    if (practiceGraceSelect) practiceGraceSelect.addEventListener('change', syncSettingsFromCardSelects);

    // Zen Mode Auto-Dimming
    function applyZenDimming() {
        if (currentState !== STATES.WRITING && currentState !== STATES.WARNING) return;
        if (summaryModal && !summaryModal.classList.contains('hidden')) return;
        if (historyModal && !historyModal.classList.contains('hidden')) return;
        if (analyticsModal && !analyticsModal.classList.contains('hidden')) return;
        if (settingsModal && !settingsModal.classList.contains('hidden')) return;
        if (profileModal && !profileModal.classList.contains('hidden')) return;
        if (achievementsModal && !achievementsModal.classList.contains('hidden')) return;

        if (appHeader) appHeader.classList.add('zen-dimmed');
        if (bottomBar) bottomBar.classList.add('zen-dimmed');
        if (sprintGoalContainer) sprintGoalContainer.classList.add('zen-dimmed');
    }

    function resetZenDimming() {
        if (appHeader) appHeader.classList.remove('zen-dimmed');
        if (bottomBar) bottomBar.classList.remove('zen-dimmed');
        if (sprintGoalContainer) sprintGoalContainer.classList.remove('zen-dimmed');

        clearTimeout(zenFadeTimeout);
        if (currentState === STATES.WRITING || currentState === STATES.WARNING) {
            zenFadeTimeout = setTimeout(applyZenDimming, 2000);
        }
    }

    document.addEventListener('mousemove', resetZenDimming);

    // Screen 2 Prompt Generator API
    if (screen2GenerateBtn) {
        screen2GenerateBtn.addEventListener('click', async () => {
            const genre = screen2GenreSelect ? screen2GenreSelect.value : 'all';
            const storyLength = screen2LengthSelect ? screen2LengthSelect.value : 'all';

            try {
                const res = await fetch(`/api/prompts/generate?genre=${encodeURIComponent(genre)}&story_length=${encodeURIComponent(storyLength)}`);
                if (!res.ok) throw new Error("Failed to generate prompt");
                const data = await res.json();
                if (screen2PromptDisplay) screen2PromptDisplay.innerText = data.prompt_text;
            } catch (err) {
                if (screen2PromptDisplay) screen2PromptDisplay.innerText = "Error fetching prompt. Please try again.";
            }
        });
    }

    // Web Audio Synthesizer Controls
    let audioCtx = null;
    let ambientSource = null;
    let ambientGain = null;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function stopAmbientSound() {
        if (ambientSource) {
            try { ambientSource.stop(); } catch(e){}
            ambientSource.disconnect();
            ambientSource = null;
        }
    }

    function startAmbientSound(type) {
        stopAmbientSound();
        if (type === 'off') return;
        initAudio();

        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        ambientSource = audioCtx.createBufferSource();
        ambientSource.buffer = buffer;
        ambientSource.loop = true;

        const filter = audioCtx.createBiquadFilter();
        ambientGain = audioCtx.createGain();

        if (type === 'rain') {
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, audioCtx.currentTime);
            ambientGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        } else if (type === 'waves') {
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(400, audioCtx.currentTime);
            ambientGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        } else {
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(3000, audioCtx.currentTime);
            ambientGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        }

        ambientSource.connect(filter);
        filter.connect(ambientGain);
        ambientGain.connect(audioCtx.destination);
        ambientSource.start();
    }

    if (ambientSoundSelect) {
        ambientSoundSelect.addEventListener('change', (e) => startAmbientSound(e.target.value));
    }

    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            document.body.className = e.target.value;
            localStorage.setItem('vanisha_theme', e.target.value);
        });
        const savedTheme = localStorage.getItem('vanisha_theme');
        if (savedTheme) {
            document.body.className = savedTheme;
            themeSelect.value = savedTheme;
        }
    }

    function playKeyClick() {
        if (!soundEnabled) return;
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400 + Math.random() * 150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.03);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.03);
    }

    function playDisappearanceSound() {
        if (!soundEnabled) return;
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    }

    function playMilestoneSound() {
        if (!soundEnabled) return;
        initAudio();
        const frequencies = [523.25, 659.25];
        frequencies.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);
            gain.gain.setValueAtTime(0.18, audioCtx.currentTime + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.12 + 0.3);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + idx * 0.12);
            osc.stop(audioCtx.currentTime + idx * 0.12 + 0.3);
        });
    }

    function playVictorySound() {
        if (!soundEnabled) return;
        initAudio();
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.1);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.1 + 0.25);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + idx * 0.1);
            osc.stop(audioCtx.currentTime + idx * 0.1 + 0.25);
        });
    }

    // Central Finite State Machine Transition Controller
    function transitionTo(newState, payload = {}) {
        currentState = newState;
        if (!statusText) return;

        switch (newState) {
            case STATES.IDLE:
                statusText.innerHTML = '<i class="fa-solid fa-circle text-success me-1"></i> Ready';
                if (timerRing) timerRing.classList.remove('warning');
                if (dangerVignette) dangerVignette.classList.remove('active');
                resetZenDimming();
                break;

            case STATES.WRITING:
                statusText.innerHTML = '<i class="fa-solid fa-fire text-warning me-1"></i> Writing Active';
                if (timerRing) timerRing.classList.remove('warning');
                if (dangerVignette) dangerVignette.classList.remove('active');
                resetZenDimming();
                break;

            case STATES.WARNING:
                statusText.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-danger me-1"></i> Warning: Time Expiring!';
                if (timerRing) timerRing.classList.add('warning');
                if (dangerVignette) dangerVignette.classList.add('active');
                resetZenDimming();
                break;

            case STATES.COMPLETED:
                statusText.innerHTML = `<i class="fa-solid fa-trophy text-warning me-1"></i> ${payload.reason || 'Session Completed'}`;
                if (timerRing) timerRing.classList.remove('warning');
                if (dangerVignette) dangerVignette.classList.remove('active');
                resetZenDimming();
                break;

            case STATES.EXPIRED:
                statusText.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-danger me-1"></i> ${payload.reason || 'Text Disappeared!'}`;
                if (timerRing) timerRing.classList.remove('warning');
                if (dangerVignette) dangerVignette.classList.remove('active');
                resetZenDimming();
                break;
        }
    }

    // Analytics Dashboard Loader
    async function openAnalyticsDashboard() {
        try {
            const res = await fetch('/api/analytics/detailed');
            if (!res.ok) throw new Error("Failed to load analytics");
            const data = await res.json();

            if (analyticsClassicCount) analyticsClassicCount.innerText = data.mode_breakdown.classic || 0;
            if (analyticsSprintCount) analyticsSprintCount.innerText = data.mode_breakdown.sprint || 0;
            if (analyticsPracticeCount) analyticsPracticeCount.innerText = data.mode_breakdown.practice || 0;

            const chartCanvas = document.getElementById('analytics-trend-chart');
            if (chartCanvas) {
                if (analyticsChartInstance) analyticsChartInstance.destroy();
                analyticsChartInstance = new Chart(chartCanvas.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: data.dates.length ? data.dates : ['Recent'],
                        datasets: [{
                            label: 'Avg WPM Velocity Trend',
                            data: data.wpm_trend.length ? data.wpm_trend : [0],
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.2)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }

            if (analyticsModal) analyticsModal.classList.remove('hidden');
        } catch (e) {
            console.error("Failed to load analytics:", e);
        }
    }

    if (navAnalyticsBtn) navAnalyticsBtn.addEventListener('click', openAnalyticsDashboard);
    if (featureAnalyticsBtn) featureAnalyticsBtn.addEventListener('click', openAnalyticsDashboard);
    if (analyticsModalCloseBtn) analyticsModalCloseBtn.addEventListener('click', () => {
        if (analyticsModal) analyticsModal.classList.add('hidden');
    });

    // History Dashboard Loader
    async function loadHistoryDashboard() {
        try {
            const res = await fetch('/api/sessions/history');
            if (!res.ok) throw new Error("Failed to load history");
            const data = await res.json();

            if (lifeWords) lifeWords.innerText = data.lifetime.total_words;
            if (lifeSessions) lifeSessions.innerText = data.lifetime.total_sessions;
            if (lifeWpm) lifeWpm.innerText = `${data.lifetime.average_wpm} WPM`;
            if (lifeRate) lifeRate.innerText = `${data.lifetime.completion_rate}%`;

            if (!historyLogsContainer) return;

            if (!data.history || data.history.length === 0) {
                historyLogsContainer.innerHTML = `<p class="empty-history-text">No past sessions found. Start writing!</p>`;
                return;
            }

            historyLogsContainer.innerHTML = data.history.map(item => `
                <div class="history-log-item">
                    <div class="log-meta">
                        <span class="log-mode badge-mode">${item.mode}</span>
                        <span class="log-date">${item.created_at}</span>
                    </div>
                    <div class="log-stats">
                        <span><strong>${item.total_words}</strong> words</span>
                        <span><strong>${formatTime(item.duration_seconds)}</strong></span>
                        <span><strong>${Math.round(item.average_wpm)}</strong> WPM</span>
                        <span class="log-status ${item.status}">${item.status.toUpperCase()}</span>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            if (historyLogsContainer) {
                historyLogsContainer.innerHTML = `<p class="empty-history-text">Error loading history logs.</p>`;
            }
        }
    }

    if (navHistoryBtn) {
        navHistoryBtn.addEventListener('click', () => {
            loadHistoryDashboard();
            if (historyModal) historyModal.classList.remove('hidden');
        });
    }

    if (historyModalCloseBtn) {
        historyModalCloseBtn.addEventListener('click', () => {
            if (historyModal) historyModal.classList.add('hidden');
        });
    }

    // Milestones Toast Trigger
    function checkMilestones(words) {
        milestoneThresholds.forEach(threshold => {
            if (words >= threshold && !hitMilestones.has(threshold)) {
                hitMilestones.add(threshold);
                showMilestoneToast(threshold);
            }
        });
    }

    function showMilestoneToast(wordCount) {
        playMilestoneSound();
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'milestone-toast';
        toast.innerHTML = `<i class="fa-solid fa-award text-warning me-2"></i> <strong>${wordCount}-Word Milestone Achieved!</strong>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }

    function getWordCount(text) {
        const trimmed = text.trim();
        return trimmed ? trimmed.split(/\s+/).length : 0;
    }

    function calculateWPM(words, elapsedSeconds) {
        if (elapsedSeconds <= 0 || words <= 0) return 0;
        const organicWords = Math.max(0, words - pastedWordCount);
        const organicWpm = Math.round(organicWords / (elapsedSeconds / 60));
        return Math.min(250, organicWpm);
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    function updateCountdownRing() {
        if (!timerRing) return;
        const fraction = timeRemaining / inactivityThreshold;
        const offset = RING_CIRCUMFERENCE - (fraction * RING_CIRCUMFERENCE);
        timerRing.style.strokeDashoffset = offset;

        if (timeRemaining <= 2 && (currentState === STATES.WRITING || currentState === STATES.WARNING)) {
            if (currentState !== STATES.WARNING) {
                transitionTo(STATES.WARNING);
            }
        } else if (timeRemaining > 2 && currentState === STATES.WARNING) {
            transitionTo(STATES.WRITING);
        }
    }

    function updateSprintProgress() {
        if (currentMode !== 'sprint') return;
        const pct = Math.min(100, Math.round((totalWords / sprintTargetWords) * 100));
        if (sprintProgressFill) sprintProgressFill.style.width = `${pct}%`;
        if (sprintTargetDisplay) sprintTargetDisplay.innerText = sprintTargetWords;
        if (sprintTimeDisplay) sprintTimeDisplay.innerText = formatTime(sprintRemainingSeconds);

        if (totalWords >= sprintTargetWords) {
            triggerSprintVictory();
        }
    }

    function startSession() {
        transitionTo(STATES.WRITING);
        startTime = new Date();
        lastKeyTime = new Date();
        targetDeadline = Date.now() + (inactivityThreshold * 1000);

        timerInterval = setInterval(() => {
            const elapsedSeconds = Math.floor((new Date() - startTime) / 1000);
            if (statTimer) statTimer.innerText = formatTime(elapsedSeconds);

            const currentWpm = calculateWPM(totalWords, elapsedSeconds);
            if (statWpm) statWpm.innerText = currentWpm;
            if (currentWpm > peakWPM) peakWPM = currentWpm;

            currentTypingStreak++;
            if (currentTypingStreak > longestTypingStreak) longestTypingStreak = currentTypingStreak;

            if (elapsedSeconds > 0 && elapsedSeconds % 5 === 0) {
                wpmTimeLabels.push(`${elapsedSeconds}s`);
                wpmHistory.push(currentWpm);
            }
        }, 1000);

        if (currentMode === 'sprint') {
            sprintRemainingSeconds = sprintDurationSeconds;
            sprintTimerInterval = setInterval(() => {
                sprintRemainingSeconds--;
                if (sprintTimeDisplay) sprintTimeDisplay.innerText = formatTime(sprintRemainingSeconds);

                if (sprintRemainingSeconds <= 0) {
                    if (totalWords >= sprintTargetWords) {
                        triggerSprintVictory();
                    } else {
                        triggerDisappearance("Sprint Time Expired!");
                    }
                }
            }, 1000);
        }

        countdownInterval = setInterval(() => {
            if (!targetDeadline) return;

            const msRemaining = targetDeadline - Date.now();
            timeRemaining = Math.max(0, Math.ceil(msRemaining / 1000));

            if (canvas) canvas.style.opacity = Math.max(0.2, timeRemaining / inactivityThreshold);
            updateCountdownRing();

            if (msRemaining <= 0) {
                if (currentMode === 'practice' && !inPracticeGrace) {
                    inPracticeGrace = true;
                    if (practiceGraceBanner) practiceGraceBanner.classList.remove('hidden');
                    targetDeadline = Date.now() + (practiceGraceSeconds * 1000);
                    timeRemaining = practiceGraceSeconds;
                } else {
                    triggerDisappearance();
                }
            }
        }, 100);
    }

    function resetInactivityTimer() {
        targetDeadline = Date.now() + (inactivityThreshold * 1000);
        timeRemaining = inactivityThreshold;
        if (canvas) canvas.style.opacity = '1.0';
        if (inPracticeGrace) {
            inPracticeGrace = false;
            if (practiceGraceBanner) practiceGraceBanner.classList.add('hidden');
        }
        if (currentState === STATES.WARNING) {
            transitionTo(STATES.WRITING);
        }
        updateCountdownRing();
    }

    function renderWpmChart() {
        const chartCanvas = document.getElementById('wpm-chart');
        if (!chartCanvas) return;

        if (wpmChartInstance) wpmChartInstance.destroy();

        const ctx = chartCanvas.getContext('2d');
        wpmChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: wpmTimeLabels.length ? wpmTimeLabels : ['0s'],
                datasets: [{
                    label: 'Words Per Minute (WPM)',
                    data: wpmHistory.length ? wpmHistory : [0],
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    async function saveSessionToBackend(statusStr) {
        const elapsedSeconds = startTime ? Math.floor((new Date() - startTime) / 1000) : 0;
        const avgWpm = calculateWPM(totalWords, elapsedSeconds);

        const payload = {
            mode: currentMode,
            status: statusStr,
            target_words: currentMode === 'sprint' ? sprintTargetWords : 0,
            inactivity_threshold: inactivityThreshold,
            total_words: totalWords,
            total_characters: canvas ? canvas.value.length : 0,
            duration_seconds: elapsedSeconds,
            average_wpm: avgWpm,
            peak_wpm: peakWPM,
            pause_count: pauseCount,
            longest_streak_seconds: longestTypingStreak
        };

        try {
            await fetch('/api/sessions/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.error("Failed to log session data:", e);
        }
    }

    function openSummaryModal(statusStr = 'completed') {
        const elapsedSeconds = startTime ? Math.floor((new Date() - startTime) / 1000) : 0;
        const avgWpm = calculateWPM(totalWords, elapsedSeconds);
        savedTextBuffer = canvas ? canvas.value : "";

        if (summaryWords) summaryWords.innerText = totalWords;
        if (summaryChars) summaryChars.innerText = savedTextBuffer.length;
        if (summaryDuration) summaryDuration.innerText = formatTime(elapsedSeconds);
        if (summaryAvgWpm) summaryAvgWpm.innerText = avgWpm;
        if (summaryPeakWpm) summaryPeakWpm.innerText = peakWPM;
        if (summaryPauses) summaryPauses.innerText = pauseCount;
        if (summaryStreak) summaryStreak.innerText = `${longestTypingStreak}s`;

        renderWpmChart();
        saveSessionToBackend(statusStr);
        if (summaryModal) summaryModal.classList.remove('hidden');
    }

    function closeSummaryModal() {
        if (summaryModal) summaryModal.classList.add('hidden');
        resetSessionState();
        if (canvas) canvas.value = '';
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeSummaryModal);
    if (modalContinueBtn) modalContinueBtn.addEventListener('click', closeSummaryModal);

    if (finishSessionBtn) {
        finishSessionBtn.addEventListener('click', () => {
            if (currentState !== STATES.WRITING && currentState !== STATES.WARNING) {
                alert("Start writing before finishing a session!");
                return;
            }
            playVictorySound();
            clearInterval(timerInterval);
            clearInterval(countdownInterval);
            clearInterval(sprintTimerInterval);
            transitionTo(STATES.COMPLETED);
            openSummaryModal('completed');
        });
    }

    function downloadFile(filename, textContent, mimeType) {
        const blob = new Blob([textContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    if (exportTxtBtn) {
        exportTxtBtn.addEventListener('click', () => {
            const filename = `Vanisha_Session_${new Date().toISOString().slice(0, 10)}.txt`;
            downloadFile(filename, savedTextBuffer, 'text/plain');
        });
    }

    if (exportMdBtn) {
        exportMdBtn.addEventListener('click', () => {
            const filename = `Vanisha_Session_${new Date().toISOString().slice(0, 10)}.md`;
            const mdContent = `# Vanisha Writing Session\n\n- **Date:** ${new Date().toLocaleDateString()}\n- **Words:** ${totalWords}\n\n---\n\n${savedTextBuffer}`;
            downloadFile(filename, mdContent, 'text/markdown');
        });
    }

    function triggerSprintVictory() {
        clearInterval(timerInterval);
        clearInterval(countdownInterval);
        clearInterval(sprintTimerInterval);

        playVictorySound();
        transitionTo(STATES.COMPLETED, { reason: 'Sprint Goal Reached!' });
        openSummaryModal('completed');
    }

    function resetSessionState() {
        clearInterval(timerInterval);
        clearInterval(countdownInterval);
        clearInterval(sprintTimerInterval);

        inPracticeGrace = false;
        targetDeadline = null;
        if (practiceGraceBanner) practiceGraceBanner.classList.add('hidden');

        totalWords = 0;
        totalCharacters = 0;
        peakWPM = 0;
        pauseCount = 0;
        currentTypingStreak = 0;
        longestTypingStreak = 0;
        lastKeyTime = null;
        pastedWordCount = 0;
        previousTextLength = 0;

        wpmHistory = [];
        wpmTimeLabels = [];
        if (wpmChartInstance) {
            wpmChartInstance.destroy();
            wpmChartInstance = null;
        }

        hitMilestones.clear();

        if (statWords) statWords.innerText = '0';
        if (statChars) statChars.innerText = '0';
        if (statWpm) statWpm.innerText = '0';
        if (statTimer) statTimer.innerText = '00:00';

        timeRemaining = inactivityThreshold;
        transitionTo(STATES.IDLE);
        updateCountdownRing();
        if (canvas) canvas.style.opacity = '1.0';
    }

    function triggerDisappearance(customReason) {
        if (canvas) { canvas.value = ''; canvas.blur(); }
        savedTextBuffer = '';

        saveSessionToBackend('wiped');
        resetSessionState();
        playDisappearanceSound();

        transitionTo(STATES.EXPIRED, { reason: customReason || 'Text Disappeared!' });

        if (canvas) {
            canvas.classList.add('wipe-shake');
            setTimeout(() => canvas.classList.remove('wipe-shake'), 400);
        }
    }

    if (canvas) {
        canvas.addEventListener('paste', (e) => {
            isPasteOperation = true;
            const clipboardData = (e.clipboardData || window.clipboardData).getData('text');
            if (clipboardData) {
                pastedWordCount += getWordCount(clipboardData);
            }
        });

        canvas.addEventListener('input', (e) => {
            const currentLength = canvas.value.length;
            const charDelta = currentLength - previousTextLength;
            previousTextLength = currentLength;

            if (!isPasteOperation && charDelta > 0 && charDelta < 15) {
                playKeyClick();
            }
            isPasteOperation = false;

            resetZenDimming();

            const now = new Date();
            if (lastKeyTime && (now - lastKeyTime) > 2000) {
                pauseCount++;
                currentTypingStreak = 0;
            }
            lastKeyTime = now;

            totalWords = getWordCount(canvas.value);
            if (statWords) statWords.innerText = totalWords;
            if (statChars) statChars.innerText = canvas.value.length;

            checkMilestones(totalWords);

            if (currentMode === 'sprint') {
                updateSprintProgress();
            }

            if (currentState === STATES.IDLE && canvas.value.length > 0) {
                startSession();
            }

            if (currentState === STATES.WRITING || currentState === STATES.WARNING) {
                resetInactivityTimer();
            }
        });
    }
});