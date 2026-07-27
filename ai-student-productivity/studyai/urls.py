"""
Main URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.http import FileResponse
import os

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),

    # All API routes
    path('api/', include('api.urls')),

    # Serve the SPA index.html for everything else
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('<path:path>', TemplateView.as_view(template_name='index.html'), name='spa'),
] + static(settings.STATIC_URL, document_root=settings.BASE_DIR / 'public')
