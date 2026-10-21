from django.urls import path,include
from . import views

app_name='screen'
urlpatterns = [
    # 카카오맵
    path('map/', views.map, name='map'),
    
    # 영화차트그래프
    path('chart/', views.chart, name='chart'),
    # 영화차트그래프 - ajax
    path('chart_data/', views.chart_data, name='chart_data'),

]
