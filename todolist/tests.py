from django.test import TestCase
from django.urls import reverse

from .models import Task


class TaskEditTests(TestCase):
    def test_edit_page_keeps_completed_status_visible(self):
        task = Task.objects.create(task="Write report", is_completed=True)

        response = self.client.get(reverse("edit_task", args=[task.id]))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'name="is_completed"')
        self.assertContains(response, 'checked')
