from django.shortcuts import render

# 메인페이지 - templates>index.html
def index(request):
    return render(request,'index.html')
