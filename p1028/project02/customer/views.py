from django.shortcuts import render
from customer.models import Board
from django.utils import timezone
from datetime import timedelta

def cview(request,bno):
    qs = Board.objects.filter(bno=bno)[0]
    print('확인 : ',qs)
    context = {'board':qs}
    return render(request, 'cview.html',context)

def clist(request):
    qs = Board.objects.all().order_by('-bgroup','bstep')
    # 1일 확인 :new아이콘 추가
    now = timezone.now()
    for board in qs:
        board.is_new = (
            board.bdate >= now - timedelta(days=1)
            and board.bdate <= now
        )
    print('확인 : ',qs)
    context = {'list':qs}
    return render(request, 'clist.html',context)

# html -> django
# 1.form 2.url path 3.파라미터 4.ajax(자바스크립트)
