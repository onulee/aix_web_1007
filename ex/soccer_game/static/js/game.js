class PlayerController {
    constructor(x, y, color, number, name, role, photo, isHome) {
        this.id = Math.random().toString(36).substring(2, 9);
        this.x = x; 
        this.y = y;
        this.baseX = x; 
        this.baseY = y; 
        this.color = color;
        this.number = number;
        this.name = name;
        this.role = role;
        this.photo = photo;
        this.isHome = isHome;
        this.radius = 12;
        this.speed = 2.2;
        this.vx = 0.0;
        this.vy = 0.0;
        this.state = 'IDLE'; 
    }

    update(ball, allPlayers, PITCH_WIDTH, PITCH_HEIGHT, isPlaying, isKickOffPhase) {
        if (!isPlaying) return;

        let targetX = this.baseX;
        let targetY = this.baseY;

        // 📌 [규칙 반영] 킥오프 직후 백패스 빌드업 단계 처리
        if (isKickOffPhase) {
            if (ball.possessor === this) {
                // 공을 가진 킥오프 전담 선수는 곧바로 뒤쪽(아군 진영 방향)으로 백패스 시도
                let backPassDir = this.isHome ? -1 : 1;
                targetX = this.x + backPassDir * 40;
                targetY = this.y + (Math.random() - 0.5) * 20;

                // 백패스 실행 조건 (일정 거리 이상 뒤로 밀어줌)
                if (Math.abs(this.x - ball.x) > 30) {
                    ball.vx = backPassDir * 8;
                    ball.vy = (Math.random() - 0.5) * 2;
                    ball.possessor = null; // 패스 발사 후 소유 해제 -> 동료가 받음
                }
            } else {
                // 다른 선수들은 킥오프 직후 백패스가 이루어질 때까지 제자리를 유지하며 대기
                targetX = this.baseX;
                targetY = this.baseY;
            }
        } else {
            // 일반 플레이 상황에서의 역할별 AI 및 포메이션 이동
            if (this.role === 'GK') {
                let gkX = this.isHome ? PITCH_WIDTH * 0.12 : PITCH_WIDTH * 0.88;
                targetX = gkX;
                
                if (ball.possessor === this) {
                    this.state = 'POSSESSING';
                    if (!this.holdFrames) this.holdFrames = 0;
                    this.holdFrames++;
                    
                    targetX = gkX;
                    targetY = PITCH_HEIGHT / 2;

                    if (this.holdFrames > 90) { 
                        ball.vx = this.isHome ? 14 : -14;
                        ball.vy = (Math.random() - 0.5) * 6;
                        ball.isAerial = true;
                        ball.z = 10;
                        ball.vz = 3.0;
                        ball.possessor = null;
                        this.holdFrames = 0;
                    }
                } else {
                    this.holdFrames = 0;
                    targetY = Math.max(PITCH_HEIGHT * 0.38, Math.min(PITCH_HEIGHT * 0.62, ball.y));
                }
            } else if (ball.possessor === this) {
                this.state = 'POSSESSING';
                let attackDir = this.isHome ? 1 : -1;
                targetX = this.x + attackDir * 35;
                targetY = PITCH_HEIGHT / 2 + (this.baseY - PITCH_HEIGHT / 2) * 0.5;
            } else {
                let distToBall = Math.hypot(ball.x - this.x, ball.y - this.y);

                if (distToBall < 180) {
                    this.state = 'CHASING';
                    targetX = this.baseX * 0.4 + ball.x * 0.6;
                    targetY = this.baseY * 0.4 + ball.y * 0.6;
                } else {
                    this.state = 'RETURNING';
                    let ballShiftX = (ball.x - PITCH_WIDTH / 2) * 0.2;
                    let ballShiftY = (ball.y - PITCH_HEIGHT / 2) * 0.2;
                    targetX = this.baseX + ballShiftX;
                    targetY = this.baseY + ballShiftY;
                }
            }
        }

        // 충돌 회피 (Separation Force)
        let pushX = 0;
        let pushY = 0;
        allPlayers.forEach(other => {
            if (other !== this) {
                let d = Math.hypot(this.x - other.x, this.y - other.y);
                if (d < 25 && d > 0) {
                    let repelPower = (25 - d) / 25;
                    pushX += ((this.x - other.x) / d) * repelPower * 2.5;
                    pushY += ((this.y - other.y) / d) * repelPower * 2.5;
                }
            }
        });

        targetX += pushX;
        targetY += pushY;

        let dx = targetX - this.x;
        let dy = targetY - this.y;
        let dist = Math.hypot(dx, dy);

        if (dist > 0.5) {
            let currentSpeed = this.state === 'CHASING' ? this.speed * 1.2 : this.speed;
            this.vx += ((dx / dist) * currentSpeed - this.vx) * 0.15;
            this.vy += ((dy / dist) * currentSpeed - this.vy) * 0.15;
        } else {
            this.vx *= 0.6;
            this.vy *= 0.6;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (typeof pitchGeo !== 'undefined' && pitchGeo.getPerspectiveBounds) {
            const bounds = pitchGeo.getPerspectiveBounds(this.x);
            this.x = Math.max(bounds.left + 15, Math.min(bounds.right - 15, this.x));
            this.y = Math.max(bounds.top + 15, Math.min(bounds.bottom - 15, this.y));
        }
    }

    draw(ctx, hasBall) {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath(); 
        ctx.ellipse(this.x, this.y + 4, 8, 4, 0, 0, Math.PI * 2); 
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = hasBall ? '#ff9800' : this.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.number, this.x, this.y);
    }
}

// ⚽ 공(Ball) 클래스 정의
class Ball {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.z = 0;
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.isAerial = false;
        this.possessor = null;
    }

    draw(ctx) {
        const renderY = this.y - (this.z || 0);
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath(); ctx.ellipse(this.x, this.y + 6, 6, 3, 0, 0, Math.PI * 2); ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, renderY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 📌 프로그램 시작 시 첫 클릭과 함께 전체화면 자동 전환 적용
    const docElement = document.documentElement;
    
    function goFullScreen() {
        if (docElement.requestFullscreen) {
            docElement.requestFullscreen().catch(err => {
                console.log("전체화면 전환 대기 중...");
            });
        } else if (docElement.webkitRequestFullscreen) {
            docElement.webkitRequestFullscreen();
        } else if (docElement.msRequestFullscreen) {
            docElement.msRequestFullscreen();
        }
    }

    // 화면의 어느 곳이든 최초 1회 클릭하는 순간 전체화면으로 전환
    document.addEventListener('click', function initFullscreenOnce() {
        goFullScreen();
        document.removeEventListener('click', initFullscreenOnce); // 최초 1회 실행 후 리스너 제거
    }, { once: true });
    
    const canvas = document.getElementById('pitchCanvas');
    if (!canvas) {
        console.error("pitchCanvas 요소를 찾을 수 없습니다.");
        return;
    }
    const ctx = canvas.getContext('2d');

    const PITCH_WIDTH = canvas.width;
    const PITCH_HEIGHT = canvas.height;

    const pitchGeo = new PitchGeometry(PITCH_WIDTH, PITCH_HEIGHT);
    const ruleEngine = new MatchRuleEngine(pitchGeo, 0.5);

    const LEAGUE_DATA = {
        "1부리그": ['강원', '광주', '김천', '대전', '부천', '서울', '안양', '울산', '인천', '전북', '제주', '포항'],
        "2부리그": ['경남', '김포', '김해', '대구', '부산', '서울E', '성남', '수원', '수원FC', '안산', '아산', '용인', '전남', '천안', '청주', '파주', '화성']
    };

    const staticBaseUrlInput = document.getElementById('static-url-base');
    const dataUrlBaseInput = document.getElementById('data-url-base');
    const staticBaseUrl = staticBaseUrlInput ? staticBaseUrlInput.value : '';
    const dataUrlBase = dataUrlBaseInput ? dataUrlBaseInput.value : '';

    const homeLeagueSelect = document.getElementById('home-league-select');
    const homeTeamSelect = document.getElementById('home-team-select');
    const awayLeagueSelect = document.getElementById('away-league-select');
    const awayTeamSelect = document.getElementById('away-team-select');

    const homeFormationSelect = document.getElementById('home-formation-select');
    const awayFormationSelect = document.getElementById('away-formation-select');

    const homeTacticSelect = document.getElementById('home-tactic-select');
    const awayTacticSelect = document.getElementById('away-tactic-select');

    const homeTeamNameEl = document.getElementById('home-team-name');
    const awayTeamNameEl = document.getElementById('away-team-name');
    const homeLogoEl = document.getElementById('home-logo');
    const awayLogoEl = document.getElementById('away-logo');

    const homeScoreEl = document.getElementById('home-score');
    const awayScoreEl = document.getElementById('away-score');

    let homeGoalsTotal = 0;
    let awayGoalsTotal = 0;
    let lastTouchIsHome = true;
    let isKickOffPhase = true; // 📌 여기에 전역 변수로 선언해야 합니다!
    
    const modal = document.getElementById('player-modal');
    const modalCloseBtn = document.getElementById('modal-close');
    const modalThumb = document.getElementById('modal-player-thumb');
    const modalName = document.getElementById('modal-player-name');
    const modalSub = document.getElementById('modal-player-sub');
    const modalClub = document.getElementById('modal-club');
    const modalHW = document.getElementById('modal-hw');
    const modalBirth = document.getElementById('modal-birth');

    const statsModal = document.getElementById('stats-modal');
    const statsModalClose = document.getElementById('stats-modal-close');

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    if (statsModalClose) statsModalClose.addEventListener('click', () => { statsModal.style.display = 'none'; });
    if (statsModal) statsModal.addEventListener('click', (e) => { if (e.target === statsModal) statsModal.style.display = 'none'; });

    const FORMATION_PRESETS = {
        "4-3-3": [
            { pos: 'GK', x: 100, y: 325 },
            { pos: 'DF', x: 230, y: 120 }, { pos: 'DF', x: 210, y: 250 }, { pos: 'DF', x: 210, y: 400 }, { pos: 'DF', x: 230, y: 530 },
            { pos: 'MF', x: 350, y: 180 }, { pos: 'MF', x: 330, y: 325 }, { pos: 'MF', x: 350, y: 470 },
            { pos: 'FW', x: 440, y: 160 }, { pos: 'FW', x: 460, y: 325 }, { pos: 'FW', x: 440, y: 490 }
        ],
        "4-4-2": [
            { pos: 'GK', x: 100, y: 325 },
            { pos: 'DF', x: 230, y: 120 }, { pos: 'DF', x: 210, y: 250 }, { pos: 'DF', x: 210, y: 400 }, { pos: 'DF', x: 230, y: 530 },
            { pos: 'MF', x: 340, y: 130 }, { pos: 'MF', x: 330, y: 260 }, { pos: 'MF', x: 330, y: 390 }, { pos: 'MF', x: 340, y: 520 },
            { pos: 'FW', x: 450, y: 240 }, { pos: 'FW', x: 450, y: 410 }
        ],
        "3-5-2": [
            { pos: 'GK', x: 100, y: 325 },
            { pos: 'DF', x: 220, y: 180 }, { pos: 'DF', x: 200, y: 325 }, { pos: 'DF', x: 220, y: 470 },
            { pos: 'MF', x: 340, y: 100 }, { pos: 'MF', x: 320, y: 210 }, { pos: 'MF', x: 310, y: 325 }, { pos: 'MF', x: 320, y: 440 }, { pos: 'MF', x: 340, y: 550 },
            { pos: 'FW', x: 450, y: 240 }, { pos: 'FW', x: 450, y: 410 }
        ],
        "4-2-3-1": [
            { pos: 'GK', x: 100, y: 325 },
            { pos: 'DF', x: 230, y: 120 }, { pos: 'DF', x: 210, y: 250 }, { pos: 'DF', x: 210, y: 400 }, { pos: 'DF', x: 230, y: 530 },
            { pos: 'MF', x: 310, y: 250 }, { pos: 'MF', x: 310, y: 400 },
            { pos: 'MF', x: 390, y: 160 }, { pos: 'MF', x: 390, y: 325 }, { pos: 'MF', x: 390, y: 490 },
            { pos: 'FW', x: 460, y: 325 }
        ]
    };

    const TACTIC_WEIGHTS = {
        "balanced":   { pass: 1.0, goal: 1.0, tackle: 1.0 },
        "possession": { pass: 2.5, goal: 1.1, tackle: 0.7 },
        "counter":    { pass: 0.8, goal: 2.2, tackle: 0.9 },
        "press":      { pass: 0.7, goal: 1.0, tackle: 2.5 }
    };

    function getPlayerScoreWithTactic(stat, tacticType) {
        if (!stat) return 10;
        const weights = TACTIC_WEIGHTS[tacticType] || TACTIC_WEIGHTS["balanced"];
        const mins = parseFloat(String(stat["출전시간(분)_출전시간(분)"] || "0").replace(/,/g, '')) || 0;
        const goals = parseFloat(String(stat["득점_득점"] || "0").replace(/,/g, '')) || 0;
        const assists = parseFloat(String(stat["도움_도움"] || "0").replace(/,/g, '')) || 0;
        const passes = parseFloat(String(stat["패스_성공%"] || "0").replace(/,/g, '')) || 0;
        const tackles = parseFloat(String(stat["태클_성공"] || "0").replace(/,/g, '')) || 0;
        const keyPass = parseFloat(String(stat["키패스_키패스"] || "0").replace(/,/g, '')) || 0;

        return (mins * 0.05) + (goals * 40 * weights.goal) + (assists * 30) + (keyPass * 2 * weights.pass) + (tackles * 2 * weights.tackle) + (passes * 0.3 * weights.pass);
    }

    let homePlayers = [];
    let awayPlayers = [];
    let ball = new Ball(PITCH_WIDTH / 2, PITCH_HEIGHT / 2);
    let matchStats = { home: {}, away: {} };

    function initMatchStats(playersArray, isHome) {
        const targetObj = isHome ? matchStats.home : matchStats.away;
        playersArray.forEach(p => {
            targetObj[p.name] = { goals: 0, shots: 0, passes: 0, successPasses: 0 };
        });
    }

    let matchTimerInterval = null;
    let matchSeconds = 0;
    let isTimerRunning = false;

    function startMatchTimer() {
        const timerElement = document.getElementById('match-timer');
        if (matchTimerInterval) clearInterval(matchTimerInterval);

        isTimerRunning = true;
        matchTimerInterval = setInterval(() => {
            if (isPlaying) {
                matchSeconds++;
                const timeResult = ruleEngine.updateMatchTime();
                if (timeResult.halfEnded || timeResult.matchEnded) {
                    const logs = document.getElementById('match-logs');
                    if (logs) {
                        logs.innerHTML += `<div>[${document.getElementById('match-timer').innerText}] ${timeResult.message}</div>`;
                        logs.scrollTop = logs.scrollHeight;
                    }
                }

                const mins = String(Math.floor(matchSeconds / 60)).padStart(2, '0');
                const secs = String(matchSeconds % 60).padStart(2, '0');
                if (timerElement) timerElement.innerText = `${mins}:${secs}`;
            }
        }, 1000);
    }

    function stopMatchTimer() {
        if (matchTimerInterval) clearInterval(matchTimerInterval);
        isTimerRunning = false;
        const timerElement = document.getElementById('match-timer');
        const finalTimeText = timerElement ? timerElement.innerText : '00:00';
        return `${Math.floor(matchSeconds / 60)}분 ${matchSeconds % 60}초 (${finalTimeText})`;
    }

    function updateTeamOptions(leagueSelect, teamSelect) {
        if (!leagueSelect || !teamSelect) return;
        const selectedLeague = leagueSelect.value;
        const teams = LEAGUE_DATA[selectedLeague] || [];
        teamSelect.innerHTML = '';
        teams.forEach(team => {
            const opt = document.createElement('option');
            opt.value = team;
            opt.textContent = team;
            teamSelect.appendChild(opt);
        });
    }

    function updateScoreboardTeam(isHome) {
        const leagueSelect = isHome ? homeLeagueSelect : awayLeagueSelect;
        const teamSelect = isHome ? homeTeamSelect : awayTeamSelect;
        const nameEl = isHome ? homeTeamNameEl : awayTeamNameEl;
        const logoEl = isHome ? homeLogoEl : awayLogoEl;
        
        if (!leagueSelect || !teamSelect) return;
        const selectedLeague = leagueSelect.value;
        const selectedTeamName = teamSelect.value;

        if (nameEl) nameEl.textContent = selectedTeamName || (isHome ? "홈팀" : "어웨이팀");
        if (selectedTeamName && logoEl && staticBaseUrl) {
            logoEl.src = `${staticBaseUrl}${selectedLeague}/구단마크/${selectedTeamName}.png`;
            logoEl.style.display = 'block';
            logoEl.onerror = () => { logoEl.style.display = 'none'; };
        }
    }

    function drawRadarChart(metrics) {
        const rCanvas = document.getElementById('radarCanvas');
        if (!rCanvas) return;
        const rCtx = rCanvas.getContext('2d');
        const w = rCanvas.width;
        const h = rCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const radius = 60;

        rCtx.clearRect(0, 0, w, h);
        const total = metrics.length;

        for (let level = 1; level <= 4; level++) {
            rCtx.beginPath();
            rCtx.strokeStyle = '#333';
            rCtx.lineWidth = 1;
            const curR = (radius / 4) * level;
            for (let i = 0; i < total; i++) {
                const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
                const x = cx + curR * Math.cos(angle);
                const y = cy + curR * Math.sin(angle);
                if (i === 0) rCtx.moveTo(x, y);
                else rCtx.lineTo(x, y);
            }
            rCtx.closePath();
            rCtx.stroke();
        }

        rCtx.font = '10px sans-serif';
        rCtx.fillStyle = '#bbb';
        rCtx.textAlign = 'center';
        rCtx.textBaseline = 'middle';

        const points = [];
        metrics.forEach((m, i) => {
            const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
            rCtx.beginPath();
            rCtx.strokeStyle = '#333';
            rCtx.moveTo(cx, cy);
            rCtx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
            rCtx.stroke();

            const labelR = radius + 18;
            const lx = cx + labelR * Math.cos(angle);
            const ly = cy + labelR * Math.sin(angle);
            rCtx.fillText(m.label, lx, ly);

            const ratio = Math.min(1, Math.max(0, m.val / m.max));
            const px = cx + radius * ratio * Math.cos(angle);
            const py = cy + radius * ratio * Math.sin(angle);
            points.push({ x: px, y: py });
        });

        rCtx.beginPath();
        points.forEach((p, i) => {
            if (i === 0) rCtx.moveTo(p.x, p.y);
            else rCtx.lineTo(p.x, p.y);
        });
        rCtx.closePath();
        rCtx.fillStyle = 'rgba(25, 118, 210, 0.4)';
        rCtx.fill();
        rCtx.strokeStyle = '#1976d2';
        rCtx.lineWidth = 2;
        rCtx.stroke();

        points.forEach(p => {
            rCtx.beginPath();
            rCtx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            rCtx.fillStyle = '#90caf9';
            rCtx.fill();
        });
    }

    function openPlayerModal(playerRecord, photoPath, statRecord, role) {
        if (!modal) return;
        modalThumb.src = photoPath;
        modalThumb.onerror = () => { modalThumb.src = 'https://via.placeholder.com/60/444/fff?text=' + role; };
        modalName.textContent = playerRecord.성명;
        modalSub.textContent = `No. ${playerRecord.등번 || '-'} | 포지션: ${role}`;
        modalClub.textContent = playerRecord["소속 클럽"] || "-";
        modalHW.textContent = `${playerRecord["키"] || '-'} / ${playerRecord["몸무게"] || '-'}`;
        modalBirth.textContent = playerRecord["생년월일"] || '-';

        let metrics = [
            { label: '득점', val: parseInt(statRecord["득점_득점"] || 0), max: 12 },
            { label: '도움', val: parseInt(statRecord["도움_도움"] || 0), max: 10 },
            { label: '슈팅', val: parseInt(statRecord["슈팅_슈팅"] || 0), max: 50 },
            { label: '키패스', val: parseInt(statRecord["키패스_키패스"] || 0), max: 30 },
            { label: '패스성공%', val: parseFloat(statRecord["패스_성공%"] || 0), max: 100 },
            { label: '태클성공', val: parseInt(statRecord["태클_성공"] || 0), max: 25 }
        ];

        drawRadarChart(metrics);
        modal.style.display = 'flex';
    }

    async function setupSquad(isHome) {
        const leagueSelect = isHome ? homeLeagueSelect : awayLeagueSelect;
        const teamSelect = isHome ? homeTeamSelect : awayTeamSelect;
        const formationSelect = isHome ? homeFormationSelect : awayFormationSelect;
        const tacticSelect = document.getElementById(isHome ? 'home-tactic-select' : 'away-tactic-select');
        const listEl = document.getElementById(isHome ? 'home-player-list' : 'away-player-list');
        const subListEl = document.getElementById(isHome ? 'home-sub-list' : 'away-sub-list');

        if (!listEl) return;

        const selectedLeague = leagueSelect ? leagueSelect.value : "1부리그";
        const selectedTeam = teamSelect ? teamSelect.value : (isHome ? "강원" : "광주");
        const formationKey = formationSelect ? formationSelect.value : "4-4-2";
        const selectedTactic = tacticSelect ? tacticSelect.value : "balanced";
        const presets = FORMATION_PRESETS[formationKey] || FORMATION_PRESETS["4-4-2"];
        
        listEl.innerHTML = '';
        if (subListEl) subListEl.innerHTML = '';

        let infoData = [];
        let statsData = [];

        try {
            if (dataUrlBase) {
                const infoRes = await fetch(`${dataUrlBase}${selectedLeague}/${selectedTeam}_선수정보.json`);
                if (infoRes.ok) infoData = await infoRes.json();

                const statsRes = await fetch(`${dataUrlBase}${selectedLeague}/${selectedTeam}_선수성적.json`);
                if (statsRes.ok) statsData = await statsRes.json();
            }
        } catch (e) {
            console.warn("외부 JSON 파일 로드 실패, 기본 선수 데이터로 대체합니다.", e);
        }

        if (!infoData || infoData.length === 0) {
            const positions = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW', 'GK', 'DF', 'DF', 'MF', 'MF', 'FW', 'FW'];
            infoData = positions.map((pos, idx) => ({
                "성명": `${selectedTeam}선수${idx+1}`,
                "등번": `${idx+1}`,
                "포지션": pos,
                "소속 클럽": selectedTeam,
                "키": "180cm", "몸무게": "75kg", "생년월일": "2000-01-01"
            }));
        }

        infoData.forEach(player => {
            const stat = statsData.find(s => s.선수명_선수명 === player.성명) || {};
            player.score = getPlayerScoreWithTactic(stat, selectedTactic);
            player.stat = stat;
        });

        const pool = {
            'GK': infoData.filter(p => p.포지션 === 'GK').sort((a, b) => b.score - a.score),
            'DF': infoData.filter(p => p.포지션 === 'DF').sort((a, b) => b.score - a.score),
            'MF': infoData.filter(p => p.포지션 === 'MF').sort((a, b) => b.score - a.score),
            'FW': infoData.filter(p => p.포지션 === 'FW').sort((a, b) => b.score - a.score)
        };

        ['GK', 'DF', 'MF', 'FW'].forEach(pos => {
            if (!pool[pos]) pool[pos] = [];
            while(pool[pos].length < 5) {
                pool[pos].push({ "성명": `${selectedTeam}_${pos}_${pool[pos].length+1}`, "등번": `${Math.floor(Math.random()*90)+10}`, "포지션": pos, "소속 클럽": selectedTeam, "score": 50 });
            }
        });

        const squad = [];
        const color = isHome ? '#ff5252' : '#448aff';
        const selectedNames = new Set();
        const availablePool = {
            'GK': [...pool['GK']], 'DF': [...pool['DF']], 'MF': [...pool['MF']], 'FW': [...pool['FW']]
        };

        presets.forEach((slot, idx) => {
            const role = slot.pos;
            let playerRecord = availablePool[role].shift() || pool[role][0] || { "성명": `선수${idx+1}`, "등번": `${idx+1}`, "포지션": role };
            selectedNames.add(playerRecord.성명);

            const statRecord = playerRecord.stat || {};
            let posX = slot.x;
            let posY = slot.y;
            if (!isHome) posX = PITCH_WIDTH - slot.x;

            const photoPath = staticBaseUrl ? `${staticBaseUrl}${selectedLeague}/${selectedTeam}/${playerRecord.성명}.png` : '';
            // 📌 PlayerController 인스턴스 생성 호출
            squad.push(new PlayerController(posX, posY, color, playerRecord.등번 || idx+1, playerRecord.성명, role, photoPath, isHome));

            const card = document.createElement('div');
            card.className = `player-card ${isHome ? '' : 'away'}`;
            card.innerHTML = `
                <img src="${photoPath}" class="player-thumb" onerror="this.src='https://via.placeholder.com/36/444/fff?text=${role}'">
                <div class="player-info">
                    <div class="player-main-text">No.${playerRecord.등번 || idx+1} ${playerRecord.성명} (${role})</div>
                    <div class="player-sub-text">적합도: ${Math.round(playerRecord.score || 0)}점</div>
                </div>
                <span class="badge-pos pos-${role.toLowerCase()}">선발</span>
            `;
            card.addEventListener('click', () => { openPlayerModal(playerRecord, photoPath, statRecord, role); });
            listEl.appendChild(card);
        });

        if (subListEl) {
            const subReqs = { 'GK': 1, 'DF': 2, 'MF': 2, 'FW': 2 };
            Object.keys(subReqs).forEach(pos => {
                const candidates = (pool[pos] || []).filter(p => !selectedNames.has(p.성명));
                candidates.slice(0, subReqs[pos]).forEach(subP => {
                    selectedNames.add(subP.성명);
                    const subStat = subP.stat || {};
                    const subPhotoPath = staticBaseUrl ? `${staticBaseUrl}${selectedLeague}/${selectedTeam}/${subP.성명}.png` : '';

                    const subCard = document.createElement('div');
                    subCard.className = `player-card substitute ${isHome ? '' : 'away'}`;
                    subCard.innerHTML = `
                        <img src="${subPhotoPath}" class="player-thumb" onerror="this.src='https://via.placeholder.com/36/444/fff?text=${pos}'">
                        <div class="player-info">
                            <div class="player-main-text">No.${subP.등번 || '0'} ${subP.성명} (${pos})</div>
                            <div class="player-sub-text">후보 | 적합도: ${Math.round(subP.score || 0)}점</div>
                        </div>
                        <span class="badge-pos pos-${pos.toLowerCase()}">후보</span>
                    `;
                    subCard.addEventListener('click', () => { openPlayerModal(subP, subPhotoPath, subStat, pos); });
                    subListEl.appendChild(subCard);
                });
            });
        }

        if (isHome) homePlayers = squad;
        else awayPlayers = squad;
    }

    updateTeamOptions(homeLeagueSelect, homeTeamSelect);
    updateTeamOptions(awayLeagueSelect, awayTeamSelect);
    if (awayLeagueSelect) awayLeagueSelect.value = "2부리그";
    updateTeamOptions(awayLeagueSelect, awayTeamSelect);

    updateScoreboardTeam(true);
    updateScoreboardTeam(false);

    Promise.all([setupSquad(true), setupSquad(false)]).catch(err => {
        console.error("스쿼드 초기화 오류:", err);
    });

    if (homeLeagueSelect) homeLeagueSelect.addEventListener('change', () => { updateTeamOptions(homeLeagueSelect, homeTeamSelect); updateScoreboardTeam(true); setupSquad(true); });
    if (homeTeamSelect) homeTeamSelect.addEventListener('change', () => { updateScoreboardTeam(true); setupSquad(true); });
    if (homeFormationSelect) homeFormationSelect.addEventListener('change', () => setupSquad(true));
    if (homeTacticSelect) homeTacticSelect.addEventListener('change', () => setupSquad(true));

    if (awayLeagueSelect) awayLeagueSelect.addEventListener('change', () => { 
    updateTeamOptions(awayLeagueSelect, awayTeamSelect); // 📌 두 번째 인자를 awayTeamSelect로 정확히 지정
    updateScoreboardTeam(false); 
    setupSquad(false); 
});
    if (awayTeamSelect) awayTeamSelect.addEventListener('change', () => { updateScoreboardTeam(false); setupSquad(false); });
    if (awayFormationSelect) awayFormationSelect.addEventListener('change', () => setupSquad(false));
    if (awayTacticSelect) awayTacticSelect.addEventListener('change', () => setupSquad(false));

    let isPlaying = false;
    const bgImageInput = document.getElementById('bg-img-path');
    const pitchImage = new Image();
    let imageLoaded = false;
    
    if (bgImageInput && bgImageInput.value) {
        pitchImage.src = bgImageInput.value;
        pitchImage.onload = () => { imageLoaded = true; };
        pitchImage.onerror = () => { imageLoaded = false; };
    }

    // ⚽ 메인 애니메이션 루프 (킥오프 백패스 및 골키퍼 킥 연동 완충판)
    function animate() {
        if (!ctx) return;
        ctx.clearRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);
        
        // 1. 경기장 그리기 (이미지 미로드 시 초록색 그라운드 Fallback)
        if (imageLoaded) {
            ctx.drawImage(pitchImage, 0, 0, PITCH_WIDTH, PITCH_HEIGHT);
        } else {
            ctx.fillStyle = '#1b5e20';
            ctx.fillRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(PITCH_WIDTH / 2, 0);
            ctx.lineTo(PITCH_WIDTH / 2, PITCH_HEIGHT);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(PITCH_WIDTH / 2, PITCH_HEIGHT / 2, 70, 0, Math.PI * 2);
            ctx.stroke();
        }

        const allPlayers = [...homePlayers, ...awayPlayers];

        if (isPlaying) {
            // 📌 [규칙 1] 공이 센터서클 부근을 벗어나거나 누군가 소유하여 움직이면 킥오프 페이즈 해제
            if (Math.abs(ball.x - PITCH_WIDTH / 2) > 50 || ball.possessor !== null) {
                isKickOffPhase = false;
            }

            // 📌 [규칙 2] 공과 가장 가까운 선수 탐색 및 공 소유권 판정
            let closestPlayer = allPlayers[0];
            let minDescDist = Infinity;

            allPlayers.forEach(p => {
                let dist = Math.hypot(ball.x - p.x, ball.y - p.y);
                if (dist < minDescDist) {
                    minDescDist = dist;
                    closestPlayer = p;
                }
            });

            // 킥오프 진행 중이 아닐 때만 30px 이내 접근 시 공 소유
            if (minDescDist < 30 && !ball.possessor && !isKickOffPhase) {
                ball.possessor = closestPlayer;
                lastTouchIsHome = closestPlayer.isHome;
            }

            // 📌 [규칙 3] 슈팅 시도 처리 (상대 골대 160px 이내 접근 시)
            if (ball.possessor) {
                let passer = ball.possessor;
                let targetGoalX = passer.isHome ? PITCH_WIDTH - 80 : 80;
                
                if (Math.hypot(targetGoalX - passer.x, (PITCH_HEIGHT / 2) - passer.y) < 160) {
                    ball.vx = passer.isHome ? 12 : -12;
                    ball.vy = (Math.random() - 0.5) * 5;
                    ball.isAerial = true;
                    ball.z = 8;
                    ball.vz = 2.5;
                    ball.possessor = null; // 슈팅 후 소유 해제
                }
            }
        }

        // 2. 모든 선수의 AI 및 위치 일괄 갱신 (isKickOffPhase 전달)
        allPlayers.forEach(player => {
            player.update(ball, allPlayers, PITCH_WIDTH, PITCH_HEIGHT, isPlaying, isKickOffPhase);
        });

        // 3. 규칙 엔진을 통한 공 물리 및 득점/아웃 판정
        if (isPlaying) {
            ball = ruleEngine.updateBallPhysics(ball);

            const outcome = ruleEngine.checkBallOutAndOutcome(ball.x, ball.y, lastTouchIsHome);
            if (outcome.status === 'GOAL') {
                if (outcome.team === 'HOME') {
                    homeGoalsTotal++;
                    if (homeScoreEl) homeScoreEl.textContent = homeGoalsTotal;
                } else {
                    awayGoalsTotal++;
                    if (awayScoreEl) awayScoreEl.textContent = awayGoalsTotal;
                }

                const logs = document.getElementById('match-logs');
                if (logs) {
                    logs.innerHTML += `<div>[${document.getElementById('match-timer').innerText}] ⚽ <strong>[공식 득점 성립!]</strong> ${outcome.team}팀 골 성공! (${homeGoalsTotal}:${awayGoalsTotal})</div>`;
                    logs.scrollTop = logs.scrollHeight;
                }

                // 득점 후 정중앙 센터서클 킥오프 상태로 재정치
                ball.x = outcome.restartX;
                ball.y = outcome.restartY;
                ball.vx = 0; ball.vy = 0; ball.z = 0;
                ball.possessor = null;
                isKickOffPhase = true; // 득점 후 킥오프 백패스 모드 재활성화
            } else if (outcome.status === 'BALL_OUT_TOUCHLINE' || outcome.status === 'BALL_OUT_GOAL_LINE') {
                ball.x = outcome.restartX;
                ball.y = outcome.restartY;
                ball.vx = 0; ball.vy = 0; ball.z = 0;
                ball.possessor = null;
            }
        }

        // 4. 공 소유 시 공의 위치를 선수 발 앞으로 동기화
        if (ball.possessor) {
            ball.x = ball.possessor.x + (ball.possessor.isHome ? 12 : -12);
            ball.y = ball.possessor.y;
            ball.z = 0;
            ball.vx = 0; ball.vy = 0;
        }

        // 5. Y축 정렬 Depth 렌더링
        let renderList = [...allPlayers, ball];
        renderList.sort((a, b) => a.y - b.y);
        renderList.forEach(obj => {
            if (obj instanceof Ball || (obj.constructor && obj.constructor.name === 'Ball')) {
                obj.draw(ctx);
            } else {
                obj.draw(ctx, ball.possessor === obj);
            }
        });

        requestAnimationFrame(animate);
    }

    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            isPlaying = !isPlaying;
            btnStart.innerText = isPlaying ? '경기 일시정지' : '경기 시작';
            if (isPlaying) {
                if (!isTimerRunning) startMatchTimer();
                if (matchSeconds === 0) {
                    homeGoalsTotal = 0; awayGoalsTotal = 0;
                    if (homeScoreEl) homeScoreEl.textContent = '0';
                    if (awayScoreEl) awayScoreEl.textContent = '0';
                    initMatchStats(homePlayers, true);
                    initMatchStats(awayPlayers, false);
                    const logs = document.getElementById('match-logs');
                    if (logs) logs.innerHTML += `<div>[00:00] 주심의 휘슬과 함께 경기가 시작되었습니다!</div>`;
                }
            }
        });
    }

    const btnEnd = document.getElementById('btn-end');
    if (btnEnd) {
        btnEnd.addEventListener('click', async () => {
            isPlaying = false;
            if (btnStart) btnStart.innerText = '경기 시작';
            const finalPlayTime = stopMatchTimer();

            const homeLeague = homeLeagueSelect ? homeLeagueSelect.value : "1부리그";
            const awayLeague = awayLeagueSelect ? awayLeagueSelect.value : "2부리그";
            const homeTeamName = homeTeamSelect ? homeTeamSelect.value : "강원";
            const awayTeamName = awayTeamSelect ? awayTeamSelect.value : "광주";

            async function fetchTeamStatsJson(league, teamName) {
                try {
                    const res = await fetch(`${dataUrlBase}${league}/${teamName}_구단성적.json`);
                    if (res.ok) {
                        const data = await res.json();
                        return data.find(item => item["년도_년도"] === "계") || data[0];
                    }
                } catch (e) {
                    console.warn(`구단 성적 로드 실패`, e);
                }
                return null;
            }

            const homeRecord = await fetchTeamStatsJson(homeLeague, homeTeamName);
            const awayRecord = await fetchTeamStatsJson(awayLeague, awayTeamName);

            function getVal(rec, key, fallback) {
                if (!rec || !rec[key]) return fallback;
                return parseFloat(String(rec[key]).replace(/,/g, '')) || fallback;
            }

            const homeMetrics = {
                goals: homeGoalsTotal > 0 ? homeGoalsTotal : getVal(homeRecord, "득점_득점", 40),
                shots: getVal(homeRecord, "슈팅_슈팅", 430),
                sog: getVal(homeRecord, "유효 슈팅_유효 슈팅", 148),
                passRate: getVal(homeRecord, "패스_성공%", 80.8),
                keyPass: getVal(homeRecord, "키패스_키패스", 310),
                crossRate: getVal(homeRecord, "크로스_성공%", 21.2),
                tackle: getVal(homeRecord, "태클_성공", 226),
                intercept: getVal(homeRecord, "인터셉트_인터셉트", 333)
            };

            const awayMetrics = {
                goals: awayGoalsTotal > 0 ? awayGoalsTotal : getVal(awayRecord, "득점_득점", 31),
                shots: getVal(awayRecord, "슈팅_슈팅", 316),
                sog: getVal(awayRecord, "유효 슈팅_유효 슈팅", 113),
                passRate: getVal(awayRecord, "패스_성공%", 85.0),
                keyPass: getVal(awayRecord, "키패스_키패스", 237),
                crossRate: getVal(awayRecord, "크로스_성공%", 23.3),
                tackle: getVal(awayRecord, "태클_성공", 184),
                intercept: getVal(awayRecord, "인터셉트_인터셉트", 266)
            };

            function findMVP(playersArray, statsObj) {
                if (!playersArray || playersArray.length === 0) return { name: "미등록", number: "0" };
                let bestP = playersArray[0];
                let maxScore = -1;
                playersArray.forEach(p => {
                    const st = statsObj && statsObj[p.name] ? statsObj[p.name] : { goals: 0, shots: 1 };
                    const score = (st.goals * 50) + (st.shots * 10);
                    if (score > maxScore) { maxScore = score; bestP = p; }
                });
                return bestP;
            }

            const homeMVP = findMVP(homePlayers, matchStats.home);
            const awayMVP = findMVP(awayPlayers, matchStats.away);

            const hEmblem = document.getElementById('modal-home-emblem');
            if (hEmblem) { hEmblem.src = `${staticBaseUrl}${homeLeague}/구단마크/${homeTeamName}.png`; hEmblem.onerror = function() { this.style.display='none'; }; }
            const aEmblem = document.getElementById('modal-away-emblem');
            if (aEmblem) { aEmblem.src = `${staticBaseUrl}${awayLeague}/구단마크/${awayTeamName}.png`; aEmblem.onerror = function() { this.style.display='none'; }; }

            const hNameEl = document.getElementById('modal-home-name');
            if (hNameEl) hNameEl.textContent = homeTeamName;
            const aNameEl = document.getElementById('modal-away-name');
            if (aNameEl) aNameEl.textContent = awayTeamName;

            const hMvpName = document.getElementById('home-mvp-name');
            if (hMvpName) hMvpName.textContent = `${homeMVP.name} (No.${homeMVP.number})`;
            const aMvpName = document.getElementById('away-mvp-name');
            if (aMvpName) aMvpName.textContent = `${awayMVP.name} (No.${awayMVP.number})`;

            const hMvpThumb = document.getElementById('home-mvp-thumb');
            if (hMvpThumb) { hMvpThumb.src = `${staticBaseUrl}${homeLeague}/${homeTeamName}/${homeMVP.name}.png`; hMvpThumb.onerror = function() { this.src='https://via.placeholder.com/42/444/fff?text=MVP'; }; }
            const aMvpThumb = document.getElementById('away-mvp-thumb');
            if (aMvpThumb) { aMvpThumb.src = `${staticBaseUrl}${awayLeague}/${awayTeamName}/${awayMVP.name}.png`; aMvpThumb.onerror = function() { this.src='https://via.placeholder.com/42/444/fff?text=MVP'; }; }

            function updateCompareBar(key, hVal, aVal, isPct = false) {
                const max = Math.max(hVal, aVal, 1);
                const hPct = Math.round((hVal / max) * 100);
                const aPct = Math.round((aVal / max) * 100);

                const hVEl = document.getElementById(`home-val-${key}`);
                const aVEl = document.getElementById(`away-val-${key}`);
                const hBEl = document.getElementById(`home-bar-${key}`);
                const aBEl = document.getElementById(`away-bar-${key}`);

                if (hVEl) hVEl.textContent = hVal + (isPct ? '%' : '');
                if (aVEl) aVEl.textContent = aVal + (isPct ? '%' : '');
                if (hBEl) hBEl.style.width = hPct + '%';
                if (aBEl) aBEl.style.width = aPct + '%';
            }

            updateCompareBar('goal', homeMetrics.goals, awayMetrics.goals);
            updateCompareBar('shots', homeMetrics.shots, awayMetrics.shots);
            updateCompareBar('sog', homeMetrics.sog, awayMetrics.sog);
            updateCompareBar('pass', homeMetrics.passRate, awayMetrics.passRate, true);
            updateCompareBar('keypass', homeMetrics.keyPass, awayMetrics.keyPass);
            updateCompareBar('cross', homeMetrics.crossRate, awayMetrics.crossRate, true);
            updateCompareBar('tackle', homeMetrics.tackle, awayMetrics.tackle);
            updateCompareBar('intercept', homeMetrics.intercept, awayMetrics.intercept);

            const reportTime = document.getElementById('report-match-time');
            if (reportTime) reportTime.textContent = finalPlayTime;

            const logs = document.getElementById('match-logs');
            if (logs) {
                logs.innerHTML += `<div>[종료] 소요시간: ${finalPlayTime} | 스코어 (${homeGoalsTotal}:${awayGoalsTotal}) | 리포트 생성됨</div>`;
                logs.scrollTop = logs.scrollHeight;
            }

            if (statsModal) statsModal.style.display = 'flex';
        });
    }

    const btnNew = document.getElementById('btn-new');
    if (btnNew) {
        btnNew.addEventListener('click', () => {
            if (confirm("모든 구단 설정과 전술을 초기화하고 새로운 경기를 시작하시겠습니까?")) {
                location.reload();
            }
        });
    }

    const btnQuit = document.getElementById('btn-quit');
    if (btnQuit) {
        btnQuit.addEventListener('click', () => {
            if (confirm("게임을 종료하시겠습니까?")) {
                window.close();
                setTimeout(() => { alert("브라우저 탭을 닫아주세요."); }, 100);
            }
        });
    }

    animate();
});