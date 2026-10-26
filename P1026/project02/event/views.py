from django.shortcuts import render

def event(request):
    return render(request, 'event.html')

def eview(request,eno):
    print('확인 : ',eno)
    return render(request, 'eview.html')
