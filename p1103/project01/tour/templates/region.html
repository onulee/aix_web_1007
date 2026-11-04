{% extends 'base.html' %}
{% load static %}

{% block title %}{{ name }} 인기관광지 - 여행메이트{% endblock %}

{% block content %}
<section class="sec">
    <a href="{% url 'index' %}#region" class="back-link">← 전국 지역으로</a>

    <div class="sec-head">
        <div>
            <h2>{{ name }} 연령대별 인기관광지 TOP10</h2>
            <p>연령대를 고르면 그 세대가 많이 찾은 관광지 순위가 나옵니다.</p>
        </div>
    </div>

    <!-- 연령대 선택 -->
    <div class="age-tabs">
        {% for a in ages %}
        <a href="?age={{ a }}" {% if a == age %}class="on"{% endif %}>
            {{ a }}대{% if a == 60 %} 이상{% endif %}
        </a>
        {% endfor %}
    </div>

    <!-- TOP10 카드 -->
    <div class="tour-grid">
        {% for t in tours %}
        <div class="tour-card">
            <div class="thumb">
                <img src="{% static t.img %}" alt="{{ t.name }}">
                <span class="rank">{{ t.rank }}위</span>
            </div>
            <div class="body">
                <h3>{{ t.name }}</h3>
                <p>{{ t.sigungu }} · {{ t.category }}</p>
                <p class="ratio">비율 {{ t.ratio }}%</p>
            </div>
        </div>
        {% empty %}
        <p>데이터가 없습니다.</p>
        {% endfor %}
    </div>
</section>
{% endblock %}