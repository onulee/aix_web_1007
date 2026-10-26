from django.shortcuts import render
from customer.models import Board

def cview(request,bno):
    qs = Board.objects.filter(bno=bno)[0]
    print('확인 : ',qs)
    context = {'board':qs}
    return render(request, 'cview.html',context)

def clist(request):
    qs = Board.objects.all().order_by('-bgroup','bstep')
    print('확인 : ',qs)
    context = {'list':qs}
    return render(request, 'clist.html',context)

# html -> django
# 1.form 2.url path 3.파라미터 4.ajax(자바스크립트)
