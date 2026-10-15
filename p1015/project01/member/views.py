from django.shortcuts import render
from member.models import Member

# 로그아웃페이지
def logout(request):
    request.session.clear() #섹션모두삭제
    # del request.session['session_nickname'] #섹션 1개만 삭제
    context = {'temp':2}
    return render(request, 'login.html', context) 


# GET,POST
def login(request):
    if request.method == 'GET':
        return render(request, 'login.html')
    elif request.method == 'POST':
        id = request.POST.get('id')
        pw = request.POST.get('pw')
        # 회원확인2
        qs = Member.objects.filter(id=id,pw=pw).first() # qs, None
        if qs:
            # 섹션추가
            request.session['session_id'] = qs.id
            request.session['session_nickname'] = qs.nickname
            context = {'temp':1}
        else:
            context = {'temp':0}    
        
        # try:
        #     qs = Member.objects.get(id=id,pw=pw) #db에 id,pw 회원확인
        #     #섹션
        #     request.session['session_id'] = qs.id
        #     request.session['session_nickname'] = qs.nickname
        #     context = {'temp':1}
        # except Member.DoesNotExist:
        #     context = {'temp':0}   
        

        print(f'로그인정보 : {id},{pw} / 회원확인 : {context}')
        # python -> html : context
        # html -> python : form,url path,파라미터, 자바스크립트(ajax)
        return render(request, 'login.html', context) 


def step01(request):
    return render(request, 'step01.html')
def step02(request):
    return render(request, 'step02.html')
def step03(request):
    return render(request, 'step03.html')
def step04(request):
    return render(request, 'step04.html')
