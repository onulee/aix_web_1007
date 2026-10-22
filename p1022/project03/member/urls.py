from django.urls import path,include
from . import views

app_name='member'
urlpatterns = [
    # 이메일주소전송
    path('email/', views.email, name='email'),
    path('ekey/', views.ekey, name='ekey'),

    path('step01/', views.step01, name='step01'),
    path('step02/', views.step02, name='step02'),
]
