"""
Main URL Configuration – serves SPA + API + static files
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.generic import TemplateView
from django.views.static import serve
import os

urlpatterns = [
    # ── Django Admin ──────────────────────────────────────────
    path('admin/', admin.site.urls),

    # ── REST API ──────────────────────────────────────────────
    path('api/', include('api.urls')),

    # ── Serve all files inside public/ at /static/ ────────────
    re_path(r'^static/(?P<path>.*)$', serve,
            {'document_root': settings.BASE_DIR / 'public'}),

    # ── Serve CSS directly (no /static/ prefix needed) ────────
    re_path(r'^css/(?P<path>.*)$', serve,
            {'document_root': settings.BASE_DIR / 'public' / 'css'}),

    re_path(r'^js/(?P<path>.*)$', serve,
            {'document_root': settings.BASE_DIR / 'public' / 'js'}),

    re_path(r'^assets/(?P<path>.*)$', serve,
            {'document_root': settings.BASE_DIR / 'public' / 'assets'}),

    # ── SPA Home (must be LAST) ───────────────────────────────
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    re_path(r'^(?!api/|admin/|static/|css/|js/|assets/).*$',
            TemplateView.as_view(template_name='index.html'), name='spa'),
]
