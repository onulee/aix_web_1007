from django.shortcuts import render

# 이벤트 리스트
def event(request):
    return render(request, 'event.html')

# 이벤트 상세보기
def eview(request,eno):
    print('확인 : ',eno)
    return render(request, 'eview.html')
