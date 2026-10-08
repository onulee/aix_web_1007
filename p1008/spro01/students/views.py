from django.shortcuts import render,redirect

# 학생성적입력
def swrite(request):
    if request.method == 'GET':
        return render(request,'swrite.html')
    elif request.method == 'POST':
        print(request.POST.get('name'))
        print(request.POST.get('major'))
        print(request.POST.get('grade'))
        print(request.POST.get('age'))
        print(request.POST.get('gender'))
        return redirect('/students/slist/')
    # elif request.method == 'PUT':
    #     pass
    # elif request.method == 'DELETE':
    #     pass

# 학생성적리스트
def slist(request):
    return render(request,'slist.html')
