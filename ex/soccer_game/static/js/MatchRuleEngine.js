/**
 * ⚖️ & ⚽ IFAB 규칙 통합 + 공 물리역학(마찰력, 공중볼, 스루패스) 통합 매치 엔진
 * - 공간, 오프사이드, 반칙/카드, PK, 세트피스, 교체 및 '공의 동역학(마찰/공중볼/스루패스)' 완비
 */
class MatchRuleEngine {
    constructor(pitchGeometry, refereeStrictness = 0.5) {
        this.geo = pitchGeometry;
        this.refereeStrictness = refereeStrictness;
        
        this.matchState = {
            isLive: false,
            currentHalf: 1,
            matchTimeSeconds: 0,
            currentSetPiece: 'KICK_OFF', 
            restartingTeam: 'HOME',
            varActive: false,
            
            substitutions: {
                HOME: { usedCount: 0, stopCount: 0, substitutedOutPlayers: [] },
                AWAY: { usedCount: 0, stopCount: 0, substitutedOutPlayers: [] }
            }
        };
    }

    // ==========================================
    // ⚽ [제2조 확장] 공의 물리역학 (마찰력, 공중볼, 스루패스)
    // ==========================================

    /**
     * 1. 그라운드 마찰력 및 공중볼 포물선 궤적 계산
     * @param {Object} ball - 공 객체 { x, y, z(높이), vx, vy, vz, isAerial }
     * @param {number} deltaTime - 프레임 간 시간 변화량 (일반적으로 1)
     * @returns {Object} 업데이트된 공의 위치 및 속성
     */
    updateBallPhysics(ball, deltaTime = 1) {
        // 공중볼(Aerial) 상태인 경우 (예: 롱패스, 크로스, 슈팅)
        if (ball.isAerial && ball.z > 0) {
            ball.x += ball.vx * deltaTime;
            ball.y += ball.vy * deltaTime;
            // 중력 가속도 적용 및 포물선 하강
            ball.z += ball.vz * deltaTime;
            ball.vz -= 0.15 * deltaTime; // 중력에 의해 떨어짐

            // 바닥에 착지한 경우
            if (ball.z <= 0) {
                ball.z = 0;
                ball.isAerial = false;
                // 바닥 착지 시 바운스에 따른 감속
                ball.vx *= 0.7;
                ball.vy *= 0.7;
            }
        } else {
            // 그라운드 볼: 잔디 마찰력에 의한 감속 (Deceleration)
            const friction = 0.975; // 잔디 마찰 계수
            ball.vx *= friction;
            ball.vy *= friction;

            ball.x += ball.vx * deltaTime;
            ball.y += ball.vy * deltaTime;

            // 속도가 거의 0이면 정지
            if (Math.hypot(ball.vx, ball.vy) < 0.1) {
                ball.vx = 0;
                ball.vy = 0;
            }
        }

        return ball;
    }

    /**
     * 2. 스루패스(Through Pass) 목표 지점 계산 (침투하는 선수의 속도 벡터 예측)
     * @param {Object} passer - 패스하는 선수
     * @param {Object} receiver - 패스를 받는 침투 선수 ({ x, y, vx, vy, speed })
     * @param {number} passPower - 패스 세기
     * @returns {Object} { targetX, targetY } 공이 떨어질 미래 예측 지점
     */
    calculateThroughPassTarget(passer, receiver, passPower) {
        // 선수가 이동 중인 방향 벡터를 계산하여 미래의 위치를 예측 (Lead Passing)
        const predictionFrames = 30; // 0.5초 뒤의 위치 예측
        const predictedX = receiver.x + (receiver.vx || 0) * predictionFrames;
        const predictedY = receiver.y + (receiver.vy || 0) * predictionFrames;

        // 원근감 경계 내에 있도록 클램핑
        const bounds = this.geo.getPerspectiveBounds(predictedX);
        const clampedX = Math.max(bounds.left, Math.min(bounds.right, predictedX));
        const clampedY = Math.max(bounds.top, Math.min(bounds.bottom, predictedY));

        return {
            targetX: clampedX,
            targetY: clampedY,
            isAerial: passPower > 15 // 패스 세기가 강하면 공중볼(로빙 스루)로 전환
        };
    }

    // ==========================================
    // 🛡️ [제11조] 정밀 오프사이드 판정
    // ==========================================
    checkOffside(passer, receiver, defendingPlayers, isAttackingRight) {
        const halfwayX = this.geo.getCenterArea().halfwayX;
        if (isAttackingRight && receiver.x < halfwayX) return false;
        if (!isAttackingRight && receiver.x > halfwayX) return false;

        const outfieldDefenders = defendingPlayers.filter(p => p.role !== 'GK');
        if (outfieldDefenders.length === 0) return false;

        const sortedDefenders = [...outfieldDefenders].sort((a, b) => 
            isAttackingRight ? a.x - b.x : b.x - a.x
        );
        const secondLastDefenderX = sortedDefenders.length > 1 ? sortedDefenders[1].x : sortedDefenders[0].x;

        return isAttackingRight ? (receiver.x > secondLastDefenderX) : (receiver.x < secondLastDefenderX);
    }

    // ==========================================
    // ⚡ [제12조 & 제14조] 반칙, 카드 및 페널티킥 판정
    // ==========================================
    evaluateFoulAndMisconduct(attacker, defender, isHomeAttacking) {
        const baseFoulChance = 0.12 + (this.refereeStrictness * 0.12);
        const isFoul = Math.random() < baseFoulChance;

        if (!isFoul) {
            return { isFoul: false, isYellow: false, isRed: false, isPenalty: false };
        }

        if (Math.random() < 0.20) {
            return { isFoul: true, isAdvantage: true, message: "어드밴티지 적용!" };
        }

        const isPenaltyBox = this.geo.isInsidePenaltyBox(defender.x, defender.y, isHomeAttacking);
        const cardRoll = Math.random();
        let isYellow = cardRoll < 0.30;
        let isRed = (cardRoll >= 0.30 && cardRoll < 0.35);

        return {
            isFoul: true,
            isAdvantage: false,
            isYellow: isYellow,
            isRed: isRed,
            isPenalty: isPenaltyBox,
            setPiece: isPenaltyBox ? 'PENALTY_KICK' : 'DIRECT_FREE_KICK',
            awardedTeam: isHomeAttacking ? 'HOME' : 'AWAY'
        };
    }

    // ==========================================
    // 🎯 [제14조] 페널티킥(PK) 심리전
    // ==========================================
    executePenaltyKick(kickerSkill = 80, gkSkill = 80) {
        const successProbability = 0.75 + ((kickerSkill - gkSkill) * 0.003);
        const isGoal = Math.random() < Math.min(0.95, Math.max(0.30, successProbability));
        return {
            isGoal: isGoal,
            resultText: isGoal ? "⚽ 페널티킥 성공!" : "❌ 골키퍼의 완벽한 페널티킥 선방!"
        };
    }

    // ==========================================
    // 👥 [제3조] 정밀 선수 교체 관리 시스템
    // ==========================================
    processSubstitution(teamKey, playerOut, playerIn) {
        const teamSubs = this.matchState.substitutions[teamKey];

        if (teamSubs.usedCount >= 5) {
            return { success: false, message: "❌ 교체 실패: 교체 인원을 모두 소모했습니다 (최대 5명)." };
        }
        if (teamSubs.stopCount >= 3 && this.matchState.currentHalf <= 2) {
            return { success: false, message: "❌ 교체 실패: 경기 중단 횟수를 모두 소모했습니다 (최대 3회)." };
        }
        if (teamSubs.substitutedOutPlayers.includes(playerOut.id)) {
            return { success: false, message: "❌ 교체 실패: 이미 그라운드를 떠난 선수는 재교체할 수 없습니다." };
        }

        teamSubs.usedCount++;
        teamSubs.stopCount++;
        teamSubs.substitutedOutPlayers.push(playerOut.id);

        return {
            success: true,
            message: `🔄 선수 교체 완료 [${teamKey}]: OUT #${playerOut.id} ➔ IN #${playerIn.id}`,
            remainingSubs: 5 - teamSubs.usedCount,
            remainingStops: 3 - teamSubs.stopCount
        };
    }

    // ==========================================
    // ⚽ [제9조, 제10조, 제15~17조] 인/아웃 및 세트피스 재개 좌표 설정
    // ==========================================
    checkBallOutAndOutcome(ballX, ballY, lastTouchIsHome) {
        const bounds = this.geo.getPerspectiveBounds(ballX);
        const goals = this.geo.getGoalCoordinates();
        const center = this.geo.getCenterArea();

        if (ballX >= goals.away.x && ballY >= goals.away.yMin && ballY <= goals.away.yMax) {
            this.matchState.currentSetPiece = 'KICK_OFF';
            this.matchState.restartingTeam = 'AWAY';
            return { status: 'GOAL', team: 'HOME', restartX: center.centerSpot.x, restartY: center.centerSpot.y };
        }
        if (ballX <= goals.home.x && ballY >= goals.home.yMin && ballY <= goals.home.yMax) {
            this.matchState.currentSetPiece = 'KICK_OFF';
            this.matchState.restartingTeam = 'HOME';
            return { status: 'GOAL', team: 'AWAY', restartX: center.centerSpot.x, restartY: center.centerSpot.y };
        }

        if (ballY <= bounds.top || ballY >= bounds.bottom) {
            this.matchState.currentSetPiece = 'THROW_IN';
            const throwingTeam = lastTouchIsHome ? 'AWAY' : 'HOME';
            this.matchState.restartingTeam = throwingTeam;
            return { 
                status: 'BALL_OUT_TOUCHLINE', 
                restartBy: throwingTeam,
                restartX: ballX,
                restartY: ballY <= bounds.top ? bounds.top : bounds.bottom
            };
        }

        if (ballX <= bounds.left || ballX >= bounds.right) {
            const isRightSide = ballX >= bounds.right;
            if (isRightSide) {
                if (lastTouchIsHome) {
                    this.matchState.currentSetPiece = 'CORNER_KICK';
                    this.matchState.restartingTeam = 'AWAY';
                    return { status: 'BALL_OUT_GOAL_LINE', restartBy: 'CORNER_KICK_AWAY', restartX: bounds.right, restartY: ballY < center.centerY ? bounds.top : bounds.bottom };
                } else {
                    this.matchState.currentSetPiece = 'GOAL_KICK';
                    this.matchState.restartingTeam = 'HOME';
                    return { status: 'BALL_OUT_GOAL_LINE', restartBy: 'GOAL_KICK_HOME', restartX: goals.away.x - 30, restartY: center.centerY };
                }
            } else {
                if (lastTouchIsHome) {
                    this.matchState.currentSetPiece = 'GOAL_KICK';
                    this.matchState.restartingTeam = 'AWAY';
                    return { status: 'BALL_OUT_GOAL_LINE', restartBy: 'GOAL_KICK_AWAY', restartX: goals.home.x + 30, restartY: center.centerY };
                } else {
                    this.matchState.currentSetPiece = 'CORNER_KICK';
                    this.matchState.restartingTeam = 'HOME';
                    return { status: 'BALL_OUT_GOAL_LINE', restartBy: 'CORNER_KICK_HOME', restartX: bounds.left, restartY: ballY < center.centerY ? bounds.top : bounds.bottom };
                }
            }
        }

        return { status: 'IN_PLAY' };
    }

    // ==========================================
    // 📺 [제6조] VAR 판독
    // ==========================================
    triggerVARCheck() {
        this.matchState.varActive = true;
        const isOverturned = Math.random() < 0.20;
        return { checked: true, overturned: isOverturned, message: `📺 VAR 판독: ${isOverturned ? '판정 번복!' : '원심 유지'}` };
    }

    // ==========================================
    // ⏱️ [제7조 & 제8조] 경기 시간 관리
    // ==========================================
    updateMatchTime() {
        this.matchState.matchTimeSeconds++;
        const totalSec = this.matchState.matchTimeSeconds;
        const halfTimeSec = 45 * 60;

        if (totalSec === halfTimeSec && this.matchState.currentHalf === 1) {
            this.matchState.currentHalf = 2;
            this.matchState.currentSetPiece = 'KICK_OFF';
            this.matchState.substitutions.HOME.stopCount = 0;
            this.matchState.substitutions.AWAY.stopCount = 0;
            return { halfEnded: true, message: "전반전 종료 휴식 시간" };
        } else if (totalSec >= halfTimeSec * 2) {
            return { matchEnded: true, message: "정규 시간 경기 종료" };
        }
        return { halfEnded: false, matchEnded: false };
    }
}