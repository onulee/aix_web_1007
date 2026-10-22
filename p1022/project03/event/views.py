from django.shortcuts import render

def event(request):
    return render(request, 'event.html')
