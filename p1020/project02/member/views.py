from django.shortcuts import render
from member.models import Member

# 로그아웃페이지
def logout(request):
    # 섹션모두삭제
    request.session.clear()
    context = {'temp':2}
    return render(request,'login.html',context)

#GET - 로그인페이지, POST - 로그인 확인
def login(request):
    if request.method == 'GET':
        return render(request, 'login.html')
    elif request.method == 'POST':
        id = request.POST.get('id')
        pw = request.POST.get('pw')
        qs = Member.objects.filter(id=id,pw=pw).first()
        if qs:
            request.session['session_id'] = id
            request.session['session_nickname'] = qs.nickname
            context = {'temp':1}
        else:
            context = {'temp':0}     
        print(f'데이터 확인 : {id},{pw},{context},{qs}')    
        return render(request, 'login.html',context)

