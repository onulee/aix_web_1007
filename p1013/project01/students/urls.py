from django.urls import path,include
from . import views

app_name='students'
urlpatterns = [
    path('swrite/', views.swrite, name='swrite'),
    path('slist/', views.slist, name='slist'),

    
    #------------------------------------------------------
    # html에서 디장고로 값전달방법 - urlpath, 파라미터방식
    # path('swrite2/<str:name>/', views.swrite2, name='swrite2'),
    # path('swrite3/', views.swrite3, name='swrite3'),
]
