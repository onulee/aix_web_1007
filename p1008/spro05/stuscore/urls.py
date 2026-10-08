from django.urls import path,include
from . import views

app_name='stuscore'
urlpatterns = [
    path('score_write/', views.score_write, name='score_write'),
]