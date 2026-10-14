from django.shortcuts import render,redirect
from member.models import Member

# 로그아웃페이지
def logout(request):
    request.session.clear() #섹션모두삭제
    context = {'temp':2} 
    return render(request, 'login.html', context)

# 로그인페이지 - session : 서버에 저장, cookie : 로컬컴퓨터에 저장
def login(request):
    if request.method == 'GET':
        return render(request, 'login.html')
    elif request.method == 'POST':
        id = request.POST.get('id')
        pw = request.POST.get('pw')
        print(f'로그인정보 : {id},{pw}')
        try:
            qs = Member.objects.get(id=id,pw=pw)   # id='aaa' and pw='1111' / 없으면:None
            request.session['session_id'] = qs.id  #섹션저장
            request.session['session_nickname'] = qs.nickname
            print('로그인이 되었습니다.')
            context = {'temp':1}   
            return render(request, 'login.html',context)
        except Member.DoesNotExist:
            print('아이디 또는 패스워드가 일치하지 않습니다. 다시 로그인하세요.') 
            context = {'temp':0}   
            return render(request, 'login.html',context)

        
        