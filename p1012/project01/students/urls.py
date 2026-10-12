from django.urls import path,include
from . import views

app_name='students'
urlpatterns = [
    path('swrite/', views.swrite, name='swrite'),
    path('slist/', views.slist, name='slist'),
    path('sview/<str:name>/', views.sview, name='sview'),
    path('supdate/<str:name>/', views.supdate, name='supdate'),
    path('sdelete/<str:name>/', views.sdelete, name='sdelete'),
]
