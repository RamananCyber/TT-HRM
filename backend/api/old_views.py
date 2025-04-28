from math import ceil
from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Task, User, Project, ProjectState, Attendance, TaskLogs , Position, Role, LeaveRequest, TaskLogs, Attendance    # Updated imports
from .serializers import TaskSerializer, UserSerializer, ProjectSerializer, PositionSerializer, RoleSerializer,  LeaveRequestSerializer  # Updated serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from .auth import CustomJWTAuthentication
import base64
import json
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from django.core.paginator import Paginator
from django.db.models import Sum, Count
from io import BytesIO
from PIL import Image
from django.utils import timezone
from django.db.models import Q
from django.conf import settings
import os
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta
from django.core.cache import cache
from rest_framework.decorators import action
# --- User Authentication Views ---
class UserRegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = User.objects.create(
                    UserName=serializer.validated_data['UserName'],
                    Email=serializer.validated_data['Email'],
                    Password=request.data['Password'],  # Now matches model field
                    EmployeeName=serializer.validated_data.get('EmployeeName', ''),
                    # Add other required fields
                )
                return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        print("=== Login Request Data ===")
        print(request.data)
        
        username = request.data.get('username')
        password = request.data.get('password')
        
        try:
            print(f"Looking for user with UserName: {username}")
            
            user = User.objects.get(UserName=username)
            position = Position.objects.get(id=user.PositionID.id)
            
            user = User.objects.select_related('RoleID').get(UserName=username)
            
            if user.Password == password:
                # Use custom_payload to include UserID instead of id
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
                        'id': position.id,
                        'name': position.position_name
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
            print(f"No user found with UserName: {username}")
            return Response(
                {'error': f'User not found: {username}'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Login error: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# --- Task Views ---
class TaskListView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]
    # Override get_queryset to filter by current user if query param 'mine' is true
    def get_queryset(self):
        qs = Task.objects.all()
        if self.request.user.is_authenticated and self.request.query_params.get('mine') == 'true':
            qs = qs.filter(AssignedUserID=self.request.user, Status__in=['queue', 'in_progress', 'on_hold'])
        return qs

# class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = Task.objects.all()
#     serializer_class = TaskSerializer
#     permission_classes = [IsAuthenticated]
#     authentication_classes = [CustomJWTAuthentication]

#     def update(self, request, *args, **kwargs):
#         task = self.get_object()
        
#         # Update task fields
#         task.InProgressPercentage = request.data.get('inProgressPercentage', task.InProgressPercentage)
#         task.PriorityLevel = request.data.get('priorityLevel', task.PriorityLevel)
#         task.ModifiedBy = request.user
#         task.save()

#         # Create work log entry if provided
#         work_log_entry = request.data.get('workLogEntry')
#         if work_log_entry and work_log_entry.get('startTime') and work_log_entry.get('endTime'):
#             TaskWorkLog.objects.create(
#                 TaskID=task,
#                 UserID=request.user,
#                 StartTimeUTC=work_log_entry['startTime'],
#                 EndTimeUTC=work_log_entry['endTime']
#             )

#         return Response(self.serializer_class(task).data)

#     def destroy(self, request, *args, **kwargs):
#         task = self.get_object()
#         task.delete()
#         return Response(status=status.HTTP_204_NO_CONTENT)

# --- Project Views ---
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def perform_create(self, serializer):
        print("Performing create...")
        
        instance = serializer.save(
            CreatedBy=self.request.user,
            ModifiedBy=self.request.user
        )
        # Save assigned users
        assigned_users = self.request.data.get('AssignedUsers', [])
        instance.AssignedUsers.set(assigned_users)

    def perform_update(self, serializer):
        print("Performing update...")
        instance = serializer.save(ModifiedBy=self.request.user)
        # Update assigned users
        assigned_users = self.request.data.get('AssignedUsers', [])
        instance.AssignedUsers.set(assigned_users)
        
# views.py
class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        try:
            # Sample queryset; adjust filtering as needed.
            queryset = Project.objects.all()

            # For example, if you're paginating your projects:
            paginator = Paginator(queryset, 10)  # Replace 10 with page size if needed
            page = int(request.GET.get('page', 1))
            projects_page = paginator.page(page)

            projects_data = []
            for project in projects_page:
                projects_data.append({
                    'ProjectName': project.Name,
                    # Include any additional fields as needed.
                })


             # Calculate task status counts. Adjust field name "TaskState" as per your Task model.
            tasks_queryset = Task.objects.all()
            tasks_status_counts = {
                'pending': tasks_queryset.filter(Status='queue').count(),
                'in_progress': tasks_queryset.filter(Status='in_progress').count(),
                'completed': tasks_queryset.filter(Status='completed').count(),
                'pending_approval': tasks_queryset.filter(Status='pending_approval').count(),
                
            }


            # Additional metrics
            active_users = User.objects.count()
            completed_tasks = Task.objects.filter(CompletedDateUTC__isnull=False).count()
            total_hours_logged_agg = TaskLogs.objects.aggregate(total_hours=Sum('HoursWorked'))
            total_hours = float(total_hours_logged_agg.get('total_hours')) if total_hours_logged_agg.get('total_hours') else 0
            
            # Calculate total counts if required.
            total_counts = {
                'projects': queryset.count(),
                'activeUsers': active_users,
                'completedTasks': completed_tasks,
                'totalHours': total_hours,
                # Add other count aggregations if needed.
            }

            # Compute the status counts by iterating over all projects.
            all_projects = queryset.all()  # Or adjust for filtering if needed.
            status_counts = {
                'queue': sum(1 for p in all_projects if p.ProjectState == 'queue'),
                'in_progress': sum(1 for p in all_projects if p.ProjectState == 'in_progress'),
                'completed': sum(1 for p in all_projects if p.ProjectState == 'completed')
            }
            

            return Response({
                'count': paginator.count,
                'num_pages': paginator.num_pages,
                'current_page': page,
                'results': projects_data,
                'status_counts': status_counts,
                'tasks_status_counts': tasks_status_counts,
                'total_counts': total_counts
            })
        except Exception as e:
            print(f"Project Dashboard Error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
  
  
class DailyReportsView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        try:
            # Retrieve query parameters
            month = request.query_params.get('month')
            year = request.query_params.get('year')
            employee_id = request.query_params.get('emp_id')

            # Default to current month/year if not provided
            today = timezone.now().date()
            if not month or not year:
                month = today.month
                year = today.year
            else:
                month = int(month)
                year = int(year)

            # Build filters
            filters = Q(PunchInTime__month=month, PunchInTime__year=year)
            if employee_id:
                filters &= Q(UserID__EmployeeID=employee_id)

            # Get attendance records with related data
            attendance_qs = Attendance.objects.filter(filters).select_related(
                'UserID'
            ).prefetch_related(
                'tasklogs_set__TaskID__ProjectID'
            )

            report_data = []
            
            for attendance in attendance_qs:
                # Skip incomplete records
                if not attendance.PunchOutTime:
                    continue

                # Calculate effective hours
                punch_in = attendance.PunchInTime
                punch_out = attendance.PunchOutTime
                work_duration = punch_out - punch_in
                
                # Subtract break time
                break_hours = json.loads(attendance.BreakHours) if attendance.BreakHours else []
                total_break = sum(b.get('duration', 0) for b in break_hours)  # in minutes
                
                effective_seconds = max(work_duration.total_seconds() - (total_break * 60), 0)
                effective_hours = round(effective_seconds / 3600, 2)

                # Get task details
                task_logs = attendance.tasklogs_set.all()
                project_names = set()
                work_notes = []

                for log in task_logs:
                    if log.TaskID and log.TaskID.ProjectID:
                        project_names.add(log.TaskID.ProjectID.Name)
                    if log.Notes:
                        work_notes.append(log.Notes)
                    elif log.TaskID:
                        work_notes.append(log.TaskID.TaskName)

                # Format the entry
                report_entry = {
                    "Emp ID": attendance.UserID.EmployeeID,
                    "Emp Name": attendance.UserID.EmployeeName,
                    "Date": punch_in.date().isoformat(),
                    "Section": "Full Day",  # Hardcoded as per requirement
                    "Hours": effective_hours,
                    "Project Name": ", ".join(project_names) if project_names else "N/A",
                    "Work": ", ".join(work_notes) if work_notes else "General work"
                }
                
                report_data.append(report_entry)

            return Response(report_data, status=status.HTTP_200_OK)

        except Exception as e:
            print("Error in DailyReportsView:", e)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                  
# --- Dashboard View ---
class TaskDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        try:
            # Get query parameters
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 10))
            status_filter = request.GET.get('state')  # Changed from state to status
            mine = request.GET.get('mine')
            
            total_counts = Task.objects.aggregate(
                queue=Count('pk', filter=Q(Status='queue')),
                in_progress=Count('pk', filter=Q(Status='in_progress')),
                completed=Count('pk', filter=Q(Status='completed'))
            )
            
            # Base queryset with related fields
            tasks = Task.objects.select_related(
                'ProjectID',
                'AssignedUserID'  # Changed from AssignedTo
            ).annotate(
               total_hours_worked=Sum('tasklogs__HoursWorked', filter=Q(tasklogs__UserID=request.user))
            )

            # Filter by status if provided
            if status_filter == 'pending_approval':
                tasks = tasks.filter(CompletedDateUTC__isnull=False, IsTaskVerified=0) # Only pending_approval
            elif status_filter and status_filter in ['queue', 'in_progress', 'completed']: # Then apply other filters
                tasks = tasks.filter(Status=status_filter) # Changed from CurrentStateID__Value
                
            print (tasks)
              # Filter by assigned user if 'mine' is true
            if mine == 'true' and request.user.is_authenticated:
                tasks = tasks.filter(AssignedUserID=request.user)

            # Create paginator
            paginator = Paginator(tasks, page_size)
            current_page = paginator.get_page(page)

            # Prepare response data
            serialized_tasks = []
            for task in current_page:
                task_data = {
                    'TaskID': task.TaskID,
                    'TaskName': task.TaskName,  # Added TaskName
                    'Description': task.Description,  # Added Description
                    'ProjectName': task.ProjectID.Name if task.ProjectID else None,
                    'Priority': task.Priority,  # Changed from PriorityLevel
                    'Status': task.Status,  # Changed from CurrentState
                    'Deadline': task.Deadline,  # Added Deadline
                    'ExpectedHours': task.ExpectedHours,  # Added ExpectedHours
                    'CompletedDateUTC': task.CompletedDateUTC,  
                    'AssignedTo': {
                        'UserID': task.AssignedUserID.UserID,
                        'EmployeeName': task.AssignedUserID.EmployeeName
                    } if task.AssignedUserID else None,
                    'Progress': {
                        # 'CompletedDateUTC': task.CompletedDateUTC,
                        # 'InProgressPercentage': task.InProgressPercentage or 0,
                    },
                    'HoursWorked': task.total_hours_worked  or 0,
                }
                if status_filter == 'pending_approval': # Conditionally Include Fields
                    task_data['CompletedDateUTC'] = task.CompletedDateUTC #Now always available for pending_approval view
                    task_data['IsTaskVerified'] = task.IsTaskVerified
                task_data['Status'] = status_filter
                serialized_tasks.append(task_data)

            return Response({
                'count': paginator.count,
                'num_pages': paginator.num_pages,
                'results': serialized_tasks,
                'current_page': page,
                'total_counts': total_counts
            })

        except Exception as e:
            print(f"Dashboard Error: {str(e)}")  # Added error logging
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# --- User Profile Views ---
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request, user_id):
        try:
            user = User.objects.get(UserID=user_id)  # Use model's UserID
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, user_id):
        try:
            user = User.objects.get(UserID=user_id)
            data = request.data.copy()

            # Handle photo upload
            if 'photo' in request.FILES:
                photo_file = request.FILES['photo']
                img = Image.open(photo_file)
                
                # Resize image if too large (optional)
                max_size = (800, 800)
                img.thumbnail(max_size, Image.LANCZOS)
                
                # Convert to JPEG format
                output = BytesIO()
                img.save(output, format='JPEG', quality=85)
                
                # Convert to base64
                base64_image = base64.b64encode(output.getvalue()).decode('utf-8')
                data['Photo'] = f"data:image/jpeg;base64,{base64_image}"

            serializer = UserSerializer(user, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# --- Other Views ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@authentication_classes([CustomJWTAuthentication])
def get_user_role(request):
    try:
        return Response({
            'role': request.user.RoleID_id,  # Access FK ID directly
            'user_id': request.user.UserID,
            'username': request.user.UserName
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Keep other views (CustomerViewSet, etc) with similar field name adjustments

class PunchInView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        try:
            # Get selected tasks from request
            selected_task_ids = request.data.get('tasks', [])
            
            dummy_project, created = Project.objects.get_or_create(
                Name="Dummy Project - Auto Generated",
                defaults={
                    "Description": "Project created automatically for dummy tasks when no real project exists.",
                    "CreatedBy": request.user,  # or assign a default user if necessary
                    "ProjectState": "in_progress",  # Or the state you deem appropriate
                    "ExpectedHours": 0,
                }
            )
            
            dummy_task = None  # Initialize dummy_task
            
            if not selected_task_ids:
                dummy_task = Task.objects.create(
                    TaskName="Dummy Task - Auto Generated",
                    Description="Created automatically as no tasks were selected.",
                    ProjectID=dummy_project,  # ensure ProjectID is nullable or assign a default project if needed
                    AssignedUserID=request.user,
                    Status="in_progress",  # set initial status as needed
                    ExpectedHours=0,
                    Priority="low",  # lowest priority for dummy task
                    Deadline=None,
                )
                selected_task_ids = [dummy_task.TaskID]

            
            if not selected_task_ids:
                return Response(
                    {'error': 'No tasks selected'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            tasks = Task.objects.filter(TaskID__in=selected_task_ids)
            
            current_time_utc = timezone.now() 

            
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
           
            print(f"Attendance created:", {attendance.PunchInTime})
           
            # Get existing task logs
            existing_task_logs = TaskLogs.objects.filter(
                UserID=request.user,
                AttendanceID=attendance
            ).values_list('TaskID_id', flat=True)

           # Create task log entries for each selected task only if they dont exist
            for task_id in selected_task_ids:
                if task_id not in existing_task_logs:
                    task = Task.objects.get(TaskID=task_id)
                    TaskLogs.objects.create(
                        TaskID=task,
                        UserID=request.user,
                        AttendanceID=attendance,
                        Status='in_progress',
                        HoursWorked=0,  # Initial hours worked is 0
                        LogDate=timezone.localtime(timezone.now()).date()  # Add LogDate field
                    )
            punch_in_local = timezone.localtime(attendance.PunchInTime)
            response_data = {
                'message': 'Punched in successfully',
                'attendance_id': attendance.AttendanceID,
                'punch_in_time': punch_in_local.isoformat(),
            }
            # Optionally include the dummyTaskId if a dummy task was created.
            if dummy_task:
                response_data['dummyTaskId'] = dummy_task.TaskID
            
            return Response(response_data, status=status.HTTP_201_CREATED)

        except Task.DoesNotExist:
            return Response(
                {'error': 'One or more tasks not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(e)
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PunchOutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        try:
            # Get today's attendance record
            today = timezone.localtime(timezone.now()).date()
            attendance = Attendance.objects.filter(
                UserID=request.user,
                PunchInTime__date=today,
                PunchOutTime__isnull=True
            ).latest('CreatedDateUTC')

            # Calculate total break time (in minutes)
            break_hours = json.loads(attendance.BreakHours) if attendance.BreakHours else []
            total_break_minutes = 0
            for break_period in break_hours:
                if 'duration' in break_period:
                    total_break_minutes += break_period['duration']
            total_break_time = timedelta(minutes=total_break_minutes)

            # Calculate total work time (punch-in to punch-out)
            punch_in_time = attendance.PunchInTime
            current_time = timezone.now()
            total_work_time = current_time - punch_in_time

            # Subtract break time from total work time
            total_work_time -= total_break_time

            # Convert total work time to hours
            total_work_time_hours = total_work_time.total_seconds() / 3600

            # Get task details from request
            task_details = request.data.get('tasks', [])

            if not isinstance(task_details, list):
                return Response(
                    {'error': 'Task details must be a list'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Calculate total hours worked across all tasks
            total_hours_worked = 0
            for task_detail in task_details:
                if not isinstance(task_detail, dict):
                    print('Task detail is not a dictionary')
                    continue
                
                task_id = task_detail.get('taskId')
                hours_worked = task_detail.get('hoursWorked')
                comments = task_detail.get('comments', '')
                mark_completed = task_detail.get('markCompleted', False)
                
                if task_id is None or hours_worked is None:
                    print('Task ID and hours worked are required')
                    continue

                # Add to total hours worked
                total_hours_worked += float(hours_worked)

            # Ensure total hours worked does not exceed total work time
            if total_hours_worked > total_work_time_hours:
                return Response(
                    {'error': 'Total hours worked exceeds allowable work time'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update attendance record with punch out time
            attendance.PunchOutTime = current_time
            attendance.save()

            # Update task logs
            for task_detail in task_details:
                if not isinstance(task_detail, dict):
                    print('Task detail is not a dictionary')
                    continue
                
                task_id = task_detail.get('taskId')
                hours_worked = task_detail.get('hoursWorked')
                comments = task_detail.get('comments', '')
                mark_completed = task_detail.get('markCompleted', False)
                
                if task_id is None or hours_worked is None:
                    print('Task ID and hours worked are required')
                    continue
            
                task_log = TaskLogs.objects.filter(
                    TaskID_id=task_id,
                    UserID=request.user,
                    AttendanceID=attendance
                ).first()
                
                if task_log:
                    task_log.HoursWorked = hours_worked
                    task_log.Status = 'completed'
                    task_log.Notes = comments
                    
                    if mark_completed:  # Update completed date if marked as complete
                        task = Task.objects.get(TaskID=task_id)
                        task.CompletedDateUTC = timezone.now()
                        task.CompletedByUserID = request.user
                        task.AssignedByUserID = request.user
                        task.save()

                    task_log.CompletedDateUTC = timezone.now()  
                        
                    task_log.ModifiedDateUTC = timezone.now()
                    task_log.save()

            return Response({
                'message': 'Punched out successfully',
                'punch_out_time': attendance.PunchOutTime
            }, status=status.HTTP_200_OK)

        except Attendance.DoesNotExist:
            return Response(
                {'error': 'No active attendance record found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(e)    
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@authentication_classes([CustomJWTAuthentication])
def project_hours(request):
    projects = Project.objects.all()
    project_stats = []

    for project in projects:
        # Calculate completed hours from TaskWorkLog
        completed_hours = TaskLogs.objects.filter(
            TaskID__ProjectID=project
        ).aggregate(
            total_hours=Sum('HoursWorked')
        )['total_hours'] or 0

        project_stats.append({
            'ProjectName': project.Name,
            'ExpectedHours': project.ExpectedHours,  # Add this field to your Project model
            'CompletedHours': float(completed_hours)
        })

    return Response(project_stats)

class TaskPunchOutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

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
            current_time_utc = timezone.now()  # Use UTC time for consistency
            today_utc = current_time_utc.date()
            attendance = Attendance.objects.filter(
                UserID=request.user,
                PunchInTime__date=today_utc,
                PunchOutTime__isnull=True
            ).first()
            
            print(today_utc)
            print(attendance)
            
            if not attendance:
                return Response(
                    {'error': 'No active attendance found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Calculate Maximum Worked Time
            punch_in_time = attendance.PunchInTime
            current_time = timezone.now()
            max_work_time = current_time - punch_in_time

            # Calculating total_break_time:
            total_break_time = timedelta()
            break_hours = json.loads(attendance.BreakHours) if attendance.BreakHours else []
            for break_period in break_hours:
                if 'duration' in break_period:
                    total_break_time += timedelta(minutes=break_period['duration'])

            # Subtract break time from total work time
            max_work_time -= total_break_time

            print("max_work_time" + str(max_work_time))
            
            print("hours_worked" + str(hours_worked))
            # Ensure hours_worked does not exceed maximum
            if hours_worked > (max_work_time.total_seconds() / 3600):
                return Response(
                    {'error': 'Hours worked exceeds maximum allowable time'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Ensure  hours_worked added to already added does not exceed maximum.
            existing_hours_worked = TaskLogs.objects.filter(
                TaskID_id=task_id,
                UserID=request.user,
                AttendanceID=attendance
            ).aggregate(total_hours=Sum('HoursWorked'))['total_hours'] or 0

            total_current_time = existing_hours_worked + hours_worked
            print("total_current_time" + str(total_current_time))
            # Calculate total worked time with existing hours
            
            if total_current_time > (max_work_time.total_seconds() / 3600):
                return Response(
                    {'error': 'Total time including current is not within range of work hours with Punch In'},
                    status=status.HTTP_400_BAD_REQUEST
                )
          

            # Update the task log
            task_log = TaskLogs.objects.get(
                TaskID_id=task_id,
                UserID=request.user,
                AttendanceID=attendance,
                Status='in_progress'
            )

            task_log.HoursWorked = hours_worked
            task_log.Notes = comments
            task_log.Status = 'completed'
            
            if mark_completed:  # Update completed date if marked as complete
                task = Task.objects.get(TaskID=task_id)
                task.CompletedDateUTC = timezone.now()
                task.CompletedByUserID = request.user
                task.AssignedByUserID = request.user
                task.save()
            
            task_log.ModifiedDateUTC = timezone.now()
            task_log.save()
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
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def calculate_total_break_time(self, break_hours_json):
        total_minutes = 0
        try:
            break_hours = json.loads(break_hours_json)
            for break_period in break_hours:
                duration = break_period.get('duration')
                if isinstance(duration, (int, float)):
                    total_minutes += int(duration)
        except (json.JSONDecodeError, TypeError):
            # Handle cases where BreakHours is not a valid JSON or has unexpected structure
            return 0
        return total_minutes

    def get(self, request):
        try:
            # Get today's attendance record
            current_time = timezone.now()
            today = current_time.date()
        
            attendance = Attendance.objects.filter(
                UserID=request.user,
                PunchInTime__date=today,
                PunchOutTime__isnull=True
            ).first()
            
            print(today)
        
          
        # Debug prints
          

            if attendance:
                # Get task logs linked to this attendance
                task_logs = TaskLogs.objects.select_related(
                    'TaskID',
                    'TaskID__ProjectID'
                ).filter(
                    UserID=request.user,
                    LogDate=today,
                    AttendanceID=attendance
                )
                
                task_logs = task_logs.values(
                    'TaskID__TaskID',
                    'TaskID__TaskName',
                    'TaskID__Description',
                    'TaskID__ProjectID__Name',
                    'TaskID__Priority',
                    'TaskID__ExpectedHours',
                    'TaskID__Deadline',
                    'HoursWorked',
                    'Notes',
                    'Blockers',
                    'Status'
                )
                
                print(f"Raw SQL Query: {task_logs.query}")
                print(f"Task Logs Count: {task_logs.count()}")
                print(f"Task Logs: {list(task_logs.values())}")

                total_break_time = self.calculate_total_break_time(attendance.BreakHours)
                
                tasks = []
                for log in task_logs:
                    tasks.append({
                        'TaskID': log['TaskID__TaskID'],
                        'TaskName': log['TaskID__TaskName'],
                        'Description': log['TaskID__Description'],
                        'project_name': log['TaskID__ProjectID__Name'],
                        'Priority': log['TaskID__Priority'],
                        'ExpectedHours': log['TaskID__ExpectedHours'],
                        'Deadline': log['TaskID__Deadline'],
                        'hours_worked': log['HoursWorked'],
                        'comments': log['Notes'],
                        'blockers': log['Blockers'],
                        'is_completed': log['Status'] == 'completed',
                        'status': log['Status']
                    })

                return Response({
                    'is_punched_in': True,
                    'attendance_id': attendance.AttendanceID if attendance else None,
                    'punch_in_time': attendance.PunchInTime if attendance else None,
                    'BreakHours': total_break_time if attendance else None,
                    'tasks': tasks if attendance else None
                })
                
            else:
                return Response({
                    'is_punched_in': False,
                })


        except Exception as e:
            print(e)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class BreakStartView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        try:
            # Get today's attendance record
            today = timezone.localtime(timezone.now()).date()
            attendance = Attendance.objects.filter(
                UserID=request.user,
                PunchInTime__date=today,
                PunchOutTime__isnull=True
            ).latest('CreatedDateUTC')

            # Convert existing break hours to list or initialize empty list
            break_hours = json.loads(attendance.BreakHours) if attendance.BreakHours else []
            
            # Add new break start time
            break_hours.append({
                'start': timezone.now().isoformat(),
                'end': None
            })
            
            # Update attendance record
            attendance.BreakHours = json.dumps(break_hours)
            attendance.save()

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
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        try:
            # Get today's attendance record
            today = timezone.localtime(timezone.now()).date()
            attendance = Attendance.objects.filter(
                UserID=request.user,
                PunchInTime__date=today,
                PunchOutTime__isnull=True
            ).latest('CreatedDateUTC')

            # Get and update break hours
            break_hours = json.loads(attendance.BreakHours) if attendance.BreakHours else []
            
            if break_hours and break_hours[-1]['end'] is None:
                break_start_time = datetime.strptime(break_hours[-1]['start'], '%Y-%m-%dT%H:%M:%S.%f%z')
                duration = (timezone.now() - break_start_time).total_seconds() / 60  # in minutes
                break_hours[-1]['end'] = timezone.now().isoformat()
                break_hours[-1]['duration'] = duration
                    
                attendance.BreakHours = json.dumps(break_hours)
                attendance.save()

                return Response({
                    'message': 'Break ended successfully',
                    'break_end': break_hours[-1]['end'],
                    'duration': duration
                }, status=status.HTTP_200_OK)
            
            return Response(
                {'error': 'No active break found'}, 
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

class BreakEndView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        try:
            duration = request.data.get('duration')
            if duration is None:
                return Response(
                    {'error': 'Break duration is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            attendance = Attendance.objects.filter(
                UserID=request.user,
                PunchInTime__date=timezone.now().date(),
                PunchOutTime__isnull=True
            ).latest('CreatedDateUTC')

            try:
                # Parse existing break hours or create empty list
                break_hours = json.loads(attendance.BreakHours) if attendance.BreakHours else []
                
                if break_hours and isinstance(break_hours[-1], dict) and break_hours[-1].get('end') is None:
                    # Update the last break entry
                    break_hours[-1] = {
                        'start': break_hours[-1]['start'],
                        'end': timezone.now().isoformat(),
                        'duration': int(duration)  # Ensure duration is an integer
                    }
                    
                    # Convert to JSON string with proper formatting
                    attendance.BreakHours = json.dumps(break_hours, ensure_ascii=False)
                    attendance.save()

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
                print(f"JSON Decode Error: {str(je)}")
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
            print(f"Error in BreakEndView: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProjectDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        try:
            # Get query parameters
            
            print(request.GET)
            
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 10))
            status_filter  = request.GET.get('status')
            search = request.GET.get('search', '').lower()


# Get total counts from database (unfiltered)
            total_counts = {
                'queue': Project.objects.filter(ProjectState='queue').count(),
                'in_progress': Project.objects.filter(ProjectState='in_progress').count(),
                'completed': Project.objects.filter(ProjectState='completed').count(),
            }
            # Base queryset with related fields
            queryset = Project.objects.select_related(
                'CreatedBy',
                'ModifiedBy'
            )

            # Apply search if provided
            if search:
                queryset = queryset.filter(
                    Q(Name__icontains=search) |
                    Q(Description__icontains=search)
                )

            # Filter by status if provided
            if status_filter and status_filter in ['queue', 'in_progress', 'completed']:
                queryset = queryset.filter(ProjectState=status_filter)

            # Create paginator
            paginator = Paginator(queryset, page_size)
            current_page = paginator.get_page(page)

            # Prepare response data
            projects_data = []
            for project in current_page:
                #total_tasks = Task.objects.filter(ProjectID=project).count()
                total_tasks = project.TotalTasks
                completed_tasks = project.CompletedTasks
                total_task_hours = TaskLogs.objects.filter(
                    TaskID__ProjectID=project
                ).aggregate(
                    total_hours=Sum('HoursWorked')
                )['total_hours'] or 0
                assigned_users = project.AssignedUsers.all().values('UserID', 'EmployeeName')
                # completed_tasks = Task.objects.filter(
                #     ProjectID=project, 
                #     Status='completed'
                # ).count()
                
                
                completion_percentage = (
                    (completed_tasks / total_tasks) * 100 
                    if total_tasks > 0 else 0
                )
                

                projects_data.append({
                    'ProjectID': project.ProjectID,
                    'ProjectName': project.Name,
                    'Description': project.Description,
                    'CreatedDate': project.CreatedDateUTC,
                    'CompletedDate': project.CompletedDateUTC,
                    'ExpectedHours': project.ExpectedHours,
                    'OverallProgress': project.OverallProgress,
                    'Status': project.ProjectState,
                    'CompletionPercentage': round(completion_percentage, 2),
                    'TotalTasks': total_tasks,
                    'CompletedTasks': completed_tasks,
                    'CreatedBy': project.CreatedBy.EmployeeName if project.CreatedBy else None,
                    'ModifiedBy': project.ModifiedBy.EmployeeName if project.ModifiedBy else None,
                    'ModifiedDate': project.ModifiedDateUTC,
                    'AssignedUsers': list(assigned_users),
                    'TotalTaskHours': float(total_task_hours),
                })

            # Get status counts for all projects
            all_projects = queryset.all()
            status_counts = {
                'queue': sum(1 for p in all_projects if p.ProjectState == 'queue'),
                'in_progress': sum(1 for p in all_projects if p.ProjectState == 'in_progress'),
                'completed': sum(1 for p in all_projects if p.ProjectState == 'completed')
            }
            
            return Response({
                'count': paginator.count,
                'num_pages': paginator.num_pages,
                'current_page': page,
                'results': projects_data,
                'status_counts': status_counts,
                'total_counts': total_counts
            })

        except Exception as e:
            print(f"Project Dashboard Error: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class EmployeeView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        # Get query parameters
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        search = request.GET.get('search', '').lower()

        # Check if data is in cache, else fetch from database and store it in cache for future use
        queryset = cache.get('employee_queryset')
        if not queryset:
            queryset = User.objects.prefetch_related('PositionID', 'RoleID').all()

            # Apply search if provided
            if search:
                queryset = queryset.filter(
                    Q(UserName__icontains=search) |
                    Q(EmployeeName__icontains=search) |
                    Q(Email__icontains=search)
                )

            cache.set('employee_queryset', queryset, 300) # Cache for 5 minutes

        paginator = Paginator(queryset, page_size)
        current_page = paginator.get_page(page)

        employees_data = []
        today = timezone.now().date()
        for employee in current_page:
            # Check attendance status and determine status
            on_break = False
            on_leave = False
            if hasattr(employee, 'attendance'):  # If related 'Attendance' exists
                attendance = employee.attendance
                if attendance and attendance.BreakHours:
                    breaks = json.loads(attendance.BreakHours)
                    last_break = breaks[-1] if breaks else None
                    if last_break and 'end' not in last_break:
                        on_break = True
                status = 'not_punched_in'
                if attendance:
                    if attendance.PunchOutTime is None:
                        status = 'on_break' if on_break else 'punched_in'
            # Check if on leave
            if hasattr(employee, 'leaverequest_set'):  # If related 'LeaveRequest' exists
                on_leave = employee.leaverequest_set.filter(
                    FromDate__lte=today,
                    ToDate__gte=today,
                    Status='Approved'
                ).exists()
            if on_leave:
                status = 'on_leave'

            employees_data.append({
                'UserID': employee.UserID,
                'UserName': employee.UserName,
                'Email': employee.Email,
                'EmployeeName': employee.EmployeeName,
                'Photo': request.build_absolute_uri(employee.Photo.url) if employee.Photo else None,
                'Position': {
                    'id': employee.PositionID.id,
                    'name': employee.PositionID.position_name
                } if hasattr(employee, 'PositionID') else None,
            })
        return Response({
            'results': employees_data,
            'num_pages': paginator.num_pages,
            'current_page': page,
            'count': paginator.count
        })
        
    def post(self, request):
        try:
            serializer = UserSerializer(data=request.data)
            if serializer.is_valid():
                # Handle photo upload
                photo = request.FILES.get('Photo')
                if photo:
                    # Create employee first to get the ID
                    employee = serializer.save()
                    
                    # Create user-specific directory
                    user_dir = os.path.join(settings.MEDIA_ROOT, 'employee_photos', f'user_{employee.UserID}')
                    os.makedirs(user_dir, exist_ok=True)
                    
                    # Save photo with unique filename
                    filename = f"{employee.UserID}_{photo.name}"
                    filepath = os.path.join(user_dir, filename)
                    
                    with open(filepath, 'wb+') as destination:
                        for chunk in photo.chunks():
                            destination.write(chunk)
                    
                    # Update employee with photo path
                    employee.Photo = f'employee_photos/user_{employee.UserID}/{filename}'
                    employee.save()
                    
                    return Response(UserSerializer(employee).data, status=status.HTTP_201_CREATED)
                else:
                    # Save without photo
                    employee = serializer.save()
                    return Response(UserSerializer(employee).data, status=status.HTTP_201_CREATED)
                    
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(f"Error creating employee: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class PositionView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        positions = Position.objects.all()
        serializer = PositionSerializer(positions, many=True)
        return Response(serializer.data)

class RoleView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        roles = Role.objects.all()
        serializer = RoleSerializer(roles, many=True)
        return Response(serializer.data)

class TaskCreateView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        try:
            data = request.data.copy()
            data['CreatedBy'] = request.user.UserID
            data['AssignedUserID'] = request.user.UserID  
            data['CreatedDateUTC'] = timezone.now()

            serializer = TaskSerializer(data=data)
            if serializer.is_valid():
                task = serializer.save()
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
    
    def put(self, request, pk=None, *args, **kwargs):
        try:
            data = request.data.copy()
            # Use pk from the URL if not provided in the payload
            task_id = data.get('TaskID', pk)
            if not task_id:
                return Response({'error': 'TaskID is required for update'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                task = Task.objects.get(TaskID=task_id)
            except Task.DoesNotExist:
                return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)
            serializer = TaskSerializer(task, data=data, partial=True)
            if serializer.is_valid():
                serializer.save(ModifiedBy=request.user)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetDevelopersView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        try:
            # Get users with Developer role (assuming RoleID 3 is Developer)
            developers = User.objects.values('UserID', 'EmployeeName')
            return Response(list(developers))
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class TaskApproveView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    #/api/tasks/2/approve/
    def post(self, request, taskId):
        try:
            # Get the task by ID
            print (taskId)
            task = Task.objects.get(TaskID=taskId)
            
            
            # Update the task with approval details
            task.IsTaskVerified = 1  # Mark as approved
            task.VerifiedByUserID = request.user  # Set the user who approved the task
            task.VerifiedDateUTC = timezone.now()  # Set the current time as verification date
            task.save()

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
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request, taskId):
        try:
            # Get the task by ID
            task = Task.objects.get(TaskID=taskId)
            
            # Update the task with rejection details
            task.IsTaskVerified = 0  # Mark as rejected
            task.VerifiedByUserID = request.user  # Set the user who rejected the task
            task.VerifiedDateUTC = timezone.now()  # Set the current time as verification date
            task.save()

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
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        serializer = LeaveRequestSerializer(data=request.data)
        if serializer.is_valid():
            # You might want to override some fields – for example, automatically set the requesting user.
            serializer.save(RequestedBy=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LeaveRequestListView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    # Existing GET method
    def get(self, request):
        try:
            user = request.user
            queryset = LeaveRequest.objects.all()

            # Check if user has permission to view all requests
            if user.RoleID.RoleName in ['Super Admin', 'Admin', 'HR']:
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
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # New approve endpoint: POST /leave-requests/approve/<id>/
    def post(self, request, pk=None, action=None):
        try:
            leave_request = LeaveRequest.objects.get(pk=pk)
            
            if action == 'approve':
                leave_request.Status = 'Approved'
                leave_request.ApprovedBy = request.user
                leave_request.ApprovedAt = timezone.now()
                leave_request.save()
                return Response({'message': 'Leave request approved'}, status=status.HTTP_200_OK)
                
            elif action == 'reject':
                leave_request.Status = 'Rejected'
                leave_request.ApprovedBy = request.user
                leave_request.ApprovedAt = timezone.now()
                leave_request.save()
                return Response({'message': 'Leave request rejected'}, status=status.HTTP_200_OK)
                
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
            
        except LeaveRequest.DoesNotExist:
            return Response({'error': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)