from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST
from .models import Question


# =====================================
# 자주 묻는 질문
# =====================================

FAQ = [
    (
        '데이터 기준',
        '연령대별 관광지 TOP10 순위는 어떤 기준인가요?',
        '한국관광데이터랩의 내비게이션 검색 데이터를 기준으로 제공합니다.'
    ),
    (
        '데이터 기준',
        '데이터는 실시간으로 업데이트되나요?',
        '현재는 프로젝트에서 준비한 CSV 파일을 기준으로 표시됩니다.'
    ),
    (
        '대시보드 기능',
        '관광지를 선택하면 무엇을 볼 수 있나요?',
        '해당 관광지의 위치를 카카오맵에서 확인할 수 있습니다.'
    ),
    (
        '지역·연령 분석',
        '다른 지역과 연령대도 선택할 수 있나요?',
        '지역과 연령대를 변경하면 해당 조건의 관광지 TOP10을 확인할 수 있습니다.'
    ),
    (
        '대시보드 기능',
        '관광지 상세 팝업은 무엇인가요?',
        '관광지의 사진과 소개 등을 확인할 수 있도록 구성한 화면입니다.'
    ),
    (
        '대시보드 기능',
        '관광지 순위가 높으면 실제 방문객도 많다는 뜻인가요?',
        '반드시 그렇지는 않습니다. 여행메이트의 순위는 내비게이션 검색 데이터를 기반으로 하기 때문에 실제 방문객 수와 차이가 있을 수 있습니다.'
    ),
    (
        '지역·연령 분석',
        '연령대별 인기 관광지가 다른 이유는 무엇인가요?',
        '연령대에 따라 선호하는 여행 활동과 관심사가 다를 수 있기 때문입니다. 여행메이트에서는 20대부터 60대까지 연령대별 인기 관광지를 비교하며 여행 트렌드를 살펴볼 수 있습니다.'
    ),
    
]

# =====================================
# FAQ + 질문 목록
# =====================================

def index(request):

    # event에서 배운 게시글 목록 방식
    qs = Question.objects.all().order_by('-id')

    context = {
        'faq': FAQ,
        'questions': qs,
    }

    return render(request, 'qna.html', context)


# =====================================
# 질문 상세 보기
# =====================================

def qview(request, qno):

    # event에서 배운 filter 방식
    qs = get_object_or_404(Question, id=qno)

    context = {
        'question': qs,
    }

    return render(request, 'qview.html', context)


# =====================================
# 질문 작성
# =====================================

@require_POST
def ask(request):

    title = request.POST.get('title', '').strip()
    author = request.POST.get('author', '').strip()
    content = request.POST.get('content', '').strip()

    if title and author and content:

        Question.objects.create(
            title=title[:200],
            author=author[:50],
            content=content,
        )

    return redirect('qna:index')