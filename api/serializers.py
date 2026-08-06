"""
Django REST Framework Serializers
"""
from rest_framework import serializers
from .models import Task, ScheduleSlot, StudySession, Course, SemesterEvent, Goal, UserProfile, DailyLog


class TaskSerializer(serializers.ModelSerializer):
    priority = serializers.SerializerMethodField()

    class Meta:
        model  = Task
        fields = '__all__'

    def get_priority(self, obj):
        from .ai_engine import calculate_priority
        return calculate_priority(obj)

#SchudleSlot
class ScheduleSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ScheduleSlot
        fields = '__all__'


class StudySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = StudySession
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Course
        fields = '__all__'


class SemesterEventSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SemesterEvent
        fields = '__all__'


class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Goal
        fields = '__all__'


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserProfile
        fields = '__all__'


class DailyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DailyLog
        fields = '__all__'
