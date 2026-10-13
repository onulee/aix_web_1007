from django.shortcuts import render,redirect
from students.models import Students

# 학생정보리스트
def slist(request):
    # 딕셔너리 형태로 데이터를 전달함.
    qs = Students.objects.all().order_by('-no') # 전체가져오기, 정렬(-역순정렬)
    # qs = Students.objects.get(name='홍길동') # 1개 가져오기
    # qs = Students.objects.filter(name__contains='s') # s가 포함되어 있는 학생

    context = {'list':qs}
    return render(request, 'slist.html',context)



# 학생정보입력페이지 - form전달
def swrite(request):
    if request.method == 'GET':
        return render(request, 'swrite.html')
    elif request.method == 'POST': #1. form값전달
        name = request.POST.get('name')
        major = request.POST.get('major')
        grade = request.POST.get('grade')
        age = request.POST.get('age')
        gender = request.POST.get('gender')
        hobby = request.POST.getlist('hobby')  # checkbox 값이 여러개
        # save저장
        Students(name=name,major=major,grade=grade,age=age,gender=gender,hobby=hobby).save()
        # create저장
        # Students.objects.create(name=name,major=major,grade=grade,age=age,\
        #                         gender=gender,hobby=hobby)
        print(name,major,grade,age,gender,hobby)
        return redirect('/')

#---------------------------------------

# 학생정보입력 - 파라미터
# def swrite3(request):
#     name = request.GET.get('name') 
#     age = request.GET.get('age') 
#     print(f'파라미터 : {name},{age}')
#     return redirect('/')

# # 학생정보입력 - url path : 매개변수로 값전달
# def swrite2(request,name):
#     print(f'url path 값전달 : {name}')
#     return redirect('/')
    
