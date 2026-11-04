from django.urls import path
from . import views

app_name = 'chatbot'
urlpatterns = [
    path('', views.index, name='index'),
    # ajax - 질문 보내기
    path('ask/', views.ask, name='ask'),
    # ajax - 대화 새로 시작
    path('reset/', views.reset, name='reset'),
]
