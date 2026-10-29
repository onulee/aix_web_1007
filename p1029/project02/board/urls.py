from django.urls import path,include
from . import views

app_name='board'
urlpatterns = [
    path('chart/', views.chart, name='chart'),
    path('chart_data/', views.chart_data, name='chart_data'),


    path('bwrite/', views.bwrite, name='bwrite'),
    path('blist/', views.blist, name='blist'),
    path('bview/<int:bno>/', views.bview, name='bview'),
    path('likes/', views.likes, name='likes'),
    path('bupdate/<int:bno>/', views.bupdate, name='bupdate'),
    path('bdelete/<int:bno>/', views.bdelete, name='bdelete'),
]
