/* =====================================================
   motion.js - 토스(toss.im) 스타일 애니메이션 동작
   (jQuery 필요 없음, 순수 자바스크립트)
   ===================================================== */
(function () {
    'use strict';

    // 움직임 줄이기 설정이면 아무것도 하지 않음 (CSS가 전부 보이게 처리)
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.addEventListener('DOMContentLoaded', function () {

        /* ---------- 1. 차례차례 나타나기 (stagger) ----------
           data-stagger="0.08" 를 붙인 부모 안의 [data-reveal] 자식들에게
           0s, 0.08s, 0.16s ... 순서로 지연시간을 자동 부여 */
        document.querySelectorAll('[data-stagger]').forEach(function (parent) {
            var gap = parseFloat(parent.getAttribute('data-stagger')) || 0.08;
            var loop = parseInt(parent.getAttribute('data-stagger-loop'), 10) || 0;   // 가로 슬라이드용: 몇 개마다 지연을 처음부터
            var kids = parent.querySelectorAll('[data-reveal]');
            kids.forEach(function (el, i) {
                if (!el.style.getPropertyValue('--d')) {
                    var k = loop ? i % loop : i;
                    el.style.setProperty('--d', (k * gap).toFixed(2) + 's');
                }
            });
        });

        /* ---------- 2. 화면에 들어오면 .is-in 붙이기 ---------- */
        var targets = document.querySelectorAll('[data-reveal], [data-reveal-lines]');

        // 나타나기 + 등장이 끝나면 .is-done (hover 반응을 빠르게 되돌림)
        function reveal(el) {
            el.classList.add('is-in');
            var d = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
            setTimeout(function () { el.classList.add('is-done'); }, d * 1000 + 1300);
        }

        if (reduce || !('IntersectionObserver' in window)) {
            targets.forEach(reveal);
        } else {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        reveal(entry.target);
                        io.unobserve(entry.target);      // 한 번 나타나면 끝
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

            targets.forEach(function (el) { io.observe(el); });
        }

        /* ---------- 3. 스크롤 따라 글자 차오르기 (data-fill) ----------
           글자를 단어 단위로 쪼개서, 스크롤 위치에 따라 앞에서부터 진하게 */
        var fills = [];
        document.querySelectorAll('[data-fill]').forEach(function (el) {
            var words = el.textContent.trim().split(/\s+/);
            el.textContent = '';
            el.classList.add('m-fill');
            words.forEach(function (w, i) {
                var s = document.createElement('span');
                s.className = 'm-word';
                s.textContent = w;
                el.appendChild(s);
                if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
            });
            fills.push({ el: el, words: el.querySelectorAll('.m-word') });
        });

        /* ---------- 4. 스크롤에 맞춰 커지는 섹션 (data-scroll-scale) ---------- */
        var scalers = Array.prototype.slice.call(document.querySelectorAll('[data-scroll-scale]'));

        /* ---------- 5. 헤더 그림자 ---------- */
        var header = document.querySelector('.tm-header');

        var ticking = false;
        function onScroll() {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(function () {
                var vh = window.innerHeight;

                if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);

                // 글자 차오르기: 요소가 화면 85% 지점 → 45% 지점으로 올라오는 동안 0→1
                fills.forEach(function (f) {
                    var r = f.el.getBoundingClientRect();
                    var p = (vh * 0.85 - r.top) / (vh * 0.40);
                    if (reduce) p = 1;
                    p = Math.max(0, Math.min(1, p));
                    var n = Math.round(p * f.words.length);
                    f.words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
                });

                // 섹션 커지기: 섹션 윗부분이 화면 아래 → 화면 60% 지점까지 오는 동안 0→1
                scalers.forEach(function (el) {
                    var r = el.getBoundingClientRect();
                    var p = (vh - r.top) / (vh * 0.40);
                    if (reduce) p = 1;
                    p = Math.max(0, Math.min(1, p));
                    el.style.setProperty('--p', p.toFixed(3));
                });

                ticking = false;
            });
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        onScroll();
    });
})();
