from django.shortcuts import render
from screen.models import Screen
from django.db.models import F,Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# 카카오맵 ------------------------------------------------
def map(request):
    return render(request,'map.html')


# 차트그래프-------------------------------------------------
def chart(request):
    return render(request,'s_chart.html')

# 차트그래프 - ajax통신
def chart_data(request):
    search_word = request.POST.get('search_word','')
    qs = Screen.objects.filter\
        (Q(crevenue__gte=1160000000)|Q(title__contains=search_word)).values()[:6]
    r_qs = list(qs)
    context = {'list':r_qs}
    return JsonResponse(context)
# ------------------------------------------------------------