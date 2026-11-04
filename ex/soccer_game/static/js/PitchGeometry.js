/**
 * 🏟️ 국제 축구 표준 규격 및 원근감(사다리꼴) 매핑 클래스
 * - 한번 정의된 후 규칙 변경 전까지 유지되는 영구 지오메트리 설정 관리
 */
class PitchGeometry {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.centerX = canvasWidth / 2;
        this.centerY = canvasHeight / 2;

        // 캔버스 기준 기본 좌우 끝단 X 좌표
        this.baseLeft = Math.round(canvasWidth * 0.076);
        this.baseRight = Math.round(canvasWidth * 0.924);
    }

    /**
     * 1. 원근감(사다리꼴)이 반영된 X 위치별 동적 Y축 경계선 계산
     * @param {number} x - 선수의 현재 X 좌표
     * @returns {Object} { left, right, top, bottom }
     */
    getPerspectiveBounds(x) {
        const distanceFromCenter = (x - this.centerX) / this.centerX; // -1.0 (좌측 끝) ~ 1.0 (우측 끝)
        
        const centerTop = this.height * 0.092;
        const centerBottom = this.height * 0.907;
        const edgeTop = this.height * 0.18;   // 골대 쪽으로 갈수록 좁아지는 상단
        const edgeBottom = this.height * 0.82; // 골대 쪽으로 갈수록 좁아지는 하단

        const factor = Math.abs(distanceFromCenter);
        const currentTop = centerTop + (edgeTop - centerTop) * factor;
        const currentBottom = centerBottom + (edgeBottom - centerBottom) * factor;

        return {
            left: this.baseLeft,
            right: this.baseRight,
            top: Math.round(currentTop),
            bottom: Math.round(currentBottom)
        };
    }

    /**
     * 2. 중앙선 및 센터 서클 정보 반환
     */
    getCenterArea() {
        return {
            halfwayX: this.centerX,
            centerSpot: { x: this.centerX, y: this.centerY },
            circleRadius: this.height * 0.15
        };
    }

    /**
     * 3. 양팀 골대 위치 및 유효 득점 Y축 범위 반환 (득점 판정용)
     */
    getGoalCoordinates() {
        return {
            home: { // 왼쪽 골대 (홈진영)
                x: this.baseLeft,
                yMin: this.height * 0.42,
                yMax: this.height * 0.58
            },
            away: { // 오른쪽 골대 (원정진영)
                x: this.baseRight,
                yMin: this.height * 0.42,
                yMax: this.height * 0.58
            }
        };
    }

    /**
     * 4. 페널티 박스 (18야드) 구역 좌표 반환 (파울/PK 판정용)
     */
    getPenaltyBoxes() {
        const boxWidth = (this.baseRight - this.baseLeft) * 0.16;
        const boxHeight = (this.height * 0.907 - this.height * 0.092) * 0.5;

        return {
            home: {
                xMin: this.baseLeft,
                xMax: this.baseLeft + boxWidth,
                yMin: this.centerY - boxHeight / 2,
                yMax: this.centerY + boxHeight / 2
            },
            away: {
                xMin: this.baseRight - boxWidth,
                xMax: this.baseRight,
                yMin: this.centerY - boxHeight / 2,
                yMax: this.centerY + boxHeight / 2
            }
        };
    }

    /**
     * 5. [판정 로직] 공이 골대에 명중하여 득점(Goal)인지 체크
     * @param {number} ballX - 공의 X 좌표
     * @param {number} ballY - 공의 Y 좌표
     * @param {boolean} isShootingToRight - 오른쪽 방향(어웨이 골대)으로 슈팅했는지 여부
     */
    checkGoal(ballX, ballY, isShootingToRight) {
        const goals = this.getGoalCoordinates();
        if (isShootingToRight) {
            // 어웨이 골대(오른쪽)로 향하는 슈팅
            return ballX >= goals.away.x && ballY >= goals.away.yMin && ballY <= goals.away.yMax;
        } else {
            // 홈 골대(왼쪽)로 향하는 슈팅
            return ballX <= goals.home.x && ballY >= goals.home.yMin && ballY <= goals.home.yMax;
        }
    }

    /**
     * 6. [판정 로직] 특정 위치가 페널티 박스 내부인지 체크
     * @param {number} x 
     * @param {number} y 
     * @param {boolean} isHomeAttacking - 홈팀이 공격 중인지 여부 (True면 상대인 어웨이 박스 판정)
     */
    isInsidePenaltyBox(x, y, isHomeAttacking) {
        const boxes = this.getPenaltyBoxes();
        const target = isHomeAttacking ? boxes.away : boxes.home;
        return x >= target.xMin && x <= target.xMax && y >= target.yMin && y <= target.yMax;
    }

    /**
     * 7. [판정 로직] 오프사이드 라인 계산 (뒤에서 두 번째 수비수 X 좌표 추적)
     * @param {Array} defendingPlayers - 수비 팀 필드플레이어 배열
     * @param {boolean} isAttackingRight - 공격 팀이 오른쪽으로 전진 중인지 여부
     */
    calculateOffsideLine(defendingPlayers, isAttackingRight) {
        if (!defendingPlayers || defendingPlayers.length === 0) return this.centerX;

        // 골키퍼를 제외한 필드 수비수들만 추출
        const outfield = defendingPlayers.filter(p => p.role !== 'GK');
        if (outfield.length === 0) return this.centerX;

        // 공격 방향에 따라 정렬 (오른쪽 공격 시 X가 작은 순, 왼쪽 공격 시 X가 큰 순)
        const sorted = [...outfield].sort((a, b) => isAttackingRight ? a.x - b.x : b.x - a.x);
        
        // 골키퍼 제외 최후방 수비수 (뒤에서 두 번째 선수 역할)의 X 좌표 반환
        return sorted.length > 1 ? sorted[1].x : sorted[0].x;
    }
}