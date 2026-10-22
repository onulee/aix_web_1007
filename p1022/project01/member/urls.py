from django.urls import path,include
from . import views

app_name='member'
urlpatterns = [
    path('step01/', views.step01, name='step01'),
    # 이메일전송
    path('emailsend/', views.emailsend, name='emailsend'),
    # 이메일전송후 인증키확인
    path('ekey/', views.ekey, name='ekey'),
]
