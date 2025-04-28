from math import ceil
import base64
import json
import os
import re
from io import BytesIO
from datetime import timedelta
from functools import lru_cache
from django.contrib.auth.hashers import make_password
from PIL import Image
from django.conf import settings
from django.core.cache import cache
from django.core.paginator import Paginator
from django.db.models import Q, Count, Case, When, IntegerField, F, Sum, Avg, ExpressionWrapper, FloatField, Value

from django.utils import timezone
from django.db import transaction
from rest_framework import status as http_status 
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, authentication_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import datetime, timedelta
from django.db.models.functions import Now, Cast, Coalesce, Round
from django.db.models import Sum, Count, Q, F, Avg, Func, DurationField,  ExpressionWrapper, F, FloatField,Prefetch  
from django.db.models.functions import ExtractDay, ExtractHour, ExtractMonth, ExtractYear , TruncDate
from django.utils import timezone
from datetime import datetime
from collections import Counter
from .auth import CustomJWTAuthentication
from .models import (
    Task, User, Project, ProjectState, Attendance, TaskLogs,
    Position, Role, LeaveRequest, WorkFromHomeRequest, Notification
)
from .serializers import (
    TaskSerializer, UserSerializer, ProjectSerializer,
    PositionSerializer, RoleSerializer, LeaveRequestSerializer, WorkFromHomeRequestSerializer
)

# Define common authentication and permission classes
AUTH_CLASSES = [CustomJWTAuthentication]
PERM_CLASSES = [IsAuthenticated]

# Cache frequently used data
@lru_cache(maxsize=128)
def get_cached_positions():
    return list(Position.objects.all().values('id', 'position_name'))

@lru_cache(maxsize=128)
def get_cached_roles():
    return list(Role.objects.all().values('id', 'RoleName'))

def delete_pattern(pattern):
    """
    Delete all cache keys that match the given pattern.
    This is a simple implementation for LocMemCache that mimics Redis' pattern deletion.
    """
    if not pattern or '*' not in pattern:
        # If no wildcard, just delete the specific key
        cache.delete(pattern)
        return
    
    # For LocMemCache, we need to iterate through all keys
    # This is inefficient but works for development
    if hasattr(cache, '_cache'):
        prefix = pattern.split('*')[0]  # Get the prefix before the wildcard
        keys_to_delete = [
            k for k in cache._cache.keys() 
            if isinstance(k, str) and k.startswith(prefix)
        ]
        for key in keys_to_delete:
            cache.delete(key)

# --- User Authentication Views ---
class UserRegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    user = User.objects.create(
                        UserName=serializer.validated_data['UserName'],
                        Email=serializer.validated_data['Email'],
                        Password=request.data['Password'],
                        EmployeeName=serializer.validated_data.get('EmployeeName', ''),
                    )
                return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        try:
            # Use select_related to fetch related objects in a single query
            user = User.objects.select_related('RoleID', 'PositionID').get(UserName=username)
            
            if user.Password == password:
                # Prepare payload with all necessary data
                custom_payload = {
                    'user_id': user.UserID,
                    'username': user.UserName,
                    'employee_name': user.EmployeeName,
                    'employee_id': user.EmployeeID,
                    'role': {
                        'id': user.RoleID.id,
                        'name': user.RoleID.RoleName
                    } if user.RoleID else None,
                    'position': {
                        'id': user.PositionID.id,
                        'name': user.PositionID.position_name
                    } if user.PositionID else None
                } 
                
                refresh = RefreshToken()
                for key, value in custom_payload.items():
                    refresh[key] = value
                    
                return Response({
                    'token': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': {
                        'id': user.UserID,
                        'username': user.UserName,
                        'email': user.Email
                    }
                })
            return Response(
                {'error': 'Invalid password'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        except User.DoesNotExist:
            return Response(
                {'error': f'User not found: {username}'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# --- Task Views ---
class TaskListView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES
    
    def get_queryset(self):
        queryset = Task.objects.all()
        mine = self.request.query_params.get('mine')
        if mine == 'true':
            # Get the currently authenticated user
            user = self.request.user
            # Filter tasks based on assigned user or other relevant criteria.
            # Adapt this to your actual Task model's fields.  
            # Example using an 'assigned_to' field:
            queryset = queryset.filter(AssignedUserID=user)
            #Example using creator field:
            #queryset = queryset.filter(created_by=user)

        return queryset

# --- Project Views ---
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES
    
    def get_queryset(self):
        # Optimize with select_related and prefetch_related
        return Project.objects.select_related(
            'CreatedBy', 'ModifiedBy'
        ).prefetch_related('AssignedUsers')
    
    @transaction.atomic
    def perform_create(self, serializer):
        instance = serializer.save(
            CreatedBy=self.request.user,
            ModifiedBy=self.request.user
        )
        # Efficiently set many-to-many relationships
        assigned_users = self.request.data.get('AssignedUsers', [])
        instance.AssignedUsers.set(assigned_users)

    @transaction.atomic
    def perform_update(self, serializer):
        instance = serializer.save(ModifiedBy=self.request.user)
        assigned_users = self.request.data.get('AssignedUsers', [])
        instance.AssignedUsers.set(assigned_users)
        
# --- Dashboard Views ---
class DashboardStatsView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    def get(self, request):
        try:
            # Cache key (no pagination needed here)
            
            time_range = request.query_params.get('timeRange', 'week')
            cache_key = "dashboard_stats"
            cached_data = cache.get(cache_key)
            if cached_data:
                return Response(cached_data)
            
            now = timezone.now()
            
            # Current period
            if time_range == 'week':
                current_start = now - timedelta(days=7)
                previous_start = current_start - timedelta(days=7)
            elif time_range == 'month':
                current_start = now - timedelta(days=30)
                previous_start = current_start - timedelta(days=30)
            elif time_range == 'quarter':
                current_start = now - timedelta(days=90)
                previous_start = current_start - timedelta(days=90)
            else:  # year
                current_start = now - timedelta(days=365)
                previous_start = current_start - timedelta(days=365)
            
            previous_end = current_start
            
            # Calculate current period metrics
            current_metrics = self.calculate_period_metrics(current_start, now)
            print(current_metrics)
            
            previous_metrics_key = "dashboard_previous_metrics"
            previous_metrics = cache.get(previous_metrics_key)

            # Calculate previous period metrics
            if not previous_metrics:
                previous_metrics = current_metrics.copy()
                cache.set(previous_metrics_key, current_metrics, 86400)  # Store for 24 hours
            print(previous_metrics)
            # Calculate trends (percentage change)
            trends = {}
            for key in current_metrics:
                if key in previous_metrics and previous_metrics[key] != 0:
                    # Calculate percentage change
                    trends[key] = round(((current_metrics[key] - previous_metrics[key]) / previous_metrics[key]) * 100, 2)
                else:
                    # If previous value is 0, just use the raw difference to avoid division by zero
                    trends[key] = current_metrics[key] - (previous_metrics.get(key, 0) or 0)
            # Add trends to the response data
         

            # 1. Project Metrics
            project_distribution = Project.objects.values('ProjectState').annotate(
                count=Count('ProjectID')
            )
            project_distribution_dict = {item['ProjectState']: item['count'] for item in project_distribution}

            # Overdue Projects (requires ExpectedCompletionDate column in projects table)
            # Assuming ExpectedCompletionDate is the expected completion date
            projects = Project.objects.filter(CompletedDateUTC__isnull=True).exclude(Name__startswith="Dummy").values('ProjectID', 'Name', 'CreatedDateUTC', 'ExpectedHours')
            overdue_projects = []
            for project in projects:
                expected_completion = project['CreatedDateUTC'] + timedelta(hours=project['ExpectedHours'])
                if expected_completion < timezone.now():
                    overdue_projects.append({'ProjectID': project['ProjectID'], 'Name': project['Name']})

            print("projects", projects)

            # 2. Task Metrics
            task_completion_rate = Task.objects.aggregate(
                completed=Count(Case(When(Status='completed', then=1))),
                total=Count('TaskID')
            )
            task_completion_rate_percentage = (
                (task_completion_rate['completed'] / task_completion_rate['total']) * 100
                if task_completion_rate['total'] > 0 else 0
            )

            task_priority_distribution = Task.objects.values('Priority').annotate(
                count=Count('TaskID')
            )
            task_priority_distribution_dict = {item['Priority']: item['count'] for item in task_priority_distribution}

            overdue_task_ids = Task.objects.exclude(Status='completed').filter(Deadline__lt=timezone.now()).values_list('TaskID', flat=True)
            overdue_tasks = Task.objects.filter(TaskID__in=overdue_task_ids).values('TaskID', 'TaskName', 'Deadline')



            task_verification_rate = Task.objects.filter(Status='completed').aggregate(
                verified=Count(Case(When(IsTaskVerified=1, then=1))),
                total=Count('TaskID')
            )
            task_verification_rate_percentage = (
                (task_verification_rate['verified'] / task_verification_rate['total']) * 100
                if task_verification_rate['total'] > 0 else 0
            )

            task_completion_times = Task.objects.filter(Status='completed').values('CompletedDateUTC', 'CreatedDateUTC')
            total_time_seconds = sum(
                    (t['CompletedDateUTC'] - t['CreatedDateUTC']).total_seconds()
                    for t in task_completion_times
                )
            avg_completion_time_hours = total_time_seconds / (3600 * len(task_completion_times)) if task_completion_times else 0
            avg_task_completion_time_hours = avg_completion_time_hours

            # 3. User Metrics
            user_task_completion = User.objects.annotate(
                tasks_completed=Count(Case(When(assigned_tasks__Status='completed', then=1)))
            ).values('UserID', 'EmployeeName', 'tasks_completed')
            user_task_completion_list = [
                {'name': user['EmployeeName'], 'tasksCompleted': user['tasks_completed']}
                for user in user_task_completion
            ]
            
            print ()
            user_hours_worked = User.objects.annotate(
                total_hours=Sum('tasklogs__HoursWorked')
            ).values('UserID', 'EmployeeName', 'total_hours')
            user_hours_worked_list = [{'name': user['EmployeeName'], 'totalHoursWorked': user['total_hours']} for user in user_hours_worked]

            # 4. Combined Metrics
            project_vs_user_performance = Project.objects.annotate(
                tasks_completed=Sum(Case(When(tasks__Status='completed', then=1))),
                total_hours=Sum('tasks__tasklogs__HoursWorked')
            ).values('ProjectID', 'Name', 'tasks_completed', 'total_hours')


            tasks_with_blockers = TaskLogs.objects.filter(Blockers__isnull=False).values('TaskID', 'Blockers')
            
            overdue_tasks_by_project = Project.objects.filter(ProjectID__in=overdue_task_ids).exclude(Name__startswith="Dummy").values('Name').annotate(overdue_count=Count('tasks'))


            # Overdue Projects
            projects = Project.objects.filter(CompletedDateUTC__isnull=True).exclude(Name__startswith="Dummy").values('Name', 'CreatedDateUTC', 'ExpectedHours')
            overdue_projects = []
            for project in projects:
                expected_completion = project['CreatedDateUTC'] + timedelta(hours=project['ExpectedHours'])
                if expected_completion < timezone.now():
                    overdue_projects.append({'Name': project['Name']})

            # Then, annotate the count in Python (less efficient)
            overdue_project_counts = Counter(p['Name'] for p in overdue_projects)
            overdue_projects_with_counts = [{'Name': name, 'overdue_project_count': count} for name, count in overdue_project_counts.items()]


            users = User.objects.all()

            # Create user performance data manually
            user_performance_list = []
            for user in users:
                # Count tasks directly
                assigned_count = Task.objects.filter(AssignedUserID=user.UserID).count()
                completed_count = Task.objects.filter(AssignedUserID=user.UserID, Status='completed').count()
                
                # Get hours worked
                hours_worked = TaskLogs.objects.filter(UserID=user.UserID).aggregate(
                    total=Coalesce(Cast(Sum('HoursWorked'), output_field=FloatField()), Value(0.0))
                )['total']
                
                user_performance_list.append({
                    'EmployeeName': user.EmployeeName,
                    'tasks_assigned': assigned_count,
                    'tasks_completed': completed_count,
                    'total_hours_worked': hours_worked
                })

            # User Performance
            # user_performance = User.objects.annotate(
            #     tasks_assigned=Count('assigned_tasks', distinct=True),
            #     tasks_completed=Count(
            #         Case(When(assigned_tasks__Status='completed', then=1)),
            #         distinct=True
            #     ),
            #     total_hours_worked=Coalesce(
            #         Cast(Sum('tasklogs__HoursWorked', distinct=True), output_field=FloatField()),
            #         Value(0.0, output_field=FloatField())
            #     )
            # ).values('EmployeeName', 'tasks_assigned', 'tasks_completed', 'total_hours_worked')
            # Overdue Tasks by Priority
            overdue_tasks_by_priority = Task.objects.filter(Deadline__lt=timezone.now()).values('Priority').annotate(
            overdue_count=Count(Case(When(Status='completed', then=Value(None)), output_field=IntegerField()))
            ).order_by('Priority')

            # User Hours Worked Over Time (requires adjustments for date aggregation)
            user_hours_over_time = TaskLogs.objects.annotate(
                day=TruncDate('LogDate')
            ).values('day').annotate(
                total_hours=Sum('HoursWorked')
            ).order_by('day')

            # Project Progress Over Time (requires adjustments for date aggregation)
            project_progress_over_time = Project.objects.annotate(
                day=TruncDate('CreatedDateUTC')
            ).values('day').annotate(
                progress=Avg((F('CompletedTasks') / F('TotalTasks')) * 100)
            ).order_by('day')
            overdue_condition = Q(assigned_tasks__Deadline__lt=timezone.now()) & ~Q(assigned_tasks__Status='completed')
            user_performance_detailed = User.objects.values('UserID', 'EmployeeName').annotate(
                # Use distinct=True to prevent double-counting
                total_expected_hours=Coalesce(
                    Cast(Sum('assigned_tasks__ExpectedHours', distinct=True), output_field=FloatField()),
                    Value(0.0, output_field=FloatField())
                ),
                total_actual_hours=Coalesce(
                    Cast(Sum('tasklogs__HoursWorked', distinct=True), output_field=FloatField()),
                    Value(0.0, output_field=FloatField())
                ),
                # Ensure subtraction has proper output type
                hours_difference=ExpressionWrapper(
                    Coalesce(Cast(Sum('assigned_tasks__ExpectedHours', distinct=True), output_field=FloatField()), Value(0.0)) - 
                    Coalesce(Cast(Sum('tasklogs__HoursWorked', distinct=True), output_field=FloatField()), Value(0.0)),
                    output_field=FloatField()
                ),
                # These count operations return integers
                total_tasks_assigned=Count('assigned_tasks', distinct=True),
                completed_tasks=Count(
                    Case(When(assigned_tasks__Status='completed', then=1)),
                    distinct=True
                ),
                # Ensure average has proper output type
                avg_hours_per_task=Coalesce(
                    Cast(Avg('tasklogs__HoursWorked'), output_field=FloatField()), 
                    Value(0.0, output_field=FloatField())
                ),
                # This count operation returns an integer
                overdue_tasks=Count(
                    Case(When(
                        condition=overdue_condition,
                        then=1
                    )),
                    distinct=True,
                    output_field=IntegerField()
                )
            ).annotate(
                # Calculate efficiency_ratio separately after the other fields are computed
                efficiency_ratio=Round(Case(
                    When(
                        condition=Q(total_expected_hours=0),
                        then=Value(0.0, output_field=FloatField())
                    ),
                    default=ExpressionWrapper(
                        (F('total_actual_hours') * 100.0) / F('total_expected_hours'),
                        output_field=FloatField()
                    ),
                ),2)
            ).order_by('EmployeeName')
            
        # Calculate overdue tasks separately and then join the data:
            # Hours Logged Over Time (requires adjustments for date aggregation)
            user_hours_over_time = TaskLogs.objects.annotate(
                day=TruncDate('LogDate'),
                employee_name=F('UserID__EmployeeName')
            ).values('day', 'employee_name').annotate(
                total_hours=Sum('HoursWorked')
            ).order_by('day', 'employee_name')

            total_active_hours = Attendance.objects.aggregate(
                total=Sum('TotalActiveHours')
            )['total'] or 0
            
            total_inactive_hours = Attendance.objects.aggregate(
                total=Sum('TotalInactiveHours')
            )['total'] or 0

            # Assemble the response
            response_data = {
                "totalProjects": Project.objects.exclude(Name__startswith="Dummy").count(),
                "activeUsers": User.objects.count(),
                "completedTasks": Task.objects.filter(Status='completed').count(),
                "totalTasks": Task.objects.count(),
                "totalHours": TaskLogs.objects.aggregate(total_hours=Sum('HoursWorked'))['total_hours'] or 0,
                "projectDistribution": project_distribution_dict,
                "userPerformance": user_task_completion_list,
                "taskPriorityDistribution": task_priority_distribution_dict,
                "overdueTasks": list(overdue_tasks),
                "overdueProjects": list(overdue_projects),
                "taskCompletionRate": round(task_completion_rate_percentage,2),
                "taskVerificationRate": task_verification_rate_percentage,
                "avgTaskCompletionTime": round(avg_task_completion_time_hours,2),
                "projectVsUserPerformance": list(project_vs_user_performance),
                "tasksWithBlockers": list(tasks_with_blockers),
                'overdueTasksByProject': list(overdue_tasks_by_project),
                'overdueProjects': list(overdue_projects),
                'userPerformance': user_performance_list,
                'overdueTasksByPriority': list(overdue_tasks_by_priority),
                'userHoursOverTime': list(user_hours_over_time),
                'projectProgressOverTime': list(project_progress_over_time),
                'userPerformanceDetailed': list(user_performance_detailed),
                'userHoursOverTime': list(user_hours_over_time),
                "totalActiveHours": float(total_active_hours),
                "totalInactiveHours": float(total_inactive_hours)
            }

            #response_data = current_metrics
            response_data['trends'] = trends
            # Cache the result for 5 minutes
            #cache.set(cache_key, response_data, 300)
            cache.set(previous_metrics_key, current_metrics, 86400)  
            return Response(response_data)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
  
    def calculate_period_metrics(self, start_date, end_date):
    # Filter by date range
        date_filter = Q(CreatedDateUTC__gte=start_date, CreatedDateUTC__lte=end_date)
        
        # Project metrics
        total_projects = Project.objects.filter(date_filter).exclude(Name__startswith="Dummy").count()
        
        # User metrics
        active_users = User.objects.filter(
            Q(tasklogs__LogDate__gte=start_date) & 
            Q(tasklogs__LogDate__lte=end_date)
        ).distinct().count()
        
        # Task metrics
        completed_tasks = Task.objects.filter(
            CompletedDateUTC__gte=start_date,
            CompletedDateUTC__lte=end_date
        ).count()
        
        total_tasks = Task.objects.filter(date_filter).count()
        
        # Hours metrics
        total_hours = TaskLogs.objects.filter(
            LogDate__gte=start_date,
            LogDate__lte=end_date
        ).aggregate(total=Sum('HoursWorked'))['total'] or 0
        
        # Task completion rate
        task_completion_rate = Task.objects.filter(
            CreatedDateUTC__gte=start_date,
            CreatedDateUTC__lte=end_date
        ).aggregate(
            completed=Count(Case(When(Status='completed', then=1))),
            total=Count('TaskID')
        )
        
        completion_rate = (
            (task_completion_rate['completed'] / task_completion_rate['total']) * 100
            if task_completion_rate['total'] > 0 else 0
        )
        
        # Task verification rate
        task_verification_rate = Task.objects.filter(
            Status='completed',
            CompletedDateUTC__gte=start_date,
            CompletedDateUTC__lte=end_date
        ).aggregate(
            verified=Count(Case(When(IsTaskVerified=1, then=1))),
            total=Count('TaskID')
        )
        
        verification_rate = (
            (task_verification_rate['verified'] / task_verification_rate['total']) * 100
            if task_verification_rate['total'] > 0 else 0
        )
        
        # Average task completion time
        task_completion_times = Task.objects.filter(
            Status='completed',
            CompletedDateUTC__gte=start_date,
            CompletedDateUTC__lte=end_date
        ).values('CompletedDateUTC', 'CreatedDateUTC')
        
        if task_completion_times:
            total_time_seconds = sum(
                (t['CompletedDateUTC'] - t['CreatedDateUTC']).total_seconds()
                for t in task_completion_times
            )
            avg_completion_time = total_time_seconds / (3600 * len(task_completion_times))
        else:
            avg_completion_time = 0
        
        # Active vs inactive hours
        active_hours = Attendance.objects.filter(
            PunchInTime__gte=start_date,
            PunchInTime__lte=end_date
        ).aggregate(total=Sum('TotalActiveHours'))['total'] or 0
        
        inactive_hours = Attendance.objects.filter(
            PunchInTime__gte=start_date,
            PunchInTime__lte=end_date
        ).aggregate(total=Sum('TotalInactiveHours'))['total'] or 0
        
        # Return all metrics
        return {
            "totalProjects": total_projects,
            "activeUsers": active_users,
            "completedTasks": completed_tasks,
            "totalTasks": total_tasks,
            "totalHours": float(total_hours),
            "taskCompletionRate": round(completion_rate, 2),
            "taskVerificationRate": round(verification_rate, 2),
            "avgTaskCompletionTime": round(avg_completion_time, 2),
            "totalActiveHours": float(active_hours),
            "totalInactiveHours": float(inactive_hours),
            # Include other metrics from the original code
            # ...
        }

    def calculate_trends(self, current, previous):
        """Calculate percentage change between current and previous periods"""
        trends = {}
        
        # Calculate percentage change for each metric
        for key in current:
            if key in previous and isinstance(current[key], (int, float)) and previous[key] > 0:
                change = ((current[key] - previous[key]) / previous[key]) * 100
                trends[key] = round(change, 1)
            else:
                trends[key] = 0
        
        return trends
    
class DailyReportsView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    def get(self, request):
        try:
            # Get query parameters
            employee_id = request.query_params.get('emp_id')
            date_filter = request.query_params.get('date')
            project_filter = request.query_params.get('project')

            # Base query with optimized relationships
            base_query = Attendance.objects.select_related(
                'UserID'
            ).prefetch_related(
                Prefetch('tasklogs_set', 
                         queryset=TaskLogs.objects.select_related(
                             'TaskID__ProjectID'
                         ))
            ).exclude(PunchOutTime__isnull=True)

            # Build filters
            filters = Q()
            
            # Date filter
            if date_filter:
                try:
                    date_obj = datetime.strptime(date_filter, '%d-%m-%Y').date()
                    filters &= Q(PunchInTime__date=date_obj)
                except ValueError:
                    pass
                    
            # Employee filter
            if employee_id:
                filters &= Q(UserID__EmployeeID=employee_id)

            # Apply filters
            attendance_qs = base_query.filter(filters)

            report_data = []
            
            for attendance in attendance_qs:
                # Calculate effective hours
                punch_in = attendance.PunchInTime
                punch_out = attendance.PunchOutTime
                work_duration = punch_out - punch_in
                
                # Break time calculation
                break_hours = json.loads(attendance.BreakHours) if attendance.BreakHours else []
                total_break = sum(b.get('duration', 0) for b in break_hours)
                effective_seconds = max(work_duration.total_seconds() - (total_break * 60), 0)
                effective_hours = round(effective_seconds / 3600, 2)

                # Process task logs
                task_logs = attendance.tasklogs_set.all()
                projects = set()
                work_details = []

                for log in task_logs:
                    # Get project name if exists
                    if log.TaskID and log.TaskID.ProjectID:
                        project_name = log.TaskID.ProjectID.Name
                        if project_filter and project_name.lower() != project_filter.lower():
                            continue
                        projects.add(project_name)
                    
                    # Collect work details
                    if log.Notes:
                        work_details.append(log.Notes)
                    elif log.TaskID:
                        work_details.append(log.TaskID.TaskName)

                # Build report entry
                report_entry = {
                    "Emp ID": attendance.UserID.EmployeeID,
                    "Emp Name": attendance.UserID.EmployeeName,
                    "Date": punch_in.date().strftime("%d-%m-%Y"),
                    "Section": "Full Day",
                    "Hours": f"{effective_hours:.2f}h",
                    "Project": ", ".join(projects) if projects else "",
                    "Work Details": " | ".join(work_details) if work_details else ""
                }
                
                # Apply project filter at entry level
                if project_filter and not projects:
                    continue
                    
                report_data.append(report_entry)

            # Sort by date then employee ID
            report_data.sort(
                key=lambda x: (
                    datetime.strptime(x['Date'], "%d-%m-%Y"), 
                    x['Emp ID']
                ), 
                reverse=True
            )

            return Response(report_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# --- Task Dashboard View ---
class TaskDashboardView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    def get(self, request):
        try:
            # Get query parameters
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 10))
            status_filter = request.GET.get('state')
            mine = request.GET.get('mine')
            
            # Generate cache key based on parameters
            cache_key = f"task_dashboard_{page}_{page_size}_{status_filter}_{mine}_{request.user.UserID}"
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return Response(cached_data)
            
            # Calculate total counts efficiently with a single query
           
            
            # Base queryset with optimized related fields
            tasks = Task.objects.select_related(
                'ProjectID',
                'AssignedUserID'
            ).annotate(
               total_hours_worked=Sum('tasklogs__HoursWorked')
            )

            # Apply filters efficiently
            if status_filter == 'pending_approval':
                tasks = tasks.filter(CompletedDateUTC__isnull=False, IsTaskVerified=0)
            elif status_filter and status_filter in ['queue', 'in_progress', 'completed']:
                tasks = tasks.filter(Status=status_filter)
                
            # Filter by assigned user if 'mine' is true
            if mine == 'true' and request.user.is_authenticated:
                tasks = tasks.filter(AssignedUserID=request.user)

            # Create paginator
            paginator = Paginator(tasks, page_size)
            current_page = paginator.get_page(page)

            # Prepare response data efficiently
            serialized_tasks = []
            for task in current_page:
                task_data = {
                    'TaskID': task.TaskID,
                    'TaskName': task.TaskName,
                    'Description': task.Description,
                    'ProjectName': task.ProjectID.Name if task.ProjectID else None,
                    'Priority': task.Priority,
                    'Deadline': task.Deadline,
                    'ExpectedHours': task.ExpectedHours,
                    'CompletedDateUTC': task.CompletedDateUTC,
                    'CreatedDateUTC': task.CreatedDateUTC,
                    'AssignedTo': {
                        'UserID': task.AssignedUserID.UserID,
                        'EmployeeName': task.AssignedUserID.EmployeeName
                    } if task.AssignedUserID else None,
                    'HoursWorked': task.total_hours_worked or 0,
                }
                
                
                if status_filter:
                    task_data['Status'] = status_filter
                    task_data['IsTaskVerified'] = task.IsTaskVerified
                    
                serialized_tasks.append(task_data)


            total_counts = Task.objects.aggregate(
                queue=Count('pk', filter=Q(Status='queue')),
                in_progress=Count('pk', filter=Q(Status='in_progress')),
                completed=Count('pk', filter=Q(Status='completed', IsTaskVerified=1)),
                pending_approval=Count('pk', filter=Q(CompletedDateUTC__isnull=False, IsTaskVerified=0))
            )
            response_data = {
                'count': paginator.count,
                'num_pages': paginator.num_pages,
                'current_page': page,
                'results': serialized_tasks,
                'total_counts': total_counts
            }
            
            # Cache the results for 2 minutes
           # cache.set(cache_key, response_data, 120)
            
            return Response(response_data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- User Profile Views ---
class UserProfileView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    def get(self, request, user_id):
        try:
            # Cache user profile data
            cache_key = f"user_profile_{user_id}"
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return Response(cached_data)
                
            user = User.objects.get(UserID=user_id)
            serialized_data = UserSerializer(user).data
            
            # Cache for 5 minutes
            cache.set(cache_key, serialized_data, 300)
            
            return Response(serialized_data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, user_id):
        try:
            user = User.objects.get(UserID=user_id)
            data = request.data.copy()

            # Handle photo upload efficiently
            if 'photo' in request.FILES:
                photo_file = request.FILES['photo']
                
                # Process image in memory
                with Image.open(photo_file) as img:
                    # Resize image if too large
                    max_size = (800, 800)
                    img.thumbnail(max_size, Image.LANCZOS)
                    
                    # Convert to JPEG format
                    output = BytesIO()
                    img.save(output, format='JPEG', quality=85)
                    
                    # Convert to base64
                    base64_image = base64.b64encode(output.getvalue()).decode('utf-8')
                    data['Photo'] = f"data:image/jpeg;base64,{base64_image}"

            # Use atomic transaction for data consistency
            with transaction.atomic():
                serializer = UserSerializer(user, data=data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    
                    # Invalidate cache
                    cache.delete(f"user_profile_{user_id}")
                    
                    return Response(serializer.data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes(PERM_CLASSES)
@authentication_classes(AUTH_CLASSES)
def get_user_role(request):
    try:
        # Cache user role data
        cache_key = f"user_role_{request.user.UserID}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
            
        role_data = {
            'role': request.user.RoleID_id,
            'user_id': request.user.UserID,
            'username': request.user.UserName
        }
        
        # Cache for 10 minutes
        cache.set(cache_key, role_data, 600)
        
        return Response(role_data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# --- Attendance Management Views ---
class PunchInView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    @transaction.atomic
    def post(self, request):
        try:
            # Get selected tasks from request
            selected_task_ids = request.data.get('tasks', [])
            
            # Create or get dummy project if needed
            dummy_project = None
            dummy_task = None
            
            if not selected_task_ids:
                # Get or create dummy project using get_or_create to avoid race conditions
                dummy_project, created = Project.objects.get_or_create(
                    Name="Dummy Project - Auto Generated",
                    defaults={
                        "Description": "Project created automatically for dummy tasks when no real project exists.",
                        "CreatedBy": request.user,
                        "ProjectState": "in_progress",
                        "ExpectedHours": 0,
                    }
                )
                
                # Create dummy task
                dummy_task = Task.objects.create(
                    TaskName="Dummy Task - Auto Generated",
                    Description="Created automatically as no tasks were selected.",
                    ProjectID=dummy_project,
                    AssignedUserID=request.user,
                    Status="in_progress",
                    ExpectedHours=0,
                    RequestedHours=0,
                    Priority="low",
                    Deadline=None,
                )
                selected_task_ids = [dummy_task.TaskID]

            if not selected_task_ids:
                return Response(
                    {'error': 'No tasks selected'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Fetch tasks in a single query
            tasks = Task.objects.filter(TaskID__in=selected_task_ids)
            
            current_time_utc = timezone.now() 

            # Check for existing attendance record
            attendance = Attendance.objects.filter(
                UserID=request.user,
                PunchInTime__date=current_time_utc.date(),
                PunchOutTime__isnull=True
            ).first()
               
            if not attendance:
                attendance = Attendance.objects.create(
                    UserID=request.user,
                    PunchInTime=current_time_utc,
                    CreatedDateUTC=current_time_utc
                )
           
            # Get existing task logs in a single query
            existing_task_logs = set(TaskLogs.objects.filter(
                UserID=request.user,
                AttendanceID=attendance
            ).values_list('TaskID_id', flat=True))

            # Prepare task logs to create
            task_logs_to_create = []
            for task_id in selected_task_ids:
                if task_id not in existing_task_logs:
                    task = next((t for t in tasks if t.TaskID == task_id), None)
                    if task:
                        task_logs_to_create.append(TaskLogs(
                            TaskID=task,
                            UserID=request.user,
                            AttendanceID=attendance,
                            Status='in_progress',
                            HoursWorked=0,
                            RequestedHours=0,
                            LogDate=timezone.localtime(timezone.now()).date()
                        ))
            
            # Bulk create task logs if any
            if task_logs_to_create:
                TaskLogs.objects.bulk_create(task_logs_to_create)
                
            punch_in_local = timezone.localtime(attendance.PunchInTime)
            response_data = {
                'message': 'Punched in successfully',
                'attendance_id': attendance.AttendanceID,
                'punch_in_time': punch_in_local.isoformat(),
            }
            
            # Include dummy task ID if created
            if dummy_task:
                response_data['dummyTaskId'] = dummy_task.TaskID
            
            return Response(response_data, status=status.HTTP_201_CREATED)

        except Task.DoesNotExist:
            return Response(
                {'error': 'One or more tasks not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PunchOutView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    @transaction.atomic
    def post(self, request):
        try:
            # Get today's attendance record
            today = timezone.localtime(timezone.now()).date()
            attendance = Attendance.objects.filter(
                UserID=request.user,
                
                PunchOutTime__isnull=True
            ).select_for_update().latest('CreatedDateUTC')

            # Calculate total break time (in minutes) from BreakHours
            break_hours = json.loads(attendance.BreakHours) if attendance.BreakHours else []
            total_break_minutes = sum(break_period.get('duration', 0) for break_period in break_hours)
            total_break_time = timedelta(minutes=total_break_minutes)

            # Get total idle time from the request payload (in seconds)
            total_idle_time = request.data.get('totalInactiveTime', 0)  # In seconds
            total_idle_time_hours = total_idle_time / 3600  # Convert to hours

            # Calculate total work time (punch-in to punch-out)
            punch_in_time = attendance.PunchInTime
            print("Punch In Time:", punch_in_time)
            current_time = timezone.now()
            print("Current Time:", current_time)
            total_time = current_time - punch_in_time
            print("Total Time:", total_time)
            # Subtract break time from total work time
            total_work_time_hours = (total_time - total_break_time).total_seconds() / 3600

            print("Total Work Time (hours):", total_work_time_hours)
            # Get task details from request
            task_details = request.data.get('tasks', [])

            if not isinstance(task_details, list):
                return Response(
                    {'error': 'Task details must be a list'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Calculate total hours worked across all tasks
            total_hours_worked = sum(
                float(task_detail.get('hoursWorked', 0))
                for task_detail in task_details
                if isinstance(task_detail, dict)
            )

            # Ensure total hours worked does not exceed total work time (excluding idle time)
            if total_hours_worked > total_work_time_hours:
                return Response(
                    {'error': 'Total hours worked exceeds allowable work time'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            total_requested_hours = sum(
                float(task_detail.get('hoursWorked', 0))
                for task_detail in task_details
                if isinstance(task_detail, dict)
            )
                
            adjustment_factor = 1.0
            if total_requested_hours > 0:
                adjustment_factor = total_work_time_hours / total_requested_hours

            # Update attendance record with punch out time
            attendance.PunchOutTime = current_time
            attendance.TotalActiveHours = total_work_time_hours    # Active time (hours worked on tasks)
            attendance.TotalInactiveHours = total_idle_time_hours  # Idle time in hours
            attendance.save()

            # Get all task logs in a single query
            task_logs = {
                log.TaskID_id: log
                for log in TaskLogs.objects.filter(
                    UserID=request.user,
                    AttendanceID=attendance
                )
            }

            # Prepare tasks to update
            tasks_to_complete = []

            # Update task logs
            for task_detail in task_details:
                if not isinstance(task_detail, dict):
                    continue

                task_id = task_detail.get('taskId')
                requested_hours  = float(task_detail.get('hoursWorked', 0))
                comments = task_detail.get('comments', '')
                mark_completed = task_detail.get('markCompleted', False)

                if task_id is None or requested_hours  is None:
                    continue

                task_log = task_logs.get(task_id)

                if task_log:
                    adjusted_hours = requested_hours * adjustment_factor
                    task_log.HoursWorked = adjusted_hours 
                    task_log.RequestedHours = requested_hours
                    task_log.Status = 'completed'
                    task_log.Notes = comments
                    task_log.ModifiedDateUTC = current_time

                    if mark_completed:
                        tasks_to_complete.append(task_id)

            # Bulk update task logs
            TaskLogs.objects.bulk_update(
                task_logs.values(),
                ['HoursWorked', 'Status', 'Notes', 'ModifiedDateUTC']
            )

            # Update tasks marked as completed
            if tasks_to_complete:
                Task.objects.filter(TaskID__in=tasks_to_complete).update(
                    CompletedDateUTC=current_time,
                    CompletedByUserID=request.user,
                    AssignedByUserID=request.user,
                    Status = 'completed'
                )

            return Response({
                'message': 'Punched out successfully',
                'punch_out_time': attendance.PunchOutTime,
                'total_active_hours': attendance.TotalActiveHours,
                'total_inactive_hours': attendance.TotalInactiveHours,
                'adjustment_applied': adjustment_factor != 1.0,
                'adjustment_factor': adjustment_factor# Idle time in hours
            }, status=status.HTTP_200_OK)

        except Attendance.DoesNotExist:
            return Response(
                {'error': 'No active attendance record found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes(PERM_CLASSES)
@authentication_classes(AUTH_CLASSES)
def project_hours(request):
    # Cache project hours data
    cache_key = "project_hours"
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return Response(cached_data)
    
    # Use efficient query with annotation
    projects = Project.objects.annotate(
        completed_hours=Sum('task__tasklogs__HoursWorked')
    )
    
    project_stats = [
        {
            'ProjectName': project.Name,
            'ExpectedHours': project.ExpectedHours,
            'CompletedHours': float(project.completed_hours or 0)
        }
        for project in projects
    ]
    
    # Cache for 5 minutes
    cache.set(cache_key, project_stats, 300)
    
    return Response(project_stats)

class TaskPunchOutView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    @transaction.atomic
    def post(self, request):
        try:
            task_id = request.data.get('taskId')
            hours_worked = request.data.get('hoursWorked')
            comments = request.data.get('comments')
            mark_completed = request.data.get('markCompleted', False)

            if not task_id or hours_worked is None:
                return Response(
                    {'error': 'Task ID and hours worked are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                hours_worked = float(hours_worked)
            except ValueError:
                return Response(
                    {'error': 'Invalid hours worked format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the current attendance record
            current_time_utc = timezone.now()
            today_utc = current_time_utc.date()
            
            # Use select_for_update to prevent race conditions
            attendance = Attendance.objects.filter(
                UserID=request.user,
                PunchInTime__date=today_utc,
                PunchOutTime__isnull=True
            ).select_for_update().first()
            
            if not attendance:
                return Response(
                    {'error': 'No active attendance found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Calculate Maximum Worked Time efficiently
            punch_in_time = attendance.PunchInTime
            max_work_time = current_time_utc - punch_in_time

            # Calculate break time once
            total_break_time = timedelta()
            break_hours = json.loads(attendance.BreakHours) if attendance.BreakHours else []
            total_break_minutes = sum(break_period.get('duration', 0) for break_period in break_hours)
            total_break_time = timedelta(minutes=total_break_minutes)

            # Subtract break time from total work time
            max_work_time -= total_break_time
            max_work_hours = max_work_time.total_seconds() / 3600

            # Validate hours worked against maximum
            if hours_worked > max_work_hours:
                return Response(
                    {'error': 'Hours worked exceeds maximum allowable time'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get existing hours in a single query
            existing_hours_worked = TaskLogs.objects.filter(
                TaskID_id=task_id,
                UserID=request.user,
                AttendanceID=attendance
            ).aggregate(total_hours=Sum('HoursWorked'))['total_hours'] or 0

            total_current_time = existing_hours_worked + hours_worked
            
            # Validate total hours
            if total_current_time > max_work_hours:
                return Response(
                    {'error': 'Total time including current is not within range of work hours with Punch In'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update the task log with select_for_update to prevent race conditions
            task_log = TaskLogs.objects.select_for_update().get(
                TaskID_id=task_id,
                UserID=request.user,
                AttendanceID=attendance,
                Status='in_progress'
            )

            # Update task log
            task_log.HoursWorked = hours_worked
            task_log.RequestedHours = hours_worked
            task_log.Notes = comments
            task_log.Status = 'completed'
            task_log.ModifiedDateUTC = current_time_utc
            
            # Handle task completion if needed
            if mark_completed:
                Task.objects.filter(TaskID=task_id).update(
                    CompletedDateUTC=current_time_utc,
                    CompletedByUserID=request.user,
                    AssignedByUserID=request.user
                )
            
            task_log.save()

            # Update TotalActiveHours and TotalInactiveHours in attendance
            attendance.TotalActiveHours = total_current_time
            attendance.TotalInactiveHours = total_break_time.total_seconds() / 3600
            attendance.save()
            
            return Response({
                'message': 'Task punched out successfully',
                'task_id': task_id,
                'hours_worked': hours_worked
            }, status=status.HTTP_200_OK)

        except TaskLogs.DoesNotExist:
            return Response(
                {'error': 'Task log not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PunchInStatusView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    def calculate_total_break_time(self, break_hours_json):
        """Calculate total break time efficiently"""
        if not break_hours_json:
            return 0
            
        try:
            break_hours = json.loads(break_hours_json)
            return sum(
                int(break_period.get('duration', 0)) 
                for break_period in break_hours 
                if isinstance(break_period.get('duration'), (int, float))
            )
        except (json.JSONDecodeError, TypeError):
            return 0

    def get(self, request):
        try:
            # Cache key based on user and date
            current_time = timezone.now()
            today = current_time.date()
            cache_key = f"punch_status_{request.user.UserID}_{today}"
            
            cached_data = cache.get(cache_key)
            if cached_data:
                return Response(cached_data)
        
            # Get attendance with a single query
            attendance = Attendance.objects.filter(
                UserID=request.user,
                PunchOutTime__isnull=True
            ).first()
            
            print(attendance)
            
            if (attendance):
                # Use prefetch_related to optimize task log fetching
                task_logs = TaskLogs.objects.filter(
                    UserID=request.user,
                    AttendanceID=attendance
                ).select_related(
                    'TaskID',
                    'TaskID__ProjectID'
                )
                
                # Calculate break time once
                total_break_time = self.calculate_total_break_time(attendance.BreakHours)
                
                # Process task logs efficiently
                tasks = []
                for log in task_logs:
                    task = log.TaskID
                    tasks.append({
                        'TaskID': task.TaskID,
                        'TaskName': task.TaskName,
                        'Description': task.Description,
                        'project_name': task.ProjectID.Name if task.ProjectID else None,
                        'Priority': task.Priority,
                        'ExpectedHours': task.ExpectedHours,
                        'Deadline': task.Deadline,
                        'hours_worked': log.HoursWorked,
                        'comments': log.Notes,
                        'blockers': log.Blockers,
                        'is_completed': log.Status == 'completed',
                        'status': log.Status
                    })

                response_data = {
                    'is_punched_in': True,
                    'attendance_id': attendance.AttendanceID,
                    'punch_in_time': attendance.PunchInTime,
                    'BreakHours': total_break_time,
                    'tasks': tasks
                }
                
                # Cache for 1 minute (short time since this data changes frequently)
                cache.set(cache_key, response_data, 60)
                
                return Response(response_data)
            else:
                response_data = {'is_punched_in': False}
                cache.set(cache_key, response_data, 60)
                return Response(response_data)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class BreakStartView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    @transaction.atomic
    def post(self, request):
        try:
            # Get today's attendance record with select_for_update to prevent race conditions
            today = timezone.localtime(timezone.now()).date()
            attendance = Attendance.objects.filter(
                UserID=request.user,
                PunchInTime__date=today,
                PunchOutTime__isnull=True
            ).select_for_update().latest('CreatedDateUTC')

            # Parse break hours once
            break_hours = json.loads(attendance.BreakHours) if attendance.BreakHours else []
            
            # Add new break start time
            current_time = timezone.now()
            break_hours.append({
                'start': current_time.isoformat(),
                'end': None
            })
            
            # Update attendance record
            attendance.BreakHours = json.dumps(break_hours)
            attendance.save()
            
            # Invalidate punch status cache
            cache.delete(f"punch_status_{request.user.UserID}_{today}")

            return Response({
                'message': 'Break started successfully',
                'break_start': break_hours[-1]['start']
            }, status=status.HTTP_200_OK)

        except Attendance.DoesNotExist:
            return Response(
                {'error': 'No active attendance record found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class BreakEndView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    @transaction.atomic
    def post(self, request):
        try:
            duration = request.data.get('duration')
            if duration is None:
                return Response(
                    {'error': 'Break duration is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get attendance with select_for_update to prevent race conditions
            today = timezone.now().date()
            attendance = Attendance.objects.filter(
                UserID=request.user,
                PunchInTime__date=today,
                PunchOutTime__isnull=True
            ).select_for_update().latest('CreatedDateUTC')

            try:
                # Parse existing break hours
                break_hours = json.loads(attendance.BreakHours) if attendance.BreakHours else []
                
                if break_hours and isinstance(break_hours[-1], dict) and break_hours[-1].get('end') is None:
                    # Update the last break entry
                    current_time = timezone.now()
                    break_hours[-1] = {
                        'start': break_hours[-1]['start'],
                        'end': current_time.isoformat(),
                        'duration': int(duration)
                    }
                    
                    # Update attendance record
                    attendance.BreakHours = json.dumps(break_hours, ensure_ascii=False)
                    attendance.save()
                    
                    # Invalidate punch status cache
                    cache.delete(f"punch_status_{request.user.UserID}_{today}")

                    return Response({
                        'message': 'Break ended successfully',
                        'break_end': break_hours[-1]['end'],
                        'duration': duration,
                        'break_hours': break_hours
                    }, status=status.HTTP_200_OK)
                
                return Response(
                    {'error': 'No active break found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            except json.JSONDecodeError as je:
                return Response(
                    {'error': f'Invalid JSON format in break hours: {str(je)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Attendance.DoesNotExist:
            return Response(
                {'error': 'No active attendance record found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserStatusCountView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    def get(self, request):
        try:
            # Get current date and time
            current_time = timezone.now()
            today = current_time.date()
            
            non_admin_users = User.objects.exclude(RoleID=1)
            total_users = non_admin_users.count()
            
            # Count users who are punched in (have active attendance)
            punched_in_count = Attendance.objects.filter(
                PunchInTime__date=today,
                PunchOutTime__isnull=True,
                UserID__in=non_admin_users
            ).values('UserID').distinct().count()
            
            # Count users who are on break
            on_break_count = 0
            active_attendances = Attendance.objects.filter(
                PunchInTime__date=today,
                PunchOutTime__isnull=True,
                UserID__in=non_admin_users
            )
            
            for attendance in active_attendances:
                if attendance.BreakHours:
                    try:
                        break_hours = json.loads(attendance.BreakHours)
                        if break_hours and isinstance(break_hours, list) and len(break_hours) > 0:
                            # Check the last break entry
                            last_break = break_hours[-1]
                            if last_break.get('start') and last_break.get('end') is None:
                                on_break_count += 1
                    except (json.JSONDecodeError, TypeError, KeyError):
                        pass
            
            # Count users who are on leave today
            on_leave_count = LeaveRequest.objects.filter(
                FromDate__lte=today,
                ToDate__gte=today,
                Status='Approved',
                RequestedBy__in=non_admin_users
            ).values('RequestedBy').distinct().count()
            
            # Count total active users
          
            # Calculate offline users (not punched in, not on leave)
            offline_count = total_users - punched_in_count - on_leave_count
            
            # Ensure offline count is not negative
            offline_count = max(0, offline_count)
            
            return Response({
                'punched_in': punched_in_count,
                'on_break': on_break_count,
                'on_leave': on_leave_count,
                'offline': offline_count,
                'total': total_users
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class ProjectDashboardView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    def get(self, request):
        try:
            # Get query parameters
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 10))
            status_filter = request.GET.get('status')
            search = request.GET.get('search', '').lower()

            # Create cache key based on parameters
            # cache_key = f"project_dashboard_{page}_{page_size}_{status_filter}_{search}"
            # cached_data = cache.get(cache_key)
            
            # if cached_data:
            #     return Response(cached_data)

            inprogress_count = Project.objects.filter(
               ProjectState='in_progress'
            ).exclude(Name__startswith="Dummy").count()
            # Get total counts efficiently with a single query
            print("inprogress_count", inprogress_count)
            total_counts = {
                'queue': Project.objects.filter(ProjectState='queue').count(),
                'in_progress': inprogress_count,
                'completed': Project.objects.filter(ProjectState='completed').count(),
            }
            
            # Base queryset with optimized related fields
            queryset = Project.objects.select_related(
                'CreatedBy',
                'ModifiedBy'
            ).prefetch_related('AssignedUsers')

            # Apply search efficiently
            if search:
                queryset = queryset.filter(
                    Q(Name__icontains=search) |
                    Q(Description__icontains=search)
                )

            # Filter by status efficiently
            if status_filter and status_filter in ['queue', 'in_progress', 'completed']:
                queryset = queryset.filter(ProjectState=status_filter)

            # Create paginator
            paginator = Paginator(queryset, page_size)
            current_page = paginator.get_page(page)

            # Prepare response data efficiently
            projects_data = []
            
            # Get all task counts in a single query using annotation
            project_ids = [project.ProjectID for project in current_page]
            task_counts = Task.objects.filter(ProjectID__in=project_ids).values(
                'ProjectID'
            ).annotate(
                total_tasks=Count('TaskID'),
                completed_tasks=Count('TaskID', filter=Q(Status='completed'))
            )
            
            # Convert to dictionary for O(1) lookup
            task_counts_dict = {
                tc['ProjectID']: {
                    'total_tasks': tc['total_tasks'],
                    'completed_tasks': tc['completed_tasks']
                } 
                for tc in task_counts
            }
            
            # Get task hours in a single query
            task_hours = TaskLogs.objects.filter(
                TaskID__ProjectID__in=project_ids
            ).values('TaskID__ProjectID').annotate(
                total_hours=Sum('HoursWorked')
            )
            
            # Convert to dictionary for O(1) lookup
            task_hours_dict = {
                th['TaskID__ProjectID']: th['total_hours'] 
                for th in task_hours
            }
            
            projects_to_update = []
            
            for project in current_page:
                # Get task counts from pre-fetched data
                if(project.Name == "Dummy Project - Auto Generated"):
                    continue
                project_task_counts = task_counts_dict.get(project.ProjectID, {
                    'total_tasks': 0,
                    'completed_tasks': 0
                })
                
                total_tasks = project_task_counts['total_tasks']
                completed_tasks = project_task_counts['completed_tasks']
                
                verified_tasks = Task.objects.filter(
                    ProjectID=project.ProjectID,
                    Status='completed',
                    IsTaskVerified=1
                ).count()
                # Calculate completion percentage
                completion_percentage = (
                    (verified_tasks / total_tasks) * 100 
                    if total_tasks > 0 else 0
                )
                
                print("Completion Percentage:", completion_percentage)
                if total_tasks > 0:
                    completed_tasks = Task.objects.filter(
                        ProjectID=project.ProjectID, 
                        Status='completed'
                    ).count()
                    
                    verified_tasks = Task.objects.filter(
                        ProjectID=project.ProjectID, 
                        Status='completed',
                        IsTaskVerified=1  # Only count tasks that are verified
                    ).count()
                    
                    # Only mark project as completed if ALL tasks are both completed AND verified
                    if total_tasks == completed_tasks and total_tasks == verified_tasks and project.ProjectState != 'completed':
                        project.ProjectState = 'completed'
                        project.OverallProgress = 100
                        project.CompletedDateUTC = timezone.now()
                        projects_to_update.append(project)
                    elif project.OverallProgress != completion_percentage:
                        project.OverallProgress = completion_percentage
                        projects_to_update.append(project)
                    
                
                # Get task hours from pre-fetched data
                total_task_hours = task_hours_dict.get(project.ProjectID, 0) or 0

                projects_data.append({
                    'ProjectID': project.ProjectID,
                    'ProjectName': project.Name,
                    'Description': project.Description,
                    'CreatedDate': project.CreatedDateUTC,
                    'CompletedDate': project.CompletedDateUTC,
                    'ExpectedHours': project.ExpectedHours,
                    'OverallProgress': project.OverallProgress if project.OverallProgress is not None else 5,
                    'Status': project.ProjectState,
                    'CompletionPercentage': round(completion_percentage, 2),
                    'TotalTasks': total_tasks,
                    'CompletedTasks': completed_tasks,
                    'CreatedBy': project.CreatedBy.EmployeeName if project.CreatedBy else None,
                    'ModifiedBy': project.ModifiedBy.EmployeeName if project.ModifiedBy else None,
                    'ModifiedDate': project.ModifiedDateUTC,
                    'AssignedUsers': list(project.AssignedUsers.all().values('UserID', 'EmployeeName')),
                    'TotalTaskHours': float(total_task_hours),
                })

                if projects_to_update:
                    with transaction.atomic():
                        for project in projects_to_update:
                            project.save()
                            
            # Get status counts efficiently
            status_counts = {
                'queue': queryset.filter(ProjectState='queue').count(),
                'in_progress': queryset.filter(ProjectState='in_progress').count(),
                'completed': queryset.filter(ProjectState='completed').count()
            }
            
            response_data = {
                'count': paginator.count,
                'num_pages': paginator.num_pages,
                'current_page': page,
                'results': projects_data,
                'status_counts': status_counts,
                'total_counts': total_counts
            }
            
            # Cache for 2 minutes
            #cache.set(cache_key, response_data, 120)
            
            return Response(response_data)

        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class EmployeeView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    def parse_datetime(self, date_string):
         return datetime.strptime(date_string, '%Y-%m-%dT%H:%M:%S.%f%z')
    
    def get(self, request):
        try:
            # Get query parameters
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 10))
            search = request.GET.get('search', '').lower()
            include_break_status = request.query_params.get('include_break_status', 'false').lower() == 'true'
            
            
            # Create cache key based on parameters
            cache_key = f"employee_list_{page}_{page_size}_{search}_{include_break_status}"
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return Response(cached_data)

            # Optimize query with select_related
            queryset = User.objects.select_related('PositionID', 'RoleID')

            # Apply search efficiently
            if search:
                queryset = queryset.filter(
                    Q(UserName__icontains=search) |
                    Q(EmployeeName__icontains=search) |
                    Q(Email__icontains=search)
                )

            # Create paginator
            paginator = Paginator(queryset, page_size)
            current_page = paginator.get_page(page)

            # Get today's date once
            today = timezone.now().date()
            current_time = timezone.now()
            
            # Prefetch attendance and leave data for all users in the current page
            user_ids = [user.UserID for user in current_page]
            
            attendance_records = Attendance.objects.filter(
                UserID__in=user_ids,
                PunchOutTime__isnull=True  # Only get active attendance records
            ).order_by('UserID', '-CreatedDateUTC')
            
            # Get attendance data in a single query
            attendance_data = {}
            for record in attendance_records:
                # Only add if this is the first (most recent) record for this user
                if record.UserID_id not in attendance_data:
                    attendance_data[record.UserID_id] = record
                    print(f"Found attendance for user {record.UserID_id}: {record.BreakHours}")
      
            # Get leave data in a single query
            leave_data = {
                leave.RequestedBy_id: leave 
                for leave in LeaveRequest.objects.filter(
                    RequestedBy__in=user_ids,
                    FromDate__lte=today,
                    ToDate__gte=today,
                    Status='Approved'
                )
            }

            employees_data = []
            for employee in current_page:
                # Check attendance status
                on_break = False
                break_start_time = None
                break_duration = None
                #break_hours = self.calculate_break_hours(attendance)
                # Determine status
                status = 'not_punched_in'
                photo_url = None
                if employee.Photo:
                    # Check if Photo is a string path or a FileField
                    if isinstance(employee.Photo, str):
                        # It's a string path, construct the URL
                        photo_url = request.build_absolute_uri(f'/api{employee.Photo}')
                    else:
                        # It's a FileField, use the url attribute
                        try:
                            photo_url = request.build_absolute_uri("/api" + employee.Photo.url)
                        except (AttributeError, ValueError):
                            # Fallback if url attribute doesn't exist or is invalid
                            photo_url = None
                            
                employee_data = {
                    'UserID': employee.UserID,
                    'UserName': employee.UserName,
                    'Email': employee.Email,
                    'EmployeeName': employee.EmployeeName,
                    'EmployeeID': employee.EmployeeID,
                    'Photo': photo_url,
                    'Position': {
                        'id': employee.PositionID.id,
                        'name': employee.PositionID.position_name
                    } if employee.PositionID else None,
                    'Role': {
                        'id': employee.RoleID.id,
                        'name': employee.RoleID.RoleName
                    } if employee.RoleID else None,
                    'bank_details': employee.bank_details if employee.bank_details else None,
                    # 'break_hours': break_hours,
                }
                attendance = attendance_data.get(employee.UserID)
                if attendance:
                        if attendance.PunchOutTime is None:
                            status = 'punched_in'
                            print(employee.UserID)
                            if attendance.BreakHours:
                                try:
                                    break_hours = json.loads(attendance.BreakHours)
                                    if break_hours and isinstance(break_hours, list) and len(break_hours) > 0:
                                        # Check the last break entry
                                        last_break = break_hours[-1]
                                        print(f"Last break for user {employee.UserID}: {last_break}")
                                        if last_break.get('start') and last_break.get('end') is None:
                                            status = 'on_break'
                                            print(f"User {employee.UserID} is on break")
                                            
                                            # Add break details
                                            start_time = self.parse_datetime(last_break['start'])
                                            if start_time:
                                                employee_data['break_start_time'] = start_time
                                                
                                                # Calculate break duration in minutes
                                                duration_minutes = (current_time - start_time).total_seconds() / 60
                                                employee_data['break_duration'] = round(duration_minutes)
                                except (json.JSONDecodeError, TypeError, KeyError) as e:
                                    print(f"Error parsing break hours for user {employee.UserID}: {str(e)}")
                                    # Log the error but continue processing
                            # if break_hours:
                            #     status = 'on_break'
                    
                    # Check if on leave
                on_leave = employee.UserID in leave_data
                if on_leave:
                        status = 'on_leave'

               
                employee_data['Status'] = status
                
                employees_data.append(employee_data)
                
            response_data = {
                'results': employees_data,
                'num_pages': paginator.num_pages,
                'current_page': page,
                'count': paginator.count
            }
            
            # Cache for 2 minutes
            #cache.set(cache_key, response_data, 120)
            
            return Response(response_data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=http_status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        
    @transaction.atomic
    def post(self, request):
        try:
            print("Request data type:", type(request.data))
            print("Request data keys:", request.data.keys())
            
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        
        # Debug the data after copying
            print("Data after copy:", data)
            
            # Extract form fields - handle potential MultiValueDict issues
            user_data = {
                'UserName': data.get('UserName', ''),
                'Email': data.get('Email', ''),
                'Password': data.get('Password', ''),
                'EmployeeName': data.get('EmployeeName', ''),
                'PositionID': data.get('PositionID', ''),
                'RoleID': data.get('RoleID', '')
            }
            
            # Debug extracted user data
            print("Extracted user data:", user_data)
            
            # Check if any required fields are missing
            missing_fields = [field for field, value in user_data.items() 
                            if field in ['UserName', 'Email', 'EmployeeName'] and not value]
            
            if missing_fields:
                return Response({
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Handle bank details
            bank_details_str = data.get('bank_details', '{}')
            try:
                if isinstance(bank_details_str, str):
                    bank_details = json.loads(bank_details_str)
                else:
                    bank_details = bank_details_str
                    
                # If bank details were sent as separate fields, process them
                if not bank_details and all(k in data for k in ['bank_name', 'account_number', 'ifsc_code']):
                    bank_details = {
                        'bank_name': data.get('bank_name', ''),
                        'account_number': data.get('account_number', ''),
                        'ifsc_code': data.get('ifsc_code', '')
                    }
                    
                user_data['bank_details'] = json.dumps(bank_details) if bank_details else None
            except json.JSONDecodeError:
                print("Error parsing bank details:", bank_details_str)
                # Continue without bank details if there's an error
                user_data['bank_details'] = None
        
        # Create serializer with the extracted data
            
            serializer = UserSerializer(data=request.data)
            if serializer.is_valid():
                
                
                
                prefix = "TTE"  #
                
                last_employee = User.objects.filter(
                EmployeeID__startswith=prefix
                ).order_by('-EmployeeID').first()
                
                
                if last_employee and last_employee.EmployeeID:
                # Extract the number part and increment
                    try:
                        last_number = int(last_employee.EmployeeID[len(prefix):])
                        next_number = last_number + 1
                    except (ValueError, TypeError):
                        # If parsing fails, start from 1
                        next_number = 1
                else:
                    # No existing employees with this prefix
                    next_number = 1
                
            # Format the new employee ID (e.g., TTE01, TTE02)
                new_employee_id = f"{prefix}{next_number:02d}"
                
                # Handle photo upload
                photo = request.FILES.get('Photo')
                
                # Create employee first to get the ID
                employee = serializer.save(EmployeeID=new_employee_id)
                
                if 'Password' in request.data and request.data['Password']:
                    employee.Password = make_password(request.data['Password'])
                    
                if 'bank_details' in request.data:
                    try:
                        bank_details = request.data['bank_details']
                        if isinstance(bank_details, str):
                            bank_details = json.loads(bank_details)
                        
                        # Format the bank details exactly as required
                        formatted_bank_details = {
                            "bank_name": str(bank_details['bank_name']).strip(),
                            "account_number": str(bank_details['account_number']).strip(),
                            "ifsc_code": str(bank_details['ifsc_code']).strip().upper()
                        }
                        
                        serializer = UserSerializer(data={'bank_details': bank_details})
                        serializer.is_valid(raise_exception=True)
                    
                        # Convert to JSON string
                        employee.bank_details = json.dumps(formatted_bank_details)
                        
                    except (json.JSONDecodeError, KeyError) as e:
                        return Response(
                            {'error': f'Invalid bank details format: {str(e)}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            # If bank_details is not provided, keep the existing value
                else:
                    employee.bank_details = request.data['bank_details']
              
                employee.save()
                
                if (photo):
                    # Create user-specific directory
                    user_dir = os.path.join(settings.MEDIA_ROOT, 'employee_photos', f'user_{employee.UserID}')
                    os.makedirs(user_dir, exist_ok=True)
                    
                    # Process image to optimize size
                    with Image.open(photo) as img:
                        # Resize if too large
                        max_size = (800, 800)
                        img.thumbnail(max_size, Image.LANCZOS)
                        
                        # Save with optimized format
                        filename = f"{employee.UserID}_{photo.name.split('/')[-1]}"
                        filepath = os.path.join(user_dir, filename)
                        img.save(filepath, quality=85, optimize=True)
                    
                    # Update employee with photo path
                    employee.Photo = f'employee_photos/user_{employee.UserID}/{filename}'
                    employee.save()
                
                # Invalidate employee cache
                delete_pattern("employee_list_*")
                
                return Response(UserSerializer(employee).data, status=status.HTTP_201_CREATED)
                    
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    @transaction.atomic
    def put(self, request, pk):
        try:
            # Find the employee by primary key
            employee = User.objects.select_for_update().get(UserID=pk)
            
            # Debug the incoming data
            print("Update request data:", request.data)
            print("Request data type:", type(request.data))
            
            # Extract data from request.data and request.POST
            data = {}
            
            # Try to get data from both request.data and request.POST
            for key in ['UserName', 'Email', 'Password', 'EmployeeName', 'PositionID', 'RoleID']:
                if key in request.data:
                    data[key] = request.data[key]
                elif hasattr(request, 'POST') and key in request.POST:
                    data[key] = request.POST[key]
            
            # Handle bank details
            if 'bank_details' in request.data:
                try:
                    if isinstance(request.data['bank_details'], str):
                        data['bank_details'] = json.loads(request.data['bank_details'])
                    else:
                        data['bank_details'] = request.data['bank_details']
                except json.JSONDecodeError:
                    pass
            
            # Alternative approach: try to get individual bank fields
            bank_fields = {}
            for key in ['bank_name', 'account_number', 'ifsc_code']:
                if key in request.data:
                    bank_fields[key] = request.data[key]
            
            if bank_fields and all(bank_fields.values()):
                data['bank_details'] = bank_fields
            
            # Handle photo
            if 'Photo' in request.FILES:
                data['Photo'] = request.FILES['Photo']
            
            print("Processed update data:", data)
            
            # Update the employee fields directly
            if 'UserName' in data and data['UserName']:
                employee.UserName = data['UserName']
            
            if 'Email' in data and data['Email']:
                employee.Email = data['Email']
            
            if 'EmployeeName' in data and data['EmployeeName']:
                employee.EmployeeName = data['EmployeeName']
            
            if 'Password' in data and data['Password']:
                employee.Password = data['Password']
            
            if 'PositionID' in data and data['PositionID']:
                employee.PositionID_id = data['PositionID']
            
            if 'RoleID' in data and data['RoleID']:
                employee.RoleID_id = data['RoleID']
            
            # Handle bank details
            if 'bank_details' in data and data['bank_details']:
                if isinstance(data['bank_details'], dict):
                    employee.bank_details = json.dumps(data['bank_details'])
                else:
                    employee.bank_details = data['bank_details']
            
            # Save the updated employee
            employee.save()
            
            # Handle photo upload if provided
            photo = data.get('Photo')
            if photo:
                # Create user-specific directory
                user_dir = os.path.join(settings.MEDIA_ROOT, 'employee_photos', f'user_{employee.UserID}')
                os.makedirs(user_dir, exist_ok=True)
                
                # Process image
                with Image.open(photo) as img:
                    max_size = (800, 800)
                    img.thumbnail(max_size, Image.LANCZOS)
                    
                    filename = f"{employee.UserID}_{photo.name.split('/')[-1]}"
                    filepath = os.path.join(user_dir, filename)
                    img.save(filepath, quality=85, optimize=True)
                
                # Update employee with photo path
                employee.Photo = f'employee_photos/user_{employee.UserID}/{filename}'
                employee.save()
            
            # Invalidate employee cache
            delete_pattern("employee_list_*")
            
            # Return the updated employee
            return Response(UserSerializer(employee).data, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


            
    def calculate_break_hours(self, attendance):
        # Assuming employee has an 'attendance' attribute with 'BreakHours' field
        print(attendance)
        break_hours_json = attendance.BreakHours
        break_hours = self.calculate_total_break_time(break_hours_json)
        return break_hours

    def calculate_total_break_time(self, break_hours_json):
        # Reuse the implementation from PunchInStatusView
        # You can import it or copy the implementation here
        return PunchInStatusView.calculate_total_break_time(self, break_hours_json)
    
class PositionView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    def get(self, request):
        # Use cached positions
        positions = get_cached_positions()
        if not positions:
            positions = Position.objects.all()
            serializer = PositionSerializer(positions, many=True)
            return Response(serializer.data)
        return Response(positions)

class RoleView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    def get(self, request):
        # Use cached roles
        roles = get_cached_roles()
        if not roles:
            roles = Role.objects.all()
            serializer = RoleSerializer(roles, many=True)
            return Response(serializer.data)
        return Response(roles)

class TaskCreateView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    @transaction.atomic
    def get(self, request):
            queryset = Task.objects.all()
            mine = self.request.query_params.get('mine')
            if mine == 'true':
                # Get the currently authenticated user
                user = self.request.user
                # Filter tasks based on assigned user or other relevant criteria.
                # Adapt this to your actual Task model's fields.  
                # Example using an 'assigned_to' field:
                queryset = queryset.filter(AssignedUserID=user)
                #Example using creator field:
                #queryset = queryset.filter(created_by=user)

            return Response(TaskSerializer(queryset, many=True).data)
    @transaction.atomic
    def post(self, request):
        try:
            print("Received request data:", request.data)
            data = request.data.copy()
            data['CreatedBy'] = request.user.UserID
            #data['AssignedUserID'] = request.user.UserID  
            data['CreatedDateUTC'] = timezone.now()
            
             # Handle Deadline format or set to null if not provided
            if 'Deadline' in data and not data['Deadline']:
                data['Deadline'] = None

            serializer = TaskSerializer(data=data)
            print("Task Data:", data)
            print("Task Serializer:", serializer)
            if serializer.is_valid():
                task = serializer.save()
                
                # Invalidate relevant caches
                delete_pattern("task_dashboard_*")
                delete_pattern("dashboard_stats_*")
                
                return Response(
                    TaskSerializer(task).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @transaction.atomic
    def put(self, request, pk=None, *args, **kwargs):
        try:
            print("Received put request data:", request.data)
            data = request.data.copy()
            # Use pk from the URL if not provided in the payload
            task_id = data.get('TaskID', pk)
            if not task_id:
                return Response({'error': 'TaskID is required for update'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                task = Task.objects.select_for_update().get(TaskID=task_id)
            except Task.DoesNotExist:
                return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)
                
            serializer = TaskSerializer(task, data=data, partial=True)
            if serializer.is_valid():
                serializer.save(ModifiedBy=request.user)
                
                # Invalidate relevant caches
                delete_pattern("task_dashboard_*")
                delete_pattern("dashboard_stats_*")
                
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetDevelopersView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    def get(self, request):
        try:
            # Cache developers list
            cache_key = "developers_list"
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return Response(cached_data)
                
            # Get users with Developer role efficiently
            developers = list(User.objects.values('UserID', 'EmployeeName'))
            
            # Cache for 10 minutes
            cache.set(cache_key, developers, 600)
            
            return Response(developers)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class TaskApproveView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    @transaction.atomic
    def post(self, request, taskId):
        try:
            # Get the task by ID with select_for_update to prevent race conditions
            task = Task.objects.select_for_update().get(TaskID=taskId)
            
            # Update the task with approval details
            task.IsTaskVerified = 1  # Mark as approved
            task.VerifiedByUserID = request.user
            task.VerifiedDateUTC = timezone.now()
            task.save()
            
            # Invalidate relevant caches
            delete_pattern("task_dashboard_*")
            delete_pattern("dashboard_stats_*")

            return Response({
                'message': 'Task approved successfully',
                'task_TaskID': task.TaskID,
                'verified_by': task.VerifiedByUserID.EmployeeName,
                'verified_date': task.VerifiedDateUTC
            }, status=status.HTTP_200_OK)

        except Task.DoesNotExist:
            return Response(
                {'error': 'Task not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TaskRejectView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    @transaction.atomic
    def post(self, request, taskId):
        try:
            # Get the task by ID with select_for_update to prevent race conditions
            task = Task.objects.select_for_update().get(TaskID=taskId)
            
            # Update the task with rejection details
            task.IsTaskVerified = 0  # Mark as rejected
            task.VerifiedByUserID = request.user
            task.VerifiedDateUTC = timezone.now()
            task.save()
            
            # Invalidate relevant caches
            delete_pattern("task_dashboard_*")
            delete_pattern("dashboard_stats_*")

            return Response({
                'message': 'Task rejected successfully',
                'task_id': task.TaskID,
                'verified_by': task.VerifiedByUserID.EmployeeName,
                'verified_date': task.VerifiedDateUTC
            }, status=status.HTTP_200_OK)

        except Task.DoesNotExist:
            return Response(
                {'error': 'Task not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class LeaveRequestCreateView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    @transaction.atomic
    def post(self, request):
        try:
            data = request.data.copy()
            if 'Days' in data and data['IsHalfDay']:
            # Store the original value
                original_days = data['Days']
            # For half days, round up to 1 for database storage
                data['Days'] = '1'
            
            serializer = LeaveRequestSerializer(data=request.data)
            if serializer.is_valid():
                # Set the requesting user automatically
                leave_request = serializer.save(RequestedBy=request.user)
                
                if data.get('IsHalfDay'):
                # You might need to add a separate field or model to track the actual days value
                # Or use the IsHalfDay and HalfDayType fields to calculate it when needed
                    pass
            
                # Invalidate employee cache
                delete_pattern("employee_list_*")
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class LeaveRequestListView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    def get(self, request):
        try:
            user = request.user
            
            # Create cache key based on user role and query parameters
            user_id_param = request.query_params.get('user_id', '')
            cache_key = f"leave_requests_{user.UserID}_{user.RoleID.RoleName if user.RoleID else 'norole'}_{user_id_param}"
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return Response(cached_data, status=status.HTTP_200_OK)
            
            # Start with base queryset
            queryset = LeaveRequest.objects.select_related('RequestedBy', 'ApprovedBy')

            # Check if user has permission to view all requests
            if user.RoleID and user.RoleID.RoleName in ['Super Admin', 'Admin', 'HR']:
                # Filter by user_id if provided in query params
                user_id = request.query_params.get('user_id')
                if user_id:
                    try:
                        queryset = queryset.filter(RequestedBy=user_id)
                    except ValueError:
                        return Response(
                            {'error': 'Invalid user_id format'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            else:
                # Non-admin users only see their own requests
                queryset = queryset.filter(RequestedBy=user.UserID)

            serializer = LeaveRequestSerializer(queryset, many=True)
            
            # Cache for 5 minutes
            #cache.set(cache_key, serializer.data, 300)
            
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @transaction.atomic
    def post(self, request, pk=None, action=None):
        try:
            # Use select_for_update to prevent race conditions
            print(pk)
            leave_request = LeaveRequest.objects.select_for_update().get(pk=pk)
            current_time = timezone.now()
            
            if action == 'approve':
                leave_request.Status = 'Approved'
                leave_request.ApprovedBy = request.user
                leave_request.ApprovedAt = current_time
                leave_request.save()
                
                Notification.objects.create(
                    user=leave_request.RequestedBy,
                    message=f"Your leave request for {leave_request.FromDate} to {leave_request.ToDate} was approved"
                )
                
                # Invalidate relevant caches
                delete_pattern("leave_requests_*")
                delete_pattern("employee_list_*")
                
                return Response({'message': 'Leave request approved'}, status=status.HTTP_200_OK)
                
            elif action == 'reject':
                leave_request.Status = 'Rejected'
                leave_request.ApprovedBy = request.user
                leave_request.ApprovedAt = current_time
                leave_request.save()
                
                # Invalidate relevant caches
                delete_pattern("leave_requests_*")
                delete_pattern("employee_list_*")
                
                return Response({'message': 'Leave request rejected'}, status=status.HTTP_200_OK)
                
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
            
        except LeaveRequest.DoesNotExist:
            return Response({'error': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class WorkFromHomeRequestView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    @transaction.atomic
    def post(self, request):
        try:
            data = request.data.copy()
            if 'IsHalfDay' in data:
                if isinstance(data['IsHalfDay'], str):
                    data['IsHalfDay'] = data['IsHalfDay'].lower() == 'true'
        
            # For half-day requests
            if data.get('IsHalfDay'):
                # Ensure FromDate and ToDate are the same
                if data.get('FromDate'):
                    data['ToDate'] = data['FromDate']
                
                # Set Days to 0.5 for half-day
                data['Days'] = 0.5
            else:
                # For full-day requests, calculate days if not provided
                if 'FromDate' in data and 'ToDate' in data and ('Days' not in data or not data['Days']):
                    from_date = datetime.strptime(data['FromDate'], '%Y-%m-%d').date()
                    to_date = datetime.strptime(data['ToDate'], '%Y-%m-%d').date()
                    delta = to_date - from_date
                    data['Days'] = delta.days + 1
                    
            
            serializer = WorkFromHomeRequestSerializer(data=data)
            if serializer.is_valid():
                # Set the requesting user automatically
                print(serializer.validated_data)
                wfh_request = serializer.save(RequestedBy=request.user)
                
                # Invalidate employee cache
                delete_pattern("employee_list_*")
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request):
        try:
            user = request.user
            
            # Create cache key based on user role and query parameters
            user_id_param = request.query_params.get('user_id', '')
            cache_key = f"wfh_requests_{user.UserID}_{user.RoleID.RoleName if user.RoleID else 'norole'}_{user_id_param}"
            cached_data = cache.get(cache_key)
            
            # if cached_data:
            #     return Response(cached_data, status=status.HTTP_200_OK)
            
            # Start with base queryset
            queryset = WorkFromHomeRequest.objects.select_related('RequestedBy', 'ApprovedBy')

            # Check if user has permission to view all requests
            if user.RoleID and user.RoleID.RoleName in ['Super Admin', 'Admin', 'HR']:
                # Filter by user_id if provided in query params
                user_id = request.query_params.get('user_id')
                if user_id:
                    try:
                        queryset = queryset.filter(RequestedBy=user_id)
                    except ValueError:
                        return Response(
                            {'error': 'Invalid user_id format'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            else:
                # Non-admin users only see their own requests
                queryset = queryset.filter(RequestedBy=user.UserID)

            serializer = WorkFromHomeRequestSerializer(queryset, many=True)
            
            # Cache for 5 minutes
            cache.set(cache_key, serializer.data, 300)
            
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class WorkFromHomeRequestActionView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    @transaction.atomic
    def post(self, request, pk, action):
        try:
            # Use select_for_update to prevent race conditions
            wfh_request = WorkFromHomeRequest.objects.select_for_update().get(pk=pk)
            current_time = timezone.now()
            
            if action == 'approve':
                wfh_request.Status = 'Approved'
                wfh_request.ApprovedBy = request.user
                wfh_request.ApprovedAt = current_time
                wfh_request.Comments = request.data.get('comments', '')
                wfh_request.save()
                
                Notification.objects.create(
                user=wfh_request.RequestedBy,
                message=f"Your work from home request for {wfh_request.FromDate} to {wfh_request.ToDate} was approved",
            )
                
                # Invalidate relevant caches
                delete_pattern("wfh_requests_*")
                delete_pattern("employee_list_*")
                
                return Response({'message': 'Work from home request approved'}, status=status.HTTP_200_OK)
                
            elif action == 'reject':
                wfh_request.Status = 'Rejected'
                wfh_request.ApprovedBy = request.user
                wfh_request.ApprovedAt = current_time
                wfh_request.Comments = request.data.get('comments', '')
                wfh_request.save()
                
                Notification.objects.create(
                user=wfh_request.RequestedBy,
                message=f"Your work from home request for {wfh_request.FromDate} to {wfh_request.ToDate} was rejected",
            )
                # Invalidate relevant caches
                delete_pattern("wfh_requests_*")
                delete_pattern("employee_list_*")
                
                return Response({'message': 'Work from home request rejected'}, status=status.HTTP_200_OK)
                
            elif action == 'cancel':
                # Only the requester can cancel their request
                if wfh_request.RequestedBy.UserID != request.user.UserID:
                    return Response(
                        {'error': 'You can only cancel your own requests'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                wfh_request.Status = 'Cancelled'
                wfh_request.Comments = request.data.get('comments', '')
                wfh_request.save()
                
                # Invalidate relevant caches
                delete_pattern("wfh_requests_*")
                
                return Response({'message': 'Work from home request cancelled'}, status=status.HTTP_200_OK)
                
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
            
        except WorkFromHomeRequest.DoesNotExist:
            return Response({'error': 'Work from home request not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def check_notifications(request):
    notifications = Notification.objects.filter(
        user=request.user,
        read=False
    ).order_by('-created_at')
    return Response({'notifications': [
        {'message': n.message, 'id': n.id} 
        for n in notifications
    ]}) 
    
    
# --- Notification Views ---
class NotificationListView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    def get(self, request):
        try:
            # Print debugging information
            print(f"Current user: {request.user.UserID}, {request.user.UserName}")
            
            # Get notifications for the current user, ordered by created_at (newest first)
            notifications = Notification.objects.filter(
                user=request.user,
            ).order_by('-created_at')
            
            # Print count of notifications found
            print(f"Found {notifications.count()} notifications for user {request.user.UserID}")
            
            # Check if there are any notifications in the database at all
            total_notifications = Notification.objects.all().count()
            print(f"Total notifications in database: {total_notifications}")
            
            # If there are notifications in the database but none for this user,
            # let's check which users have notifications
            if total_notifications > 0 and notifications.count() == 0:
                user_counts = Notification.objects.values('user').annotate(
                    count=Count('id')
                )
                print("Notification counts by user:")
                for uc in user_counts:
                    user_id = uc['user']
                    try:
                        username = User.objects.get(UserID=user_id).UserName
                        print(f"  User {user_id} ({username}): {uc['count']} notifications")
                    except User.DoesNotExist:
                        print(f"  User {user_id} (not found): {uc['count']} notifications")
            
            # Prepare the response data
            notification_data = []
            for notification in notifications:
                notification_data.append({
                    'id': notification.id,
                    'message': notification.message,
                    'is_read': notification.is_read,
                    'created_at': notification.created_at
                })
            
            return Response(notification_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in NotificationListView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MarkNotificationReadView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    def post(self, request, pk):
        try:
            # Find the notification and ensure it belongs to the current user
            notification = Notification.objects.get(
                id=pk,
                user=request.user
            )
            
            # Mark as read
            notification.is_read = True
            notification.save()
            
            return Response(
                {'message': 'Notification marked as read'}, 
                status=status.HTTP_200_OK
            )
            
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MarkAllNotificationsReadView(APIView):
    permission_classes = PERM_CLASSES
    authentication_classes = AUTH_CLASSES

    def post(self, request):
        try:
            # Update all unread notifications for the current user
            updated_count = Notification.objects.filter(
                user=request.user,
                is_read=False
            ).update(is_read=True)
            
            return Response(
                {
                    'message': f'{updated_count} notifications marked as read',
                    'count': updated_count
                }, 
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes(PERM_CLASSES)
@authentication_classes(AUTH_CLASSES)
def employees_for_reports(request):
    """
    Returns a simplified list of employees for use in report filters.
    """
    try:
        # Get all employees with minimal fields
        employees = User.objects.values('UserID', 'EmployeeName', 'EmployeeID')
        
        # Format the response in a way that matches the frontend expectations
        formatted_employees = [
            {
                'id': employee['EmployeeID'] or str(employee['UserID']),
                'name': employee['EmployeeName']
            }
            for employee in employees
        ]
        
        return Response(formatted_employees, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
# Add this new function to your views.py file
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@authentication_classes([CustomJWTAuthentication])
def projects_for_reports(request):
    """
    Returns a simplified list of projects for use in report filters.
    """
    try:
        # Get all projects with minimal fields
        projects = Project.objects.values('ProjectID', 'Name').order_by('Name')
        
        # Format the response
        formatted_projects = [
            {
                'id': str(project['ProjectID']),  # Convert to string to ensure JSON serialization
                'name': project['Name']
            }
            for project in projects
        ]
        
        return Response(formatted_projects, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error in projects_for_reports: {str(e)}")  # Add logging
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
