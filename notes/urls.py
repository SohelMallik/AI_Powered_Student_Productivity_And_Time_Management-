from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('',              views.homepage,     name='homepage'),
    path('about/',        views.aboutus,      name='aboutus'),
    path('contactus/',    views.contact,      name='contact'),
    path('subbmit_contact/', views.submit_contact, name='submit_contact'),

    # Auth-protected — Task management (Terms 1, 3, 5, 8, 10, 12)
    path('todolist/',                             views.todolist,     name='todolist'),
    path('todolist/delete/<int:task_id>/',        views.delete_task,  name='delete_task'),
    path('todolist/edit/<int:task_id>/',          views.edit_task,    name='edit_task'),
    path('todolist/complete/<int:task_id>/',      views.complete_task, name='complete_task'),
    path('todolist/pending/<int:task_id>/',       views.pending_task,  name='pending_task'),

    # Dashboard — AI analysis (Terms 6, 7, 9, 10, 13, 14)
    path('dashboard/',    views.dashboard,    name='dashboard'),

    # Semester plan (Terms 11, 13)
    path('studyplan/',    views.semester_plan,       name='semester_plan'),
    path('studyplan/delete/<int:plan_id>/', views.delete_semester_plan, name='delete_semester_plan'),

    # AI — Automatic Study Plan Generator (Gemini)
    path('ai-study-plan/', views.ai_generate_study_plan, name='ai_study_plan'),
]
