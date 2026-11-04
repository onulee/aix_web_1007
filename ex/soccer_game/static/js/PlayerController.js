// ⚽ 개별 선수의 AI, 이동, 충돌 회피를 전담하는 PlayerController 클래스
class PlayerController {
    constructor(x, y, color, number, name, role, photo, isHome) {
        this.id = Math.random().toString(36).substring(2, 9);
        this.x = x; 
        this.y = y;
        this.baseX = x; // 전술 포메이션 상의 본래 X 좌표
        this.baseY = y; // 전술 포메이션 상의 본래 Y 좌표
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
        this.state = 'IDLE'; // 현재 행동 상태 (IDLE, RETURNING, CHASING, POSSESSING)
    }

    // 선수의 두뇌 및 이동을 갱신하는 핵심 메서드 (규칙 반영형)
    update(ball, allPlayers, PITCH_WIDTH, PITCH_HEIGHT, isPlaying) {
        if (!isPlaying) return;

        let targetX = this.baseX;
        let targetY = this.baseY;

        // 1. 역할(Role) 및 상황별 타겟 좌표 계산
        if (this.role === 'GK') {
            let gkX = this.isHome ? PITCH_WIDTH * 0.12 : PITCH_WIDTH * 0.88;
            targetX = gkX;
            
            // 📌 [개선] 골키퍼가 공을 직접 소유하고 있을 때: 잠시 멈춰 있다가 전방으로 빌드업 패스/킥 발사
            if (ball.possessor === this) {
                this.state = 'POSSESSING';
                // 골키퍼가 공을 잡고 2초(프레임 기준)가 지나면 앞으로 길게 찬 후 소유 해제
                if (!this.holdFrames) this.holdFrames = 0;
                this.holdFrames++;
                
                targetX = gkX;
                targetY = PITCH_HEIGHT / 2;

                if (this.holdFrames > 90) { // 약 1.5초~2초 후 킥 발사
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
                // 평소에는 골문 앞에서 공의 Y축 방어
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

        // 2. 선수 간 겹침 방지를 위한 충돌 회피 (Separation Force) 계산
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

        // 3. LERP 가속도를 이용한 부드러운 이동 처리
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

        // 4. 경기장 경계 제한 반영
        if (typeof pitchGeo !== 'undefined' && pitchGeo.getPerspectiveBounds) {
            const bounds = pitchGeo.getPerspectiveBounds(this.x);
            this.x = Math.max(bounds.left + 15, Math.min(bounds.right - 15, this.x));
            this.y = Math.max(bounds.top + 15, Math.min(bounds.bottom - 15, this.y));
        }
    }

    // 렌더링 메서드
    draw(ctx, hasBall) {
        // 입체감 그림자
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath(); 
        ctx.ellipse(this.x, this.y + 4, 8, 4, 0, 0, Math.PI * 2); 
        ctx.fill();

        // 선수 마커 (공 소유 시 주황색)
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