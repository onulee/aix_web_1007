from django.urls import path,include
from . import views

app_name='board'
urlpatterns = [
    path('bwrite/', views.bwrite, name='bwrite'),
    path('blist/', views.blist, name='blist'),
    path('bview/<int:bno>/', views.bview, name='bview'),
    path('bupdate/<int:bno>/', views.bupdate, name='bupdate'),
    path('bdelete/<int:bno>/', views.bdelete, name='bdelete'),
]
