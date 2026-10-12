from django.shortcuts import render,redirect
from students.models import Students

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

def slist(request):
    return render(request, 'slist.html')
