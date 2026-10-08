from django.shortcuts import render

def score_write(request):
    return render(request, 'score_write.html')