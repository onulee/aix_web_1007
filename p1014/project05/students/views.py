from django.shortcuts import render,redirect
from students.models import Students
from django.db.models import Q

def swrite(request):
    if request.method == 'GET':
        return render(request, 'swrite.html')
    elif request.method == 'POST':
        name = request.POST.get('name')
        major = request.POST.get('major')
        grade = request.POST.get('grade')
        age = request.POST.get('age')
        gender = request.POST.get('gender')
        hobby = request.POST.getlist('hobby')
        Students(name=name,major=major,grade=grade,age=age,gender=gender,hobby=hobby).save()
        return redirect('students:slist')

# 학생성적리스트
def slist(request):
    if request.method == 'GET':
        qs = Students.objects.all().order_by('-no')
        context = {'list':qs}
        return render(request, 'slist.html',context)
    if request.method == 'POST':
        type = request.POST.get('type')
        keyword = request.POST.get('keyword')

        condition = (
            Q(name__contains=keyword) | 
            Q(major__contains=keyword)|
            Q(no__contains=keyword)|
            Q(grade__contains=keyword)
        )

        # |= or를 추가 
        # if keyword.isdigit():
        #     condition |= Q(no=int(keyword))

        qs = Students.objects.filter(condition)
        # qs = Students.objects.filter(name__contains = keyword)

        print(f'검색어 : {type},{keyword}')
        context = {'list':qs}
        return render(request, 'slist.html',context)
