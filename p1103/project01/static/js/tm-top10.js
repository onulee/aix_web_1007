// =================================================from=====
// TravelMate - 연령대별 인기 관광지 TOP10
// 카카오맵 + 관광지 마커 + 상세정보 팝업 + 하단 버블차트 (JSON 연동)
// ======================================================

function ensureD3Loaded() {
    if (window.d3) return Promise.resolve(window.d3);
    return new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-d3-autoload="true"]');
        if (existing) {
            existing.addEventListener("load", () => resolve(window.d3));
            return;
        }
        const script = document.createElement("script");
        script.src = "https://d3js.org/d3.v7.min.js";
        script.async = true;
        script.dataset.d3Autoload = "true";
        script.onload = () => resolve(window.d3);
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
    });
}
ensureD3Loaded();

// 전역 키워드 데이터 저장소 (static/json/tours_keywords.json과 연동)
let GLOBAL_KEYWORD_DATA = [];

async function loadKeywordData() {
    try {
        const response = await fetch('/static/json/tours_keywords.json');
        if (response.ok) {
            const jsonData = await response.json();
            if (Array.isArray(jsonData) && jsonData.length > 0) {
                GLOBAL_KEYWORD_DATA = jsonData;
                console.log("✅ 성공: static/json/tours_keywords.json 데이터 로드 완료", GLOBAL_KEYWORD_DATA.length);
            }
        }
    } catch (e) {
        console.warn("⚠️ tours_keywords.json 파일을 불러오지 못했습니다. 기본 내장 Fallback 데이터를 사용합니다.", e);
    }
}
loadKeywordData();

// JSON 데이터에서 현재 관광지명과 일치하는 연관어 배열을 가져오는 함수
function getOrGeneratePlaceKeywords(tour) {
    const cleanName = (tour.name || "").trim();
    
    // 1. static JSON 데이터에서 장소명이 일치하거나 포함되는 항목 필터링 후 상위 15개만 제한
    const matched = GLOBAL_KEYWORD_DATA.filter(d => {
        const target = (d["장소명"] || "").trim();
        return target === cleanName || target.includes(cleanName) || cleanName.includes(target);
    });

    if (matched.length > 0) {
        // 🌟 순위순 정렬 후 상위 15개만 반환
        return matched.sort((a, b) => (Number(a["순위"]) || 0) - (Number(b["순위"]) || 0)).slice(0, 15);
    }

    // 2. 만약 JSON에 해당 장소 데이터가 없다면 임시 안내 데이터 반환
    const area = tour.sigungu || "지역";
    const cat = tour.category || "관광명소";
    return [
        { "장소명": cleanName, "순위": 1, "연관 키워드": "주말방문", "맥락 연결어 TOP3": `${area}, ${cat}, 나들이`, "통일 가중치(Ratio)": 100.0 },
        { "장소명": cleanName, "순위": 2, "연관 키워드": "포토스팟", "맥락 연결어 TOP3": "인생샷, 풍경, 산책", "통일 가중치(Ratio)": 80.0 },
        { "장소명": cleanName, "순위": 3, "연관 키워드": "주변정보", "맥락 연결어 TOP3": "주차, 맛집, 편의시설", "통일 가중치(Ratio)": 60.0 }
    ];
}

(() => {
    "use strict";

    const root = document.querySelector(".tm-top10");
    if (!root) return;

    const buttons = [...root.querySelectorAll("#tm-regions button")];
    const ages = [...root.querySelectorAll(".tm-top10-ages button")];
    const cards = root.querySelector("#tm-cards");
    const mapElement = root.querySelector("#tm-map");
    const titleElement = root.querySelector("#tm-title");
    const mapTitleElement = root.querySelector("#tm-map-title");

    if (!cards || !mapElement) return;

    let region = root.dataset.region || "seoul";
    let age = 20;
    let map = null;
    let markers = [];
    const markerElements = new Map();
    let selectedPin = null;
    let blinkTimer = null;
    let requestId = 0;

    let activePopup = null;
    let previousBodyOverflow = "";

    function closePopup() {
        if (!activePopup) return;
        activePopup.remove();
        activePopup = null;
        document.body.style.overflow = previousBodyOverflow;
    }

    // 팝업창 열기 및 내부 대시보드 렌더링
    // 서울 관광지 유튜브 영상
    const TOUR_YOUTUBE = {
        "롯데월드잠실점": "4QhIPVyQZYY",
        "올림픽공원": "2Ge2aN67Uhk",
        "여의도한강공원": "M6YHVYxDyI0",
        "CGV용산아이파크몰": "EoBT9bMnM7Q",
        "서울숲": "-NCjQFwunMI",
        "경복궁": "AEIT6MLDU60",
        "국립중앙박물관": "rwBMCqF1O3U",
        "노들섬": "69WauQvh8ug",
        "팔각정북악스카이": "qfhyAQD4ARk",
        "반포한강공원": "6plVoClYgGc",
        "예술의전당": "VKWkhNttUGQ",
        "헌릉과인릉": "G2OlArFL9mI",
        "망원한강공원": "uZrh86HExRk",
        "봉은사": "j5_Yh6cyfDI",
        "코엑스": "1jbGZVhtnRA",
        "서울식물원": "WpCLxKIYn9M",
        "뚝섬한강공원": "BFqo6s3TptM",
        "어린이대공원": "lPQw_6S5lsg",
        "서울월드컵경기장": "iGm3zvMOwkw",
        "하늘공원": "n9Uh4E92ots",
    };

    function getYoutubeEmbedUrl(placeName) {
        if (region !== "seoul") return "";

        const name = String(placeName || "").trim();
        const id = TOUR_YOUTUBE[name];

        return id
            ? `https://www.youtube.com/embed/${id}`
            : "";
        }
        function openPopup(tour) {
        closePopup();
        previousBodyOverflow = document.body.style.overflow;

        const overlay = document.createElement("div");
        overlay.className = "tour-popup-overlay";

        const popup = document.createElement("div");
        popup.className = "tour-popup";
        popup.setAttribute("role", "dialog");
        popup.setAttribute("aria-modal", "true");
        popup.setAttribute("aria-label", `${tour.name || "관광지"} 상세정보`);

        const closeBtn = document.createElement("button");
        closeBtn.className = "tour-popup-close";
        closeBtn.type = "button";
        closeBtn.textContent = "×";
        closeBtn.addEventListener("click", closePopup);

        const content = document.createElement("div");
        content.className = "tour-popup-content";

        content.innerHTML = `
            <div class="tour-detail-container">
                <div class="tour-detail-heading">
                    <div class="tour-detail-badge">
                        RANK #${tour.rank} · ${age}대 인기 관광지
                    </div>

                    <h3 class="tour-detail-title">
                        ${tour.name}
                    </h3>
                </div>

                <div class="tour-media-grid">

                    <div class="tour-media-image">
                        <img
                            src="${tour.img || ''}"
                            alt="${tour.name}"
                            onerror="this.style.display='none'"
                        >
                    </div>

                    <div class="tour-media-video">
                        ${
                            getYoutubeEmbedUrl(tour.name)
                            ? `
                                <iframe
                                    src="${getYoutubeEmbedUrl(tour.name)}"
                                    title="${tour.name} 관광 영상"
                                    loading="lazy"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerpolicy="strict-origin-when-cross-origin"
                                    allowfullscreen>
                                </iframe>
                            `
                            : `
                                <div class="tour-video-empty">
                                    등록된 유튜브 영상이 없습니다.
                                </div>
                            `
                        }
                    </div>
                </div>


                <!-- 팝업창 관광지 길찾기 시작 -->
                <div class="tour-route-bar">

                    <div class="tour-route-title">
                        📍 ${tour.name} 길찾기
                    </div>

                    <div class="tour-route-field">
                        <span class="tour-route-label">출발지</span>

                        <button
                            type="button"
                            class="tour-route-location"
                            id="tourRouteLocation">
                            눌러서 현위치 확인하기
                        </button>
                    </div>

                    <span class="tour-route-arrow">→</span>

                    <div class="tour-route-field">
                        <span class="tour-route-label">도착지</span>

                        <div class="tour-route-destination">
                            ${tour.name}    
                        </div>
                    </div>

                    <div class="tour-route-buttons">

                        <button
                            type="button"
                            class="tour-route-naver"
                            id="tourRouteNaver">
                            N 네이버 길찾기
                        </button>

                        <button
                            type="button"
                            class="tour-route-kakao"
                            id="tourRouteKakao">
                            카카오 길찾기
                        </button>

                    </div>

                </div>
                <!-- 관광지 길찾기 끝 -->


                <div class="tour-analysis-grid">
                    <div class="tour-detail-bubble-wrap">
                        <div class="tour-bubble-header">
                            <h4>🫧 '${tour.name}' 연관어 가중치 버블 맵 <small>(마우스오버 및 드래그 지원)</small></h4>
                            <div class="tour-bubble-legend">
                                <span><i style="background:#9E3D24;"></i>1~3위</span>
                                <span><i style="background:#D9822B;"></i>4~10위</span>
                                <span><i style="background:#2D5A43;"></i>중위권</span>
                            </div>
                        </div>
                        <div id="popupBubbleCanvas" class="tour-bubble-canvas">
                            <svg id="popupBubbleSvg"></svg>
                            <div id="popupBubbleTooltip" class="tour-bubble-tooltip"></div>
                        </div>
                        <div class="tour-bubble-footer">
                            <span>💡 버블이나 우측 순위표를 가리키면 상세 맥락이 연동됩니다.</span>
                            <span>1위 = 100.0 기준</span>
                        </div>
                    </div>

                    <div class="tour-analysis-side">
                        <div class="tour-focus-card">
                            <div class="tour-focus-eyebrow">🔍 KEYWORD CONTEXT FOCUS</div>
                            <h5 class="tour-focus-subtitle">마우스를 올린 키워드 상세 맥락</h5>
                            <div class="tour-focus-box">
                                <div class="tour-focus-top">
                                    <span id="popupFocusRankBadge" class="tour-focus-badge">RANK #1</span>
                                    <span class="tour-focus-ratio-wrap">통일 가중치: <strong id="popupFocusRatio">100.0</strong></span>
                                </div>
                                <div id="popupFocusKeyword" class="tour-focus-keyword">-</div>
                                <div class="tour-focus-ctx-wrap">
                                    <div class="tour-focus-ctx-title">🔗 함께 언급된 맥락 연결어 TOP 3</div>
                                    <div id="popupFocusContextList" class="tour-focus-ctx-tags"></div>
                                </div>
                            </div>
                        </div>

                        <div class="tour-ranking-card">
                            <div class="tour-ranking-header">
                                <h5>📊 연관어 순위 및 맥락 목록</h5>
                                <span id="popupTotalKeywordCount">총 0개</span>
                            </div>
                            <div id="popupKeywordRankingList" class="tour-ranking-list"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        popup.appendChild(closeBtn);
        popup.appendChild(content);
        overlay.appendChild(popup);

        overlay.addEventListener("click", event => {
            if (event.target === overlay) closePopup();
        });

        document.body.appendChild(overlay);
        
        // ==========================================
        // 관광지 팝업 길찾기 기능
        // ==========================================

        // 길찾기 버튼 가져오기
        const locationButton = overlay.querySelector("#tourRouteLocation");
        const naverButton = overlay.querySelector("#tourRouteNaver");
        const kakaoButton = overlay.querySelector("#tourRouteKakao");

        // 출발지
        let origin = null;

        // 도착지 : 현재 선택한 관광지
        const dest = {
            name: tour.name,
            lat: Number(tour.lat),
            lng: Number(tour.lng)
        };

        // ==========================================
        // 현위치 클릭 → 현재 위치 주소 표시
        // ==========================================

        function useCurrentGeolocation() {

            if (!navigator.geolocation) {
                alert("현재 위치를 지원하지 않는 브라우저입니다.");
                return;
            }

            locationButton.textContent = "현재 위치 찾는 중...";

            navigator.geolocation.getCurrentPosition(

                (pos) => {

                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;

                    // 현재 위치 좌표 저장
                    origin = {
                        name: "내 현재 위치",
                        lat: lat,
                        lng: lng
                    };

                    // 카카오 주소 변환 서비스 확인
                    if (!window.kakao?.maps?.services?.Geocoder) {
                        locationButton.textContent = "현위치 확인";
                        alert("카카오 주소 변환 기능을 불러오지 못했습니다.");
                        return;
                    }

                    // 위도·경도를 주소로 변환
                    const geocoder = new kakao.maps.services.Geocoder();

                    geocoder.coord2Address(lng, lat, (result, status) => {

                        if (
                            status === kakao.maps.services.Status.OK &&
                            result.length > 0
                        ) {

                            // 도로명 주소 우선
                            const roadAddress =
                                result[0].road_address?.address_name;

                            // 도로명 주소가 없으면 지번 주소
                            const jibunAddress =
                                result[0].address?.address_name;

                            const address =
                                roadAddress ||
                                jibunAddress;

                            if (address) {

                                // 길찾기에 사용할 출발지 주소
                                origin.name = address;

                                // 버튼에 실제 주소 표시
                                locationButton.textContent = address;

                                // 마우스를 올리면 전체 주소 표시
                                locationButton.title = address;

                            } else {
                                locationButton.textContent = "주소 확인 실패";
                            }

                        } else {
                            locationButton.textContent = "주소 확인 실패";
                        }

                    });

                },

                (error) => {

                    locationButton.textContent = "현위치 확인";

                    if (error.code === 1) {
                        alert("브라우저에서 위치 접근을 허용해 주세요.");
                    } else {
                        alert("현재 위치를 가져오지 못했습니다.");
                    }

                },

                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        }

        // 현위치 버튼 클릭
        locationButton.addEventListener(
            "click",
            useCurrentGeolocation
        );


        // ==========================================
        // 2. 네이버 길찾기
        // ==========================================

        naverButton.addEventListener("click", () => {

            if (!origin) {
                alert("먼저 현재 위치를 확인해주세요.");
                return;
            }

            const sNameEnc = encodeURIComponent(origin.name);
            const eNameEnc = encodeURIComponent(dest.name);

            const naverUrl =
                `https://map.naver.com/index.nhn?slng=${origin.lng}&slat=${origin.lat}&stext=${sNameEnc}&elng=${dest.lng}&elat=${dest.lat}&etext=${eNameEnc}&menu=route&pathType=1`;

            window.open(naverUrl, "_blank", "noopener,noreferrer");

        });


        // ==========================================
        // 3. 카카오 길찾기
        // ==========================================

        kakaoButton.addEventListener("click", () => {

            if (!origin) {
                alert("먼저 현재 위치를 확인해주세요.");
                return;
            }

            if (!Number.isFinite(dest.lat) ||
                !Number.isFinite(dest.lng)) {
                alert("관광지 좌표를 확인할 수 없습니다.");
                return;
            }

            const sNameEnc = encodeURIComponent(origin.name);
            const eNameEnc = encodeURIComponent(dest.name);

            const kakaoUrl =
                `https://map.kakao.com/link/from/${sNameEnc},${origin.lat},${origin.lng}/to/${eNameEnc},${dest.lat},${dest.lng}`;

            window.open(kakaoUrl, "_blank", "noopener,noreferrer");

        });

        activePopup = overlay;
        document.body.style.overflow = "hidden";
        closeBtn.focus();

        setTimeout(() => {
            renderPopupBubbleChart(tour);
        }, 50);
    }

    function renderPopupBubbleChart(tour) {
        const container = document.getElementById("popupBubbleCanvas");
        if (!container || !window.d3) return;

        const rawPlaceData = getOrGeneratePlaceKeywords(tour);
        const placeData = rawPlaceData.map((d, i) => ({
            ...d,
            rankNum: Number(d["순위"]) || (i + 1),
            ratioNum: Number(d["통일 가중치(Ratio)"]) || Number(d["통일 가중치"]) || 0,
            keywordStr: d["연관 키워드"] || "-",
            contextStr: d["맥락 연결어 TOP3"] || d["맥락 연결어"] || "-"
        })).sort((a, b) => a.rankNum - b.rankNum);

        if (!placeData.length) return;

        const getColor = (rank) => {
            if (rank <= 3) return "#9E3D24";
            if (rank <= 10) return "#D9822B";
            if (rank <= 20) return "#2D5A43";
            return "#8C7A6B";
        };

        function updatePopupFocusCard(item) {
            const rankBadge = document.getElementById("popupFocusRankBadge");
            const ratioEl = document.getElementById("popupFocusRatio");
            const keywordEl = document.getElementById("popupFocusKeyword");
            const ctxListEl = document.getElementById("popupFocusContextList");
            if (!rankBadge || !ratioEl || !keywordEl || !ctxListEl) return;

            rankBadge.textContent = `RANK #${item.rankNum}`;
            rankBadge.style.backgroundColor = getColor(item.rankNum);
            ratioEl.textContent = item.ratioNum.toFixed(2);
            keywordEl.textContent = item.keywordStr;

            const ctxWords = item.contextStr.split(",").map(s => s.trim()).filter(Boolean);
            ctxListEl.innerHTML = ctxWords.length
                ? ctxWords.map(w => `<span class="tour-focus-tag">#${w}</span>`).join("")
                : `<span class="tour-focus-tag">-</span>`;

            document.querySelectorAll(".tour-ranking-item").forEach(r => {
                r.classList.toggle("active", Number(r.dataset.rank) === item.rankNum);
            });
        }

        const countEl = document.getElementById("popupTotalKeywordCount");
        if (countEl) countEl.textContent = `총 ${placeData.length}개 키워드`;

        const rankingListEl = document.getElementById("popupKeywordRankingList");
        if (rankingListEl) {
            rankingListEl.innerHTML = placeData.map(item => {
                const ctxWords = item.contextStr.split(",").map(s => s.trim()).filter(Boolean);
                const tagsHtml = ctxWords.map(w => `<span class="tour-rank-ctx-tag">#${w}</span>`).join("");
                return `
                    <div class="tour-ranking-item" data-rank="${item.rankNum}">
                        <div class="tour-ranking-left">
                            <div class="tour-ranking-title-row">
                                <span class="tour-ranking-badge" style="background:${getColor(item.rankNum)}">${item.rankNum}위</span>
                                <strong class="tour-ranking-word">${item.keywordStr}</strong>
                            </div>
                            <div class="tour-ranking-tags">${tagsHtml}</div>
                        </div>
                        <div class="tour-ranking-right">
                            <div class="tour-ranking-ratio">${item.ratioNum.toFixed(1)}</div>
                            <div class="tour-ranking-unit">Ratio</div>
                        </div>
                    </div>
                `;
            }).join("");

            rankingListEl.querySelectorAll(".tour-ranking-item").forEach((rowEl, idx) => {
                const itemData = placeData[idx];
                rowEl.addEventListener("mouseenter", () => {
                    updatePopupFocusCard(itemData);
                });
            });
        }

        updatePopupFocusCard(placeData[0]);

        const width = container.clientWidth || 480;
        const height = container.clientHeight || 360;

        const svg = d3.select("#popupBubbleSvg").attr("width", width).attr("height", height);
        svg.selectAll("*").remove();

        const tooltip = document.getElementById("popupBubbleTooltip");
        const minRatio = d3.min(placeData, d => d.ratioNum) || 10;
        const maxRatio = d3.max(placeData, d => d.ratioNum) || 100;

        const radiusScale = d3.scaleSqrt()
            .domain([Math.max(0, minRatio), Math.max(10, maxRatio)])
            .range([35, 80]);

        const nodes = placeData.map(d => ({
            ...d,
            r: radiusScale(d.ratioNum),
            x: width / 2 + (Math.random() - 0.5) * 80,
            y: height / 2 + (Math.random() - 0.5) * 60
        }));

        const simulation = d3.forceSimulation(nodes)
            .force("x", d3.forceX(width / 2).strength(0.08))
            .force("y", d3.forceY(height / 2).strength(0.10))
            .force("charge", d3.forceManyBody().strength(5))
            .force("collide", d3.forceCollide().radius(d => d.r + 3));

        const nodeGroup = svg.selectAll(".popup-bubble-node")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "popup-bubble-node")
            .style("cursor", "pointer")
            .call(d3.drag()
                .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
                .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
                .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
            );

        nodeGroup.append("circle")
            .attr("r", d => d.r)
            .attr("fill", d => getColor(d.rankNum))
            .attr("fill-opacity", 0.92)
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2);

        nodeGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "-0.12em")
            .attr("fill", "#ffffff")
            .style("font-weight", "800")
            .style("font-size", d => `${Math.max(10, Math.min(14, d.r * 0.33))}px`)
            .style("pointer-events", "none")
            .text(d => d.keywordStr.length > 6 && d.r < 32 ? d.keywordStr.slice(0, 5) + "…" : d.keywordStr);

        nodeGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "1.2em")
            .attr("fill", "rgba(255,255,255,0.88)")
            .style("font-weight", "600")
            .style("font-size", "10px")
            .style("pointer-events", "none")
            .text(d => d.ratioNum.toFixed(1));

        nodeGroup.on("mouseenter", function(event, d) {
            updatePopupFocusCard(d);
            if (tooltip) {
                const ctxWords = d.contextStr.split(",").map(w => w.trim()).filter(Boolean);
                const tagsHtml = ctxWords.map(w => `<span class="tour-tt-tag">#${w}</span>`).join("");
                tooltip.innerHTML = `
                    <div class="tour-tt-top">
                        <span class="tour-tt-rank" style="background:${getColor(d.rankNum)}">${d.rankNum}위</span>
                        <span class="tour-tt-ratio">가중치 <strong>${d.ratioNum.toFixed(2)}</strong></span>
                    </div>
                    <div class="tour-tt-word">${d.keywordStr}</div>
                    <div class="tour-tt-ctx-box">
                        <div class="tour-tt-ctx-label">🔗 동시출현 맥락 연결어 TOP 3</div>
                        <div class="tour-tt-tags">${tagsHtml}</div>
                    </div>
                `;
                tooltip.style.display = "block";
            }
        }).on("mousemove", function(event) {
            if (tooltip) {
                const rect = container.getBoundingClientRect();
                const relX = event.clientX - rect.left;
                const relY = event.clientY - rect.top;
                tooltip.style.left = `${Math.min(width - 200, Math.max(10, relX + 12))}px`;
                tooltip.style.top = `${Math.max(10, relY - 50)}px`;
            }
        }).on("mouseleave", function() {
            if (tooltip) tooltip.style.display = "none";
        });

        simulation.on("tick", () => {
            nodeGroup.attr("transform", d => {
                d.x = Math.max(d.r + 6, Math.min(width - d.r - 6, d.x));
                d.y = Math.max(d.r + 6, Math.min(height - d.r - 6, d.y));
                return `translate(${d.x},${d.y})`;
            });
        });
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closePopup();
    });

    function resetMarkerEffect() {
        if (blinkTimer !== null) { clearTimeout(blinkTimer); blinkTimer = null; }
        markerElements.forEach(pin => { pin.classList.remove("tm-pin-selected", "tm-pin-blinking"); });
        selectedPin = null;
    }

    function highlightMarker(tour, zoomMap = false) {
        if (!map) return;
        resetMarkerEffect();
        const pin = markerElements.get(Number(tour.rank));
        if (!pin) return;
        selectedPin = pin;
        pin.classList.add("tm-pin-selected");
        void pin.offsetWidth;
        pin.classList.add("tm-pin-blinking");

        if (zoomMap) {
            const lat = Number(tour.lat);
            const lng = Number(tour.lng);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                const position = new kakao.maps.LatLng(lat, lng);
                map.setLevel(5, { anchor: position });
                map.setCenter(position);
            }
        }

        blinkTimer = setTimeout(() => {
            pin.classList.remove("tm-pin-selected", "tm-pin-blinking");
            if (selectedPin === pin) selectedPin = null;
            blinkTimer = null;
        }, 1500);
    }

    function clearMarkers() {
        closePopup();
        resetMarkerEffect();
        markers.forEach(marker => marker.setMap(null));
        markers = [];
        markerElements.clear();
    }

    function createCard(tour) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "tm-top10-card";

        const img = document.createElement("img");
        img.src = tour.img;
        img.alt = tour.name;
        img.onerror = () => { img.style.visibility = "hidden"; };

        const info = document.createElement("div");
        info.className = "tm-card-info-box";

        const rank = document.createElement("span");
        rank.className = "tm-rank";
        rank.textContent = `${tour.rank}위`;

        const name = document.createElement("strong");
        name.textContent = tour.name;

        const area = document.createElement("small");
        area.textContent = `${tour.sigungu || ""} · ${tour.category || ""}`;

        const bottomRow = document.createElement("div");
        bottomRow.className = "tm-card-bottom-row";

        const ratio = document.createElement("b");
        ratio.textContent = `${tour.ratio}%`;

        const detailBtn = document.createElement("span");
        detailBtn.className = "tm-detail-btn";
        detailBtn.textContent = "상세보기";
        detailBtn.setAttribute("role", "button");
        detailBtn.tabIndex = 0;

        detailBtn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            openPopup(tour);
        });

        bottomRow.append(ratio);
        info.append(rank, name, area, bottomRow);
        card.append(img, info);

        card.addEventListener("mouseenter", () => { highlightMarker(tour, false); });
        card.addEventListener("click", () => { highlightMarker(tour, true); });

        return card;
    }

    function createMarker(tour, bounds) {
        if (!map) return;
        const lat = Number(tour.lat);
        const lng = Number(tour.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const position = new kakao.maps.LatLng(lat, lng);
        const pin = document.createElement("div");
        pin.className = "tm-top10-pin";
        const span = document.createElement("span");
        span.textContent = tour.rank;
        pin.append(span);

        const marker = new kakao.maps.CustomOverlay({
            position: position,
            content: pin,
            yAnchor: 1,
            zIndex: 3
        });

        marker.setMap(map);
        markers.push(marker);
        markerElements.set(Number(tour.rank), pin);

        // 🌟 [수정] 마커 클릭 시 지도가 이동함과 동시에 팝업창(버블 대시보드)이 동일하게 뜨도록 연결
        pin.addEventListener("click", event => {
            event.stopPropagation();
            highlightMarker(tour, true);
            openPopup(tour);
        });

        pin.addEventListener("mouseenter", () => { highlightMarker(tour, false); });
        bounds.extend(position);
    }

    async function load(shouldZoom = true) {
        const currentRequestId = ++requestId;
        resetMarkerEffect();

        buttons.forEach(button => {
            button.classList.toggle("active", button.dataset.region === region);
        });

        ages.forEach(button => {
            button.classList.toggle("active", Number(button.dataset.age) === age);
        });

        cards.textContent = "관광지 데이터를 불러오는 중입니다.";

        try {
            const apiUrl = `${root.dataset.api}?region=${encodeURIComponent(region)}&age=${age}`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (currentRequestId !== requestId) return;

            if (titleElement) titleElement.textContent = `${data.region_name} 인기 관광지 TOP 10`;
            if (mapTitleElement) mapTitleElement.textContent = `${data.region_name} 인기 명소`;

            cards.replaceChildren();
            clearMarkers();

            if (!data.tours || !data.tours.length) {
                cards.textContent = "이 지역의 관광지 데이터가 없습니다.";
                return;
            }

            const bounds = map ? new kakao.maps.LatLngBounds() : null;

            data.tours.forEach(tour => {
                cards.append(createCard(tour));
                if (map && bounds) createMarker(tour, bounds);
            });

            if (shouldZoom && map && markers.length) {
                map.setBounds(bounds, 60, 60, 60, 60);
            }
        } catch (error) {
            if (currentRequestId !== requestId) return;
            cards.textContent = "관광지 데이터를 불러오지 못했습니다.";
            console.error(error);
        }
    }

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            region = button.dataset.region;
            load(true);
        });
    });

    ages.forEach(button => {
        button.addEventListener("click", () => {
            age = Number(button.dataset.age);
            load(true);
        });
    });

    function showMap() {
        if (!window.kakao || !window.kakao.maps) {
            mapElement.innerHTML = `<p style="padding:180px 20px; text-align:center;">카카오맵 API 연결을 확인해주세요.</p>`;
            return;
        }
        kakao.maps.load(() => {
            const center = new kakao.maps.LatLng(37.5665, 126.9780);
            map = new kakao.maps.Map(mapElement, { center: center, level: 8 });
            load(true);
        });
    }

    const popupStyle = document.createElement("style");
    popupStyle.textContent = `
        .tm-top10-card { position: relative !important; overflow: visible !important; }
        .tm-card-bottom-row { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 8px !important; width: 100% !important; margin-top: 4px !important; }
        .tm-detail-btn { display: inline-flex !important; align-items: center !important; justify-content: center !important; padding: 3px 9px !important; font-size: 11px !important; font-weight: 700 !important; color: #9E3D24 !important; background: #fdfaf5 !important; border: 1px solid #d8c3a5 !important; border-radius: 6px !important; cursor: pointer !important; z-index: 20 !important; white-space: nowrap !important; transition: all 0.15s ease !important; box-shadow: 0 2px 4px rgba(128, 84, 59, 0.1) !important; }
        .tm-detail-btn:hover { background: #9E3D24 !important; color: #ffffff !important; border-color: #9E3D24 !important; transform: translateY(-1px) !important; }

        .tour-popup-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.42); display: flex; justify-content: center; align-items: center; z-index: 99999; padding: 20px; box-sizing: border-box; }
        .tour-popup { position: relative; width: 1080px; max-width: 96vw; height: 780px; max-height: 92vh; background: rgba(248, 245, 238, 0.98); border: 1px solid rgba(128, 84, 59, 0.45); border-radius: 18px; backdrop-filter: blur(10px); box-shadow: 0 24px 60px rgba(44, 34, 30, 0.28); overflow: hidden; box-sizing: border-box; }
        .tour-popup-close { position: absolute; top: 14px; right: 20px; border: none; background: transparent; font-size: 30px; color: #80543b; cursor: pointer; z-index: 10; }
        .tour-popup-close:hover { color: #442116; }
        .tour-popup-content { width: 100%; height: 100%; padding: 46px 30px 32px; box-sizing: border-box; overflow-y: auto; }

        .tour-detail-container { display: flex; flex-direction: column; gap: 20px; }
        .tour-detail-top-grid { display: grid; grid-template-columns: 280px 1fr; gap: 20px; min-height: 200px; }
        .tour-detail-image { background: #f3ede2; border-radius: 14px; overflow: hidden; border: 1px solid #e6dec8; height: 200px; }
        .tour-detail-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .tour-detail-info { background: #ffffff; border: 1px solid #f0e9df; border-radius: 14px; padding: 18px 22px; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 6px 20px -8px rgba(139, 108, 76, 0.08); }
        .tour-detail-badge { display: inline-block; align-self: flex-start; font-size: 11px; font-weight: 800; color: #9E3D24; background: #f7ede2; padding: 3px 9px; border-radius: 6px; margin-bottom: 8px; }
        .tour-detail-title { font-size: 22px; font-weight: 800; color: #2c221e; margin: 0 0 8px 0; }
        .tour-detail-meta { font-size: 13px; color: #5c4637; margin: 2px 0; }
        .tour-detail-desc { font-size: 12.5px; line-height: 1.55; color: #6d5543; margin: 10px 0 0 0; padding-top: 10px; border-top: 1px dashed #e2d8c9; }

        .tour-analysis-grid { display: grid; grid-template-columns: 1.35fr 1fr; gap: 18px; align-items: start; }
        .tour-detail-bubble-wrap { background: #ffffff; border: 1px solid #f0e9df; border-radius: 16px; padding: 16px; display: flex; flex-direction: column; box-shadow: 0 10px 30px -10px rgba(139, 108, 76, 0.08); height: 100%;
box-sizing: border-box; }
        .tour-bubble-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
        .tour-bubble-header h4 { font-size: 14px; font-weight: 800; color: #1e293b; margin: 0; }
        .tour-bubble-header h4 small { font-size: 11px; font-weight: 500; color: #64748b; margin-left: 4px; }
        .tour-bubble-legend { display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 600; color: #475569; }
        .tour-bubble-legend span { display: inline-flex; align-items: center; gap: 4px; }
        .tour-bubble-legend i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
        .tour-bubble-canvas { width: 100%; height: 420px; background: #faf8f5; border: 1px solid #f0e9df; border-radius: 14px; position: relative; overflow: hidden; }
        .tour-bubble-footer { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #94a3b8; margin-top: 10px; }

        .tour-analysis-side { display: flex; flex-direction: column; gap: 16px; }
        .tour-focus-card { background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%); border: 1px solid #f0e9df; border-radius: 16px; padding: 16px; box-shadow: 0 10px 30px -10px rgba(139, 108, 76, 0.08); }
        .tour-focus-eyebrow { font-size: 11px; font-weight: 800; color: #9E3D24; margin-bottom: 3px; }
        .tour-focus-subtitle { font-size: 13px; font-weight: 700; color: #334155; margin: 0 0 10px 0; }
        .tour-focus-box { background: #ffffff; border: 1px solid #e2d8c9; border-radius: 14px; padding: 14px; }
        .tour-focus-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .tour-focus-badge { font-size: 11px; font-weight: 800; padding: 2px 9px; border-radius: 999px; background: #9E3D24; color: #ffffff; }
        .tour-focus-ratio-wrap { font-size: 12px; font-weight: 700; color: #6d5543; }
        .tour-focus-ratio-wrap strong { font-size: 15px; color: #9E3D24; }
        .tour-focus-keyword { font-size: 21px; font-weight: 900; color: #2c221e; margin-bottom: 10px; }
        .tour-focus-ctx-wrap { background: #faf8f5; border: 1px solid #f0e9df; border-radius: 10px; padding: 10px 12px; }
        .tour-focus-ctx-title { font-size: 11px; font-weight: 700; color: #6d5543; margin-bottom: 7px; }
        .tour-focus-ctx-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .tour-focus-tag { background: #ffffff; border: 1px solid #e2d8c9; color: #9E3D24; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 8px; }

        .tour-ranking-card { background: #ffffff; border: 1px solid #f0e9df; border-radius: 16px; padding: 16px; box-shadow: 0 10px 30px -10px rgba(139, 108, 76, 0.08); }
        .tour-ranking-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .tour-ranking-header h5 { font-size: 13.5px; font-weight: 800; color: #1e293b; margin: 0; }
        .tour-ranking-header span { font-size: 11px; font-weight: 700; color: #2D5A43; }
        .tour-ranking-list { max-height: 190px; overflow-y: auto; padding-right: 4px; display: flex; flex-direction: column; gap: 7px; }
        .tour-ranking-item { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 9px 11px; border-radius: 11px; border: 1px solid #f0e9df; background: #ffffff; cursor: pointer; transition: all 0.15s ease; }
        .tour-ranking-item:hover, .tour-ranking-item.active { border-color: #9E3D24; background: #fdfaf6; }
        .tour-ranking-left { min-width: 0; flex: 1; }
        .tour-ranking-title-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
        .tour-ranking-badge { font-size: 10px; font-weight: 800; color: #ffffff; padding: 1px 6px; border-radius: 4px; }
        .tour-ranking-word { font-size: 12.5px; font-weight: 700; color: #2c221e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tour-ranking-tags { display: flex; flex-wrap: wrap; gap: 4px; }
        .tour-rank-ctx-tag { font-size: 10px; color: #6d5543; background: #faf8f5; border: 1px solid #e2d8c9; padding: 1px 6px; border-radius: 4px; }
        .tour-ranking-right { text-align: right; flex-shrink: 0; }
        .tour-ranking-ratio { font-size: 12.5px; font-weight: 800; color: #9E3D24; }
        .tour-ranking-unit { font-size: 9px; color: #94a3b8; }

        .tour-bubble-tooltip { display: none; position: absolute; pointer-events: none; background: rgba(44, 34, 30, 0.95); color: #ffffff; padding: 10px 14px; border-radius: 10px; font-size: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25); z-index: 30; min-width: 180px; }
        .tour-tt-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .tour-tt-rank { background: #9E3D24; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; }
        .tour-tt-ratio { color: #fcd34d; font-size: 11px; }
        .tour-tt-word { font-size: 15px; font-weight: 800; margin-bottom: 6px; }
        .tour-tt-ctx-box { border-top: 1px solid rgba(255, 255, 255, 0.16); padding-top: 5px; }
        .tour-tt-ctx-label { font-size: 10px; color: #d6ccc2; margin-bottom: 4px; }
        .tour-tt-tags { display: flex; flex-wrap: wrap; gap: 4px; }
        .tour-tt-tag { background: rgba(255, 255, 255, 0.16); padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 600; }

        @media (max-width: 860px) {
            .tour-popup { width: 96vw; height: 90vh; }
            .tour-popup-content { padding: 46px 16px 22px; }
            .tour-detail-top-grid, .tour-analysis-grid { grid-template-columns: 1fr; }
            .tour-detail-image { height: 180px; }
        }
        /* 팝업 크기 */
        .tour-popup {
            width: 1200px;
            height: 850px;
            max-height: 94vh;
        }

        /* 관광지 이름 */
        .tour-detail-heading .tour-detail-title {
            font-size: 28px;
            color: #442116;
            margin: 6px 0 0;
        }

        /* 사진과 유튜브 가로 배치 */
        .tour-media-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
        }

        /* 사진과 영상 */
        .tour-media-image,
        .tour-media-video {
            width: 100%;
            height: 260px;
            border-radius: 12px;
            overflow: hidden;
            background: #faf8f5;
        }

        .tour-media-image img,
        .tour-media-video iframe {
            width: 100%;
            height: 100%;
            display: block;
            border: 0;
            object-fit: cover;
        }

        /* 유튜브 영상이 없을 때 */
        .tour-video-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            color: #80543b;
            font-size: 14px;
        }

        @media (max-width: 860px) {
            .tour-media-grid {
                grid-template-columns: 1fr;
            }

            .tour-media-image,
            .tour-media-video {
                height: 220px;
            }
        }
    `;
    document.head.appendChild(popupStyle);

    showMap();
})();