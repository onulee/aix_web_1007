from django.urls import path
from . import views

app_name = 'qna'

urlpatterns = [

    # FAQ + 질문 목록
    path('', views.index, name='index'),

    # 질문 작성
    path('ask/', views.ask, name='ask'),

    # 질문 상세 보기
    path('qview/<int:qno>/', views.qview, name='qview'),

]