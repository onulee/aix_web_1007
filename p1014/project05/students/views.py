from django.shortcuts import render,redirect
from students.models import Students

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
    qs = Students.objects.all().order_by('-no')
    context = {'list':qs}
    return render(request, 'slist.html',context)
