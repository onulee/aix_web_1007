from django.urls import path,include
from . import views

app_name='event'
urlpatterns = [
    # 좋아요-추가,취소
    path('likes/', views.likes, name='likes'),
    
    path('event/', views.event, name='event'),
    path('eview/<int:eno>/', views.eview, name='eview'),
]
