"""
Django Apps Configuration
"""
from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name               = 'api'
    verbose_name       = 'AI Student Productivity API'

    def ready(self):
        """Initialize scheduler when app starts."""
        try:
            from .scheduler import start_scheduler
            start_scheduler()
        except Exception:
            pass   # Ignore on migrations / tests
