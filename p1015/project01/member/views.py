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
        context = {}
        if request.COOKIES.get('cookie_id'): #없을때 None
            context = {'cookie_id':request.COOKIES.get('cookie_id')} #idsave = 'chk'
        return render(request, 'login.html',context)
    elif request.method == 'POST':
        id = request.POST.get('id')
        pw = request.POST.get('pw')
        idsave = request.POST.get('idsave','') # idsave,없을때 빈공백처리
        # 회원확인2
        qs = Member.objects.filter(id=id,pw=pw).first() # qs, None
        if qs:
            # 섹션추가
            request.session['session_id'] = qs.id
            request.session['session_nickname'] = qs.nickname
            context = {'temp':1}
        else:
            context = {'temp':0}    

        print(f'로그인정보 : {id},{pw},{idsave} / 회원확인 : {context}')
        # 쿠키사용을 위해 분리
        response = render(request, 'login.html', context) 
        if idsave != '':
            response.set_cookie('cookie_id',id,max_age=60*60*24*365)
        else:
            response.delete_cookie('cookie_id')    
        return response    

        #########################################################
        # try:
        #     qs = Member.objects.get(id=id,pw=pw) #db에 id,pw 회원확인
        #     #섹션
        #     request.session['session_id'] = qs.id
        #     request.session['session_nickname'] = qs.nickname
        #     context = {'temp':1}
        # except Member.DoesNotExist:
        #     context = {'temp':0}   
        #########################################################
        

        


def step01(request):
    return render(request, 'step01.html')
def step02(request):
    return render(request, 'step02.html')
def step03(request):
    return render(request, 'step03.html')
def step04(request):
    return render(request, 'step04.html')
