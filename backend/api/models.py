from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import User
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models
from django.db.models import Q
from django_cryptography.fields import encrypt

class Position(models.Model):
    id = models.AutoField(primary_key=True)
    position_name = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'Positions'


class Role(models.Model):
    id = models.AutoField(primary_key=True)
    RoleName = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'Roles'

def employee_photo_path(instance, filename):
    # File will be uploaded to MEDIA_ROOT/employee_photos/user_<id>/<filename>
    return f'employee_photos/user_{instance.UserID}/{filename}'


class User(models.Model):
    UserID = models.AutoField(primary_key=True, db_column='UserID')
    EmployeeID = models.CharField(max_length=10, unique=True, null=True, blank=True, db_column='EmployeeID')
    UserName = models.CharField(max_length=255, unique=True, db_column='UserName')
    Email = models.EmailField(unique=True, db_column='Email')
    Password = models.CharField(max_length=255, db_column='Password')
    EmployeeName = models.CharField(max_length=255, db_column='EmployeeName')
    Photo = models.ImageField(
        upload_to=employee_photo_path,
        null=True, 
        blank=True
    )
    PositionID = models.ForeignKey(Position, on_delete=models.SET_NULL, null=True, db_column='PositionID')
    RoleID = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, db_column='RoleID')
    bank_details = models.JSONField(
        null=True,
        blank=True,
    )

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def save(self, *args, **kwargs):
        # Remove password hashing
        if not self.EmployeeID:
            # Save once to ensure self.UserID is populated
            super().save(*args, **kwargs)
            # Format the employee ID (e.g., using three digits with prefix "TAI")
            self.EmployeeID = f"TAI{self.UserID:03d}"
            # Save again to update the EmployeeID field
            super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)

    def check_password(self, raw_password):
        """
        Direct password comparison without hashing
        """
        return self.password == raw_password
    
    class Meta:
        db_table = 'Users'

class Project(models.Model):
    ProjectID = models.AutoField(primary_key=True, db_column='ProjectID')
    Name = models.CharField(max_length=255, db_column='Name')
    Description = models.TextField(null=True, blank=True, db_column='Description')
    TotalTasks = models.IntegerField(default=0, db_column='TotalTasks')
    CompletedTasks = models.IntegerField(default=0, db_column='CompletedTasks')
    CreatedDateUTC = models.DateTimeField(auto_now_add=True, db_column='CreatedDateUTC')
    CreatedBy = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        db_column='CreatedBy',
        related_name='projects_created'
    )
    ModifiedDateUTC = models.DateTimeField(auto_now=True, db_column='ModifiedDateUTC')
    ModifiedBy = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        db_column='ModifiedBy',
        related_name='projects_modified'
    )
    CompletedDateUTC = models.DateTimeField(null=True, db_column='CompletedDateUTC')
    OverallProgress = models.DecimalField(max_digits=5, decimal_places=2, default=0, db_column='OverallProgress')
    ExpectedHours = models.IntegerField(default=0, db_column='ExpectedHours')
    ProjectState = models.CharField(
        max_length=20,
        choices=[
            ('queue', 'Queue'),
            ('in_progress', 'In Progress'),
            ('on_hold', 'On Hold'),
            ('completed', 'Completed'),
            ('cancelled', 'Cancelled')
        ],
        default='queue',
        db_column='ProjectState'
    )
    
    AssignedUsers = models.ManyToManyField(
        User,
        through='ProjectAssignment',  # Use a custom through model
        related_name='assigned_projects',
        blank=True
    )

    class Meta:
        db_table = 'Projects'

class ProjectAssignment(models.Model):
    project = models.ForeignKey(
        Project, 
        on_delete=models.CASCADE,
        db_column='ProjectID'  # Map to your existing column
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        db_column='UserID'  # Map to your existing column
    )


    class Meta:
        db_table = 'ProjectAssignedUsers'  # Your existing table name
        
class ProjectState(models.Model):
    ProjectStateID = models.AutoField(primary_key=True, db_column='ProjectStateID')
    ProjectStateName = models.CharField(max_length=255, db_column='ProjectStateName')
    Value = models.IntegerField(db_column='Value')

    class Meta:
        db_table = 'ProjectStates'

class Task(models.Model):
    TaskID = models.AutoField(primary_key=True, db_column='TaskID')
    TaskName = models.CharField(max_length=255, db_column='TaskName')
    Description = models.TextField(null=True, blank=True, db_column='Description')
    ProjectID = models.ForeignKey(Project, on_delete=models.CASCADE, db_column='ProjectID', related_name='tasks')
    AssignedUserID = models.ForeignKey(User, on_delete=models.CASCADE, db_column='AssignedUserID', related_name='assigned_tasks', null=True, blank=True)
    Status = models.CharField(
        max_length=20,
        choices=[
            ('queue', 'Queue'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed')
        ],
        default='queue',
        db_column='Status'
    )
    ExpectedHours = models.DecimalField(max_digits=6, decimal_places=2, default=0, db_column='ExpectedHours')
    Priority = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('urgent', 'Urgent')
        ],
        default='medium',
        db_column='Priority'
    )
    Deadline = models.DateTimeField(null=True, blank=True, db_column='Deadline')
    CreatedDateUTC = models.DateTimeField(auto_now_add=True, db_column='CreatedDateUTC')
    ModifiedDateUTC = models.DateTimeField(auto_now=True, db_column='ModifiedDateUTC')
    IsTaskVerified = models.BooleanField(default=False, db_column='IsTaskVerified')
    VerifiedByUserID = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='verified_by',
        db_column='VerifiedByUserID'  # Add this line
    )
    VerifiedDateUTC = models.DateTimeField(null=True, blank=True, db_column='VerifiedDateUTC')
    CompletedDateUTC = models.DateTimeField(null=True, blank=True, db_column='CompletedDateUTC')
    AssignedByUserID = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_by', db_column='AssignedByUserId')
    CompletedByUserID = models.ForeignKey(User, on_delete=models.CASCADE, related_name='completed_by', db_column='CompletedByUserId')
    class Meta:
        db_table = 'Tasks'
        
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        project = self.ProjectID
        if project:
            project.TotalTasks = Task.objects.filter(ProjectID=project).count()
            if self.Status == 'completed':
                project.CompletedTasks = Task.objects.filter(ProjectID=project, Status='completed').count()
            project.save()

    def delete(self, *args, **kwargs):
        project = self.ProjectID
        super().delete(*args, **kwargs)
        if project:
            project.TotalTasks = Task.objects.filter(ProjectID=project).count()
            project.CompletedTasks = Task.objects.filter(ProjectID=project, Status='completed').count()
            project.save()
        
class ProjectStateHistory(models.Model):
    HistoryID = models.AutoField(primary_key=True, db_column='HistoryID')
    ProjectID = models.ForeignKey(Project, on_delete=models.CASCADE, db_column='ProjectID')
    ProjectStateID = models.ForeignKey(ProjectState, on_delete=models.CASCADE, db_column='ProjectStateID')
    ChangedDateUTC = models.DateTimeField(auto_now_add=True, db_column='ChangedDateUTC')
    ChangedBy = models.ForeignKey(User, on_delete=models.CASCADE, db_column='ChangedBy')
    Comments = models.TextField(db_column='Comments')

    class Meta:
        db_table = 'ProjectStateHistory'

class TaskAssignmentHistory(models.Model):
    HistoryID = models.AutoField(primary_key=True, db_column='HistoryID')
    TaskID = models.ForeignKey(Task, on_delete=models.CASCADE, db_column='TaskID')
    AssignedFrom = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_from', db_column='AssignedFrom')
    AssignedTo = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_to_history', db_column='AssignedTo')
    AssignedBy = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_by_history', db_column='AssignedBy')
    AssignedDateUTC = models.DateTimeField(auto_now_add=True, db_column='AssignedDateUTC')
    Comments = models.TextField(db_column='Comments')

    class Meta:
        db_table = 'TaskAssignmentHistory'


class Attendance(models.Model):
    AttendanceID = models.AutoField(primary_key=True, db_column='AttendanceID')
    UserID = models.ForeignKey(User, on_delete=models.CASCADE, db_column='UserID')
    CreatedDateUTC = models.DateTimeField(auto_now_add=True, db_column='CreatedDateUTC')
    PunchInTime = models.DateTimeField(db_column='PunchInTime')
    PunchOutTime = models.DateTimeField(null=True, blank=True, db_column='PunchOutTime')
    BreakHours = models.CharField(max_length=100, null=True, blank=True, db_column='BreakHours')
    TotalActiveHours = models.FloatField(default=0)
    TotalInactiveHours = models.FloatField(default=0)
    class Meta:
        db_table = 'Attendance'

class TaskLogs(models.Model):
    LogID = models.AutoField(primary_key=True, db_column='LogID')
    TaskID = models.ForeignKey(Task, on_delete=models.CASCADE, db_column='TaskID')
    UserID = models.ForeignKey(User, on_delete=models.CASCADE, db_column='UserID')
    HoursWorked = models.DecimalField(max_digits=5, decimal_places=2, db_column='HoursWorked')
    RequestedHours = models.DecimalField(max_digits=5, decimal_places=2, db_column='RequestedHours')
    LogDate = models.DateField(auto_now_add=True, db_column='LogDate')
    Status = models.CharField(
        max_length=20,
        choices=[
            ('queue', 'Queue'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed')
        ],
        default='in_progress',
        db_column='Status'
    )
    Blockers = models.TextField(null=True, blank=True, db_column='Blockers')
    Notes = models.TextField(null=True, blank=True, db_column='Notes')
    CreatedDateUTC = models.DateTimeField(auto_now_add=True, db_column='CreatedDateUTC')
    ModifiedDateUTC = models.DateTimeField(auto_now=True, db_column='ModifiedDateUTC')
    AttendanceID = models.ForeignKey(Attendance, on_delete=models.CASCADE, db_column='AttendanceID')
    

    class Meta:
        db_table = 'TaskLogs'
        
        
STATUS_CHOICES = (
    ('Pending', 'Pending'),
    ('Approved', 'Approved'),
    ('Rejected', 'Rejected'),
    ('Cancelled', 'Cancelled'),
)


class LeaveRequest(models.Model):
    LeaveRequestID = models.AutoField(primary_key=True)
    FromDate = models.DateField()
    ToDate = models.DateField()
    Days = models.DecimalField(max_digits=3, decimal_places=1)  
    Reason = models.TextField()
    RequestedBy = models.ForeignKey(User, on_delete=models.CASCADE,  related_name='requested_leave_requests', db_column='RequestedBy')
    CreatedAt = models.DateTimeField(auto_now_add=True)
    Status = models.CharField(max_length=10, choices=[
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Cancelled', 'Cancelled')
    ], default='Pending')
    ApprovedBy = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='approved_leave_requests',  db_column='ApprovedBy')
    ApprovedAt = models.DateTimeField(null=True, blank=True)
    UpdatedAt = models.DateTimeField(auto_now=True)
    Comments = models.TextField(null=True, blank=True)
    IsHalfDay = models.BooleanField(default=False)
    HalfDayType = models.CharField(max_length=20, null=True, blank=True)  # 'first_half' or 'second_half'
    class Meta:
        constraints = [
            models.CheckConstraint(check=Q(from_date__lte=models.F('to_date')), name='check_from_date_lte_to_date'),
        ]
        db_table = 'leaveRequest'

    def __str__(self):
        return f"LeaveRequest {self.LeaveRequestID} from {self.FromDate} to {self.ToDate} by {self.RequestedBy}"
    
    
class WorkFromHomeRequest(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Cancelled', 'Cancelled'),
    )
    
    WorkFromHomeRequestID = models.AutoField(primary_key=True)
    FromDate = models.DateField()
    ToDate = models.DateField()
    Days =  models.DecimalField(max_digits=3, decimal_places=1) 
    Reason = models.TextField(null=True, blank=True)
    RequestedBy = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='work_from_home_requests',
        db_column='RequestedBy'  # Specify the exact column name in the database
    )
    CreatedAt = models.DateTimeField(auto_now_add=True)
    Status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')
    ApprovedBy = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='approved_work_from_home_requests',
        db_column='ApprovedBy'  # Specify the exact column name in the database
    )
    ApprovedAt = models.DateTimeField(null=True, blank=True)
    UpdatedAt = models.DateTimeField(auto_now=True)
    Comments = models.TextField(null=True, blank=True)
    IsHalfDay = models.BooleanField(default=False)
    HalfDayType = models.CharField(max_length=20, null=True, blank=True) 
    class Meta:
        db_table = 'workfromhomerequest'
        constraints = [
            models.CheckConstraint(check=models.Q(FromDate__lte=models.F('ToDate')), name='chk_valid_dates'),
        ]
    
    def save(self, *args, **kwargs):
        # Calculate days if not provided
        if not self.Days and self.FromDate and self.ToDate:
            delta = self.ToDate - self.FromDate
            self.Days = delta.days + 1
        super().save(*args, **kwargs)


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    is_read = models.BooleanField(default=False)  # Match column rename
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
             