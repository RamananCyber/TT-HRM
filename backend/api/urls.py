from django.urls import path, include
from .views import (TaskListView, UserLoginView, 
                   UserRegisterView, UserProfileView, get_user_role, TaskDashboardView, PunchInView, PunchOutView,
                   project_hours, PunchInStatusView, TaskPunchOutView, BreakStartView, BreakEndView, ProjectDashboardView, EmployeeView
                   , PositionView, RoleView, ProjectViewSet, TaskCreateView, GetDevelopersView, TaskApproveView, TaskRejectView,
                   LeaveRequestCreateView, LeaveRequestListView, DashboardStatsView, DailyReportsView, WorkFromHomeRequestView, WorkFromHomeRequestActionView, employees_for_reports, projects_for_reports, UserStatusCountView)
from rest_framework_simplejwt import views as jwt_views
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet
from . import views
from django.conf.urls.static import static
from django.conf import settings

router = DefaultRouter()
# router.register(r'customers', CustomerViewSet)
router.register(r'projects', ProjectViewSet, basename='project')


urlpatterns = [
    # Auth endpoints
    path('auth/login/', UserLoginView.as_view(), name='login'),
    path('auth/register/', UserRegisterView.as_view(), name='register'),
    path('auth/token/', jwt_views.TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', jwt_views.TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/user-role/', get_user_role, name='user-role'),
    
    # Task endpoints
    #path('tasks/', TaskListView.as_view(), name='task-list'),
    
    # path('tasks/user/<int:user_id>/', UserProjectListView.as_view(), name='user-projects'),
    path('tasks/dashboard/', TaskDashboardView.as_view(), name='project-task-dashboard'),
    
    # User endpoints
    path('user/profile/<int:user_id>/', UserProfileView.as_view(), name='user-profile'),
    # path('user/photo/<int:user_id>/', UserPhotoView.as_view(), name='user-photo'),

    # path('customers/<int:pk>/', views.CustomerDetailView.as_view()),

    path('projects/<int:pk>', ProjectViewSet.as_view({'get': 'perform_update'})),
    # path('project-tasks/<int:pk>/update-status/', ProjectViewSet.as_view({'patch': 'update_status'})),

    path('punch-in/', PunchInView.as_view(), name='punch-in'),
    path('punch-out/', PunchOutView.as_view(), name='punch-out'),
    path('projects/hours/', project_hours, name='project-hours'),
    path('punch-in/status/', PunchInStatusView.as_view(), name='punch-in-status'),
    path('task-punch-out/', TaskPunchOutView.as_view(), name='task-punch-out'),

    path('break-start/', BreakStartView.as_view(), name='break-start'),
    path('break-end/', BreakEndView.as_view(), name='break-end'),
    path('projects/dashboard/', ProjectDashboardView.as_view(), name='project-dashboard'),

    path('employees/', EmployeeView.as_view(), name='employees'),
    path('employees/<int:pk>/', EmployeeView.as_view(), name='employee-detail'),
    path('positions/', PositionView.as_view(), name='positions'),
    path('roles/', RoleView.as_view(), name='roles'),
    # path('projects/', ProjectViewSet.as_view({'get': 'perform_create'}), name='projects'),
    
    path('tasks/', TaskCreateView.as_view(), name='task-create'),
    path('tasks/<int:pk>/', TaskCreateView.as_view(), name='task-update'),
    path('developers/', GetDevelopersView.as_view(), name='get-developers'),
    path('tasks/<int:taskId>/approve/', TaskApproveView.as_view()    , name='task-approve'),
    path('tasks/<int:taskId>/reject/', TaskRejectView.as_view()    , name='task-reject'),
    path('leave-requests/', LeaveRequestCreateView.as_view(), name='leave-request'),
    path('leave-list/', views.LeaveRequestListView.as_view(), name='leave-list'),
    #path('leave-requests/', LeaveRequestListView.as_view(), name='leave-requests-list'),
    
    # Approve leave request
    path('leave-requests/<int:pk>/approve/', LeaveRequestListView.as_view(), 
         {'action': 'approve'}, name='approve-leave'),
    
    # Reject leave request 
    path('leave-requests/<int:pk>/reject/', LeaveRequestListView.as_view(),
         {'action': 'reject'}, name='reject-leave'),
    
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('admin/export/<resportType>/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('daily-reports/', DailyReportsView.as_view(), name='daily-reports'),
    # Add these to your urlpatterns
    path('work-from-home-requests/', WorkFromHomeRequestView.as_view(), name='work-from-home-requests'),
    path('work-from-home-requests/<int:pk>/<str:action>/', WorkFromHomeRequestActionView.as_view(), name='work-from-home-request-action'),
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/mark_read/', views.MarkNotificationReadView.as_view(), name='mark-notification-read'),
    path('notifications/mark_all_read/', views.MarkAllNotificationsReadView.as_view(), name='mark-all-notifications-read'),
    path('', include(router.urls)),
    path('employees/for_reports/', employees_for_reports, name='employees-for-reports'),
    path('projects/for_reports/', projects_for_reports, name='projects-for-reports'),
    path('user-status-counts/', UserStatusCountView.as_view(), name='user-status-counts'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
