"""
Main URL Configuration
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    # ── Django admin ──────────────────────────────────────────
    path('admin/', admin.site.urls),

    # ── REST API (must come before SPA catch-all) ─────────────
    path('api/', include('api.urls')),

    # ── Static files (public/) ────────────────────────────────
] + static(settings.STATIC_URL, document_root=settings.BASE_DIR / 'public') + [

    # ── SPA catch-all: serve index.html for every other route ─
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    re_path(r'^(?!api/|admin/|static/).*$',
            TemplateView.as_view(template_name='index.html'), name='spa'),
]
