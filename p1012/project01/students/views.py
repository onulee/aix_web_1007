from django.shortcuts import render,redirect
from students.models import Students

# 학생정보리스트
def slist(request):
    # db에서 전체리스트 가져오기
    qs = Students.objects.all() #전체가져오기
    # qs = Students.objects.get(name='홍길동') # 1개
    # qs = Students.objects.filter(name__contains='홍') # 검색해서 여러개
    context = {'list':qs} #3개
    return render(request, 'slist.html',context)

# 학생정보입력페이지,저장
def swrite(request):
    if request.method == 'GET':
        return render(request, 'swrite.html')
    elif request.method == 'POST':
        name = request.POST.get('name') #데이터가 없어도 에러가 나지 않음
        major = request.POST.get('major')
        age = request.POST.get('age')
        grade = request.POST.get('grade')
        gender = request.POST.get('gender')
        # 1. save()
        qs = Students(name=name,major=major,age=age,grade=grade,gender=gender)
        qs.save()
        # 2. create()
        # Students.objects.create(name=name,major=major,age=age,grade=grade,gender=gender)
        print(f'확인 : {name},{major}')

        # major = request.POST['major']   #데이터가 없을때 에러남
        return redirect('/students/slist')


