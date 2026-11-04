# ------------------------------------------------------------
# 맞춤추천 AI 챗봇의 두뇌
#  1) 질문에서 지역·시군구·연령대·기간·동행을 찾아낸다
#  2) 우리 팀 Tour 데이터(연령대별 인기관광지)에서 조건에 맞는 관광지를 골라
#     AI에게 참고자료로 준다
#  3) .env에 AI 키가 있으면 AI가 대답, 없거나 실패하면 기본 응답(데이터 기반)
# ------------------------------------------------------------
import os
import re
import math
import datetime
import requests
from dotenv import load_dotenv
from django.conf import settings
from tour.models import Tour
from tour.regions import REGIONS

load_dotenv(settings.BASE_DIR / '.env')

REGION_NAME = dict(REGIONS)                       # 'bs' → '부산'
# 지역 이름 → 코드  (예: '부산' → 'bs'), 자주 쓰는 다른 이름도 추가
REGION_WORDS = {name: code for code, name in REGIONS}
REGION_WORDS.update({'제주도': 'jj', '강원도': 'gw', '경기도': 'gg', '전라북도': 'jb', '전북특별자치도': 'jb',
                     '전라남도': 'jn', '경상북도': 'gb', '경상남도': 'gn', '충청북도': 'cb', '충청남도': 'cn',
                     '광안리': 'bs', '우도': 'jj'})

DAY_WORDS = {'2박3일': ['2박', '3일'], '1박2일': ['1박', '2일'], '당일치기': ['당일', '하루']}
MATE_WORDS = {'부모님': ['부모', '엄마', '아빠', '어머니', '아버지', '효도'], '연인': ['연인', '여자친구', '남자친구', '애인', '데이트', '커플'],
              '가족': ['가족', '아이', '아들', '딸', '애들'], '친구': ['친구', '동기'], '혼자': ['혼자', '나홀로', '혼행']}
# Tour.category(구분) 와 연결되는 단어
CATEGORY_WORDS = {'관광명소': ['바다', '해변', '해수욕장', '공원', '자연', '명소', '산책'],
                  '레저/스포츠': ['레저', '스포츠', '액티비티', '놀이', '체험'],
                  '문화생활시설': ['문화', '박물관', '전시', '미술관', '공연'],
                  '종교': ['사찰', '절', '성당', '종교']}

QUICK_START = ['20대 부산 1박2일 코스 짜줘', '부모님과 가기 좋은 경북 여행', '강릉 당일치기 추천해줘', '30대가 많이 가는 제주 관광지는?']


def find_one(text, table, default=None):
    for key, words in table.items():
        if any(w in text for w in words):
            return key
    return default


def this_season():
    m = datetime.date.today().month
    return {3: '봄', 4: '봄', 5: '봄', 6: '여름', 7: '여름', 8: '여름', 9: '가을', 10: '가을', 11: '가을'}.get(m, '겨울')


# 시군구 이름 → (지역코드, 시군구)  예: '강릉' → ('gw', '강릉시')
#   '중구', '서구' 처럼 여러 지역에 있는 이름은 제외
def sigungu_words():
    table = {}
    for region, sigungu in Tour.objects.values_list('region', 'sigungu').distinct():
        short = sigungu.split()[0]                    # '청주시 청원구' → '청주시'
        word = re.sub(r'(시|군|구)$', '', short)       # '강릉시' → '강릉'
        if len(word) >= 2 and word not in REGION_WORDS:   # '광주', '제주' 처럼 시·도 이름과 같으면 제외
            table.setdefault(word, set()).add((region, short))
    return {w: list(v)[0] for w, v in table.items() if len(v) == 1}


# 대화에서 조건 읽기 (앞에서 말한 지역·연령대를 기억하기 위해 최근 대화도 함께 본다)
def read_condition(history, message):
    recent = ' '.join(h['content'] for h in history if h['role'] == 'user')
    texts = [message] if '다른 지역' in message else [message, recent]

    region, sigungu = None, None
    sg_table = sigungu_words()
    for text in texts:
        for word, code in REGION_WORDS.items():
            if word in text:
                region = code
                break
        for word, (code, sg) in sg_table.items():
            if word in text:
                region, sigungu = code, sg
                break
        if region:
            break

    # 연령대 : '20대' → 20 (데이터는 20~60대)
    def find_age(text):
        m = re.search(r'([1-9])0\s*대', text)
        return min(max(int(m.group(1)) * 10, 20), 60) if m else None

    mate = find_one(message, MATE_WORDS) or find_one(recent, MATE_WORDS, '친구')
    age = find_age(message)                       # 이번 질문에 나온 연령대가 우선
    if age is None and find_one(message, MATE_WORDS) == '부모님':
        age = 60                                  # '부모님과' → 60대 인기 관광지
    if age is None:
        age = find_age(recent)
    return {
        'region': region, 'sigungu': sigungu, 'age': age, 'mate': mate,
        'days': find_one(message, DAY_WORDS) or find_one(recent, DAY_WORDS, '1박2일'),
        'category': find_one(message, CATEGORY_WORDS),
    }


# 우리 팀 데이터에서 조건에 맞는 관광지 고르기 ---------------------------
def pick_tours(cond, limit=15):
    qs = Tour.objects.filter(region=cond['region']).exclude(category='교통시설')
    if cond['sigungu']:
        qs = qs.filter(sigungu__startswith=cond['sigungu'])
    if cond['age']:
        qs = qs.filter(age=cond['age'])

    # 같은 관광지가 연령대별로 여러 줄 → 비율 평균으로 하나로 합치기
    spots = {}
    for t in qs:
        s = spots.setdefault(t.name, {'name': t.name, 'sigungu': t.sigungu, 'category': t.category,
                                      'lat': t.lat, 'lng': t.lng, 'ratios': []})
        s['ratios'].append(t.ratio)
    result = []
    for s in spots.values():
        s['ratio'] = round(sum(s['ratios']) / len(s['ratios']), 1)
        s['bonus'] = 1 if cond['category'] and s['category'] == cond['category'] else 0
        result.append(s)
    result.sort(key=lambda s: (s['bonus'], s['ratio']), reverse=True)
    return result[:limit]


def distance(a, b):
    lat1, lng1, lat2, lng2 = map(math.radians, [a['lat'], a['lng'], b['lat'], b['lng']])
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


# AI 호출 ----------------------------------------------------------
SYSTEM_PROMPT = """당신은 국내여행 플랫폼 'TravelMate'의 맞춤추천 AI 챗봇 '트래비'입니다.
- 친절하고 간결한 존댓말로 답하세요. 이모지는 가끔만 쓰세요.
- 여행코스를 요청받으면 날짜별로 '**1일차**' 처럼 굵게 제목을 달고, 각 장소는 '- 10:00 장소명 : 한 줄 팁' 형식으로 쓰세요.
- [참고 관광지]는 한국관광데이터랩의 연령대별 인기 관광지 데이터입니다. '비율'은 그 연령대 방문객의 관심 비율(%)입니다.
  이 장소들을 우선 사용하고, 좌표를 보고 가까운 곳끼리 묶어 동선을 짜세요. 인기 이유를 말할 때 비율을 근거로 들어도 좋습니다.
- 식사·카페는 특정 가게 이름 대신 '근처 시장에서 점심' 처럼 일반적으로 안내하세요.
- 정보가 부족하면(지역, 기간, 동행, 연령대 등) 짧게 되물어 보세요.
- 운영시간·요금처럼 바뀔 수 있는 정보는 방문 전 확인하라고 안내하세요.
- 여행과 관계없는 질문에는 여행 상담 챗봇이라 답하기 어렵다고 정중히 말하세요.
- 답변 맨 마지막 줄에는 사용자가 이어서 물어볼 만한 짧은 질문 3개를 아래 형식으로 쓰세요.
추천질문: 질문1 | 질문2 | 질문3"""


def ai_ready():
    provider = os.getenv('AI_PROVIDER', 'anthropic').lower()
    key = os.getenv('OPENAI_API_KEY') if provider == 'openai' else os.getenv('ANTHROPIC_API_KEY')
    return bool(key)


def call_ai(system, messages):
    provider = os.getenv('AI_PROVIDER', 'anthropic').lower()

    if provider == 'openai':
        res = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={'Authorization': f"Bearer {os.getenv('OPENAI_API_KEY')}"},
            json={'model': os.getenv('AI_MODEL') or 'gpt-4o-mini',
                  'messages': [{'role': 'system', 'content': system}] + messages},
            timeout=60,
        )
        res.raise_for_status()
        return res.json()['choices'][0]['message']['content']

    res = requests.post(
        'https://api.anthropic.com/v1/messages',
        headers={'x-api-key': os.getenv('ANTHROPIC_API_KEY'),
                 'anthropic-version': '2023-06-01', 'content-type': 'application/json'},
        json={'model': os.getenv('AI_MODEL') or 'claude-sonnet-5-5', 'max_tokens': 2000,
              'system': system, 'messages': messages},
        timeout=60,
    )
    res.raise_for_status()
    return res.json()['content'][0]['text']


# 답변 끝의 "추천질문: a | b | c" 를 분리
def split_suggestions(text):
    lines = text.strip().split('\n')
    if lines and lines[-1].strip().startswith('추천질문'):
        items = lines[-1].split(':', 1)[-1].split('|')
        return '\n'.join(lines[:-1]).strip(), [i.strip() for i in items if i.strip()][:3]
    return text.strip(), []


def ai_reply(history, message, cond):
    system = SYSTEM_PROMPT + f"\n\n오늘 날짜: {datetime.date.today()} (계절: {this_season()})"
    if cond['region']:
        age_txt = f"{cond['age']}대" if cond['age'] else '전 연령 평균'
        place = REGION_NAME[cond['region']] + (f" {cond['sigungu']}" if cond['sigungu'] else '')
        spots = '\n'.join(f"- {s['name']} ({s['sigungu']}, {s['category']}) 비율:{s['ratio']}% 좌표:{s['lat']},{s['lng']}"
                          for s in pick_tours(cond))
        system += f"\n\n[참고 관광지 - {place}, {age_txt}]\n{spots}"

    messages = history + [{'role': 'user', 'content': message}]
    return split_suggestions(call_ai(system, messages))


# 기본 응답 (AI 키가 없을 때) ----------------------------------------
def basic_reply(message, cond):
    if any(w in message for w in ['안녕', '하이', '반가', '처음']):
        return ('안녕하세요! TravelMate 맞춤추천 AI **트래비**예요.\n'
                '가고 싶은 지역, 기간, 연령대, 누구와 가는지 알려주시면 연령대별 인기 관광지 데이터로 코스를 짜 드릴게요.'), QUICK_START[:3]

    if not cond['region']:
        names = ', '.join(name for _, name in REGIONS)
        return (f'어느 지역으로 여행을 가시나요?\n전국 17개 시·도를 안내해 드릴 수 있어요.\n({names})'), \
               ['부산 여행 추천해줘', '제주 2박3일 코스', '강원 당일치기']

    days = {'당일치기': 1, '1박2일': 2, '2박3일': 3}[cond['days']]
    picks = pick_tours(cond, 4 * days)
    if not picks:
        return '조건에 맞는 관광지 데이터를 찾지 못했어요. 지역이나 연령대를 바꿔서 물어봐 주세요.', ['다른 지역 추천해줘']

    # 가까운 곳끼리 순서 정하기 (최근접 이웃)
    route = [picks.pop(0)]
    while picks:
        nxt = min(picks, key=lambda p: distance(route[-1], p))
        picks.remove(nxt)
        route.append(nxt)

    age_txt = f"{cond['age']}대" if cond['age'] else '전 연령'
    place = REGION_NAME[cond['region']] + (f" {cond['sigungu']}" if cond['sigungu'] else '')
    lines = [f"**{place} {cond['days']}** 코스예요.", f"{age_txt} 방문객에게 인기 있는 관광지를 가까운 곳끼리 묶었어요.", '']
    base, extra = divmod(len(route), days)
    start = 0
    for d in range(days):
        size = base + (1 if d < extra else 0)
        items = route[start:start + size]
        start += size
        if not items:
            continue
        lines.append(f'**{d + 1}일차**')
        t = 10 * 60
        for it in items:
            lines.append(f"- {t // 60:02d}:{t % 60:02d} {it['name']} : {it['sigungu']} · {it['category']} · 인기 비율 {it['ratio']}%")
            t += 120
        lines.append('')
    lines.append('운영시간과 휴무일은 방문 전에 꼭 확인해 주세요.')

    region = re.sub(r'(시|군)$', '', cond['sigungu']) if cond['sigungu'] else REGION_NAME[cond['region']]
    other_day = '당일치기' if cond['days'] != '당일치기' else '1박2일'
    other_age = '60대' if cond['age'] != 60 else '20대'
    return '\n'.join(lines), [f'{region} {other_day}로 바꿔줘', f'{other_age} 기준으로 다시 짜줘', '다른 지역 추천해줘']


# 최종 --------------------------------------------------------------
def get_reply(history, message):
    cond = read_condition(history, message)
    if ai_ready():
        try:
            text, chips = ai_reply(history, message, cond)
            return text, chips, True
        except Exception as e:
            print('AI 호출 실패 → 기본 응답으로 대체:', e)
    text, chips = basic_reply(message, cond)
    return text, chips, False
