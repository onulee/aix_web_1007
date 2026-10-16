from django.shortcuts import render
from member.models import Member
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password


def logout(request):
    request.session.clear() #섹션 모두삭제
    context = {'temp':2}
    return render(request,'login.html',context)


# get,post
def login(request):
    if request.method == 'GET':
        input_id = '1111'
        hash_id = make_password(input_id)
        print("해쉬비밀번호 : ",input_id,hash_id)
        print("해쉬확인",check_password(input_id, hash_id))
        
        # 쿠키확인 ============================
        cook_id = request.COOKIES.get('cook_id','')
        context = {'cook_id':cook_id}
        return render(request, 'login.html',context)
    elif request.method == 'POST':
        id = request.POST.get('id')
        pw = request.POST.get('pw')
        rememberId = request.POST.get('rememberId')
        qs = Member.objects.filter(id=id,pw=pw).first()
        # 섹션설정 ============================
        if qs:
            request.session['se_id'] = id
            request.session['se_nickname'] = qs.nickname
            context = {'temp':1}
        else: context = {'temp':0}
        
        reponse = render(request, 'login.html',context)
        # 쿠키설정 ============================
        if rememberId: reponse.set_cookie('cook_id',id,max_age=60*60)
        else: reponse.delete_cookie('cook_id')    
        
        print(f'데이터확인 : {id},{pw},{rememberId},{context}')
        return reponse
