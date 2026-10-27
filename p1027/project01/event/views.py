from django.shortcuts import render
from event.models import Event
from comment.models import Comment

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
    context = {'event':qs, 'commlist':qs2}
    return render(request, 'eview.html', context)
