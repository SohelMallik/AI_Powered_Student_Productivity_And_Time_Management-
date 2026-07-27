from django import forms
from todolist.models import Task, StudySession, SemesterPlan


class TaskForm(forms.ModelForm):
    is_completed = forms.BooleanField(required=False, label="Completed")
    due_date = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
        label="Due Date"
    )

    class Meta:
        model = Task
        fields = ['task', 'priority', 'category', 'due_date', 'reminder', 'notes', 'is_completed']
        widgets = {
            'task':     forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Describe the task...'}),
            'priority': forms.Select(attrs={'class': 'form-select'}),
            'category': forms.Select(attrs={'class': 'form-select'}),
            'reminder': forms.Select(attrs={'class': 'form-select'}),
            'notes':    forms.Textarea(attrs={'class': 'form-control', 'rows': 2,
                                              'placeholder': 'Optional study notes...'}),
        }


class StudySessionForm(forms.ModelForm):
    session_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
        label="Date"
    )

    class Meta:
        model = StudySession
        fields = ['subject', 'duration_minutes', 'session_date', 'technique', 'notes']
        widgets = {
            'subject':          forms.TextInput(attrs={'class': 'form-control',
                                                        'placeholder': 'e.g. Mathematics'}),
            'duration_minutes': forms.NumberInput(attrs={'class': 'form-control',
                                                          'placeholder': 'Minutes studied'}),
            'technique':        forms.Select(attrs={'class': 'form-select'}),
            'notes':            forms.Textarea(attrs={'class': 'form-control', 'rows': 2,
                                                       'placeholder': 'Optional notes...'}),
        }


class SemesterPlanForm(forms.ModelForm):
    start_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'})
    )
    end_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'})
    )

    class Meta:
        model = SemesterPlan
        fields = ['title', 'semester', 'goal', 'start_date', 'end_date']
        widgets = {
            'title':    forms.TextInput(attrs={'class': 'form-control',
                                               'placeholder': 'e.g. Semester 2 — Computer Science'}),
            'semester': forms.TextInput(attrs={'class': 'form-control',
                                               'placeholder': 'e.g. Spring 2025'}),
            'goal':     forms.Textarea(attrs={'class': 'form-control', 'rows': 3,
                                              'placeholder': 'What do you want to achieve this semester?'}),
        }
