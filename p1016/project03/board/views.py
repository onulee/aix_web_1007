from django.shortcuts import render
from board.models import Board

def blist(request):
    qs = Board.objects.all()
    context = {'list':qs}
    return render(request,'blist.html',context)

# 글쓰기페이지연결:GET, 글쓰기저장 : POST
def bwrite(request):
    if request.method =='GET':
        return render(request,'bwrite.html')
    elif request.method == 'POST':
        btitle = request.POST.get('btitle')
        # bfile = request.POST.get('bfile')
        bfile = request.FILES.get('bfile')
        Board(btitle=btitle,bfile=bfile).save()
        print(f'데이터확인 : {btitle},{bfile}')
        return render(request,'bwrite.html')
        
