from django.urls import path,include
from . import views

app_name='comment'
urlpatterns = [
    path('commlist/', views.commlist, name='commlist'),
    # ajax 댓글쓰기
    path('commWrite/', views.commWrite, name='commWrite'),
    # ajax 댓글삭제
    path('commDelete/', views.commDelete, name='commDelete'),
    # ajax 댓글수정저장
    path('commUpdate/', views.commUpdate, name='commUpdate'),
]
