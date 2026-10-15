from django.shortcuts import render
from member.models import Member

def logout(request):
    request.session.clear() #섹션 모두삭제
    context = {'temp':2}
    return render(request,'login.html',context)


# get,post
def login(request):
    if request.method == 'GET':
        return render(request, 'login.html')
    elif request.method == 'POST':
        id = request.POST.get('id')
        pw = request.POST.get('pw')
        rememberId = request.POST.get('rememberId')
        qs = Member.objects.filter(id=id,pw=pw).first()
        if qs:
            request.session['se_id'] = id
            request.session['se_nickname'] = qs.nickname
            context = {'temp':1}
        else:
            context = {'temp':0}

        print(f'데이터확인 : {id},{pw},{rememberId},{context}')
        return render(request, 'login.html',context)
