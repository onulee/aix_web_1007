function animate() {  // 경기장 및 선수, 공 렌더링 루프  --------------------------------------------------------------------------------
        if (!ctx) return;
        ctx.clearRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);
        
        if (imageLoaded) {
            ctx.drawImage(pitchImage, 0, 0, PITCH_WIDTH, PITCH_HEIGHT);
        } else {
            // 이미지 로딩 실패 또는 경로 누락 시 기본 초록색 경기장 필드 렌더링
            ctx.fillStyle = '#1b5e20';
            ctx.fillRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);
            
            // 중앙선 및 하프라인 가이드 렌더링
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(PITCH_WIDTH / 2, 0);
            ctx.lineTo(PITCH_WIDTH / 2, PITCH_HEIGHT);
            ctx.stroke();
        }

        const allPlayers = [...homePlayers, ...awayPlayers];
        allPlayers.forEach(player => {
            if (isPlaying && Math.random() < 0.02) {
                player.targetX = Math.max(FIELD_BOUNDS.left + 30, Math.min(FIELD_BOUNDS.right - 30, player.targetX + (Math.random() - 0.5) * 80));
                player.targetY = Math.max(FIELD_BOUNDS.top + 30, Math.min(FIELD_BOUNDS.bottom - 30, player.targetY + (Math.random() - 0.5) * 80));
            }
            player.update();
            player.draw(ctx);
        });

        if (isPlaying) {
            if (Math.random() < 0.03 && allPlayers.length > 0) {
                const rp = allPlayers[Math.floor(Math.random() * allPlayers.length)];
                ball.targetX = rp.x + (Math.random() - 0.5) * 30;
                ball.targetY = rp.y + (Math.random() - 0.5) * 30;
            }
            
            // ⚽ MatchRuleEngine의 공 물리역학 적용[cite: 3]
            ball = ruleEngine.updateBallPhysics(ball);

            // ⚽ MatchRuleEngine의 인/아웃 및 세트피스/득점 판정 연동[cite: 3]
            const outcome = ruleEngine.checkBallOutAndOutcome(ball.x, ball.y, lastTouchIsHome);
            if (outcome.status === 'GOAL') {
                const logs = document.getElementById('match-logs');
                if (logs) {
                    logs.innerHTML += `<div>[${document.getElementById('match-timer').innerText}] ⚽ 득점 판정! (${outcome.team}팀 득점)</div>`;
                    logs.scrollTop = logs.scrollHeight;
                }
                ball.x = outcome.restartX;
                ball.y = outcome.restartY;
                ball.vx = 0; ball.vy = 0;
            } else if (outcome.status === 'BALL_OUT_TOUCHLINE' || outcome.status === 'BALL_OUT_GOAL_LINE') {
                ball.x = outcome.restartX;
                ball.y = outcome.restartY;
                ball.vx = 0; ball.vy = 0;
            }
        }

        ball.draw(ctx);
        requestAnimationFrame(animate);
    }