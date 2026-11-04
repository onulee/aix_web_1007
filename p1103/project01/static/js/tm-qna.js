document.addEventListener("DOMContentLoaded", function () {

    // =====================================
    // 1. FAQ / Q&A 탭 전환
    // =====================================

    const tabs = document.querySelectorAll(".qa-tab");
    const panels = document.querySelectorAll(".qa-panel");

    tabs.forEach(function (tab) {

        tab.addEventListener("click", function () {

            tabs.forEach(function (item) {
                item.classList.remove("active");
            });

            panels.forEach(function (panel) {
                panel.classList.remove("active");
            });

            tab.classList.add("active");

            const panelId = tab.dataset.panel;
            const targetPanel = document.getElementById(panelId);

            if (targetPanel) {
                targetPanel.classList.add("active");
            }

        });

    });


    // =====================================
    // 2. FAQ 카테고리 필터
    // =====================================

    const filters = document.querySelectorAll(".qa-filter");
    const faqItems = document.querySelectorAll(".qa-faq-item");
    const searchInput = document.getElementById("qa-search");
    const emptyMessage = document.querySelector(".qa-empty");

    let selectedCategory = "전체";

    function filterFAQ() {

        const keyword = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        let visibleCount = 0;

        faqItems.forEach(function (item) {

            const category = item.dataset.category || "";
            const content = item.textContent.toLowerCase();

            const categoryMatch =
                selectedCategory === "전체" ||
                category === selectedCategory;

            const keywordMatch = content.includes(keyword);

            if (categoryMatch && keywordMatch) {
                item.style.display = "";
                visibleCount++;
            } else {
                item.style.display = "none";
                item.open = false;
            }

        });

        if (emptyMessage) {
            emptyMessage.hidden = visibleCount > 0;
        }

    }

    filters.forEach(function (button) {

        button.addEventListener("click", function () {

            filters.forEach(function (item) {
                item.classList.remove("active");
            });

            button.classList.add("active");

            selectedCategory = button.dataset.category;

            filterFAQ();

        });

    });

    if (searchInput) {
        searchInput.addEventListener("input", filterFAQ);
    }


    // =====================================
    // 3. FAQ 하나씩 펼치기
    // =====================================

    faqItems.forEach(function (item) {

        item.addEventListener("toggle", function () {

            if (!item.open) return;

            faqItems.forEach(function (other) {

                if (other !== item) {
                    other.open = false;
                }

            });

        });

    });


    // =====================================
    // 4. 질문 작성 폼 열기 / 닫기
    // =====================================

    const writeButton = document.getElementById("qa-write-toggle");
    const writeForm = document.getElementById("qa-write-form");

    if (writeButton && writeForm) {

        writeButton.addEventListener("click", function () {

            writeForm.hidden = !writeForm.hidden;

            if (!writeForm.hidden) {

                writeButton.textContent = "작성 취소";

                writeForm.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            } else {

                writeButton.textContent = "+ 질문 작성";

            }

        });

    }


    // =====================================
    // 5. 질문 게시판 자동 열기
    // =====================================

    if (window.location.hash === "#question-panel") {

        const questionTab = document.querySelector(
            '.qa-tab[data-panel="question-panel"]'
        );

        if (questionTab) {
            questionTab.click();
        }

    }

});