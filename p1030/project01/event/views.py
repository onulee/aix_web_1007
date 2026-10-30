from django.shortcuts import render
from event.models import Event
from comment.models import Comment
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from member.models import Member

# ajax : 좋아요 - 추가,취소
def likes(request):
    id = request.session['session_id']
    member = Member.objects.get(id=id)
    eno = request.POST.get('eno')
    print('확인 : ',id,eno)

    context = {'result':1}
    return JsonResponse(context)

# 이벤트리스트
def event(request):
    qs = Event.objects.all().order_by('-eno')
    context = {'list':qs}
    return render(request, 'event.html', context)

# 이벤트 view
def eview(request,eno):
    print('확인 : ',eno)
    qs = Event.objects.filter(eno=eno)[0]
    # ForeignKey : event
    qs2 = Comment.objects.filter(event=qs).order_by('-cno')
    qs2_count = qs2.count() # 댓글전체개수
    context = {'event':qs, 'commlist':qs2,'count':qs2_count}
    return render(request, 'eview.html', context)
