from django.urls import path,include
from . import views
urlpatterns = [
    path('s_write/', views.s_write), # students app안에 urls를 찾아감.
]