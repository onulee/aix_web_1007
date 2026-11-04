from django.shortcuts import render
from django.http import JsonResponse
from chatbot import ai


# 맞춤추천 AI - 채팅 화면 (새로고침해도 이전 대화가 보이도록 세션의 대화를 넘겨준다)
def index(request):
    context = {
        'history': request.session.get('chat', []),
        'quick': ai.QUICK_START,
        'ai_ready': ai.ai_ready(),
    }
    return render(request, 'chat.html', context)


# ajax - 질문 → 답변
def ask(request):
    message = request.POST.get('message', '').strip()[:500]
    if not message:
        return JsonResponse({'result': '실패', 'msg': '질문을 입력하세요.'})

    history = request.session.get('chat', [])
    text, chips, ai_used = ai.get_reply(history, message)

    # 세션에 대화 저장 (최근 20개만)
    history += [{'role': 'user', 'content': message}, {'role': 'assistant', 'content': text}]
    request.session['chat'] = history[-20:]

    return JsonResponse({'result': '성공', 'answer': text, 'chips': chips, 'ai': ai_used})


# ajax - 대화 초기화
def reset(request):
    request.session['chat'] = []
    return JsonResponse({'result': '성공'})
