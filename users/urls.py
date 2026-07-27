from django.contrib import admin
from django.urls import path, include
#Connect Urls with Views
from users import views as user_views #import views of multiple app
from django.contrib.auth import views as auth_views #import views of multiple app

from django.urls import path
from . import views

urlpatterns = [
    path('register/', user_views.register, name='register'),
    path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(template_name='logout.html'), name='logout'),
]   
