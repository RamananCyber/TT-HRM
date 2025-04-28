from rest_framework import serializers
from .models import *
import re

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['UserID', 'EmployeeID', 'UserName', 'Email', 'EmployeeName', 'Photo', 'PositionID', 'RoleID', 'bank_details']
        extra_kwargs = {'Password': {'write_only': True}}

    def validate_bank_details(self, value):
        """
        Validate the bank details format.
        """
        if not value:
            return value  # Allow empty bank details

        if not isinstance(value, dict):
            raise serializers.ValidationError("Invalid bank details format. Expected a dictionary.")

        bank_name = value.get('bank_name')
        account_number = value.get('account_number')
        ifsc_code = value.get('ifsc_code')

        if not bank_name or not account_number or not ifsc_code:
            raise serializers.ValidationError("All bank details fields (bank_name, account_number, ifsc_code) are required.")

        if not isinstance(bank_name, str) or not bank_name.strip():
            raise serializers.ValidationError("bank_name must be a non-empty string.")

        if not isinstance(account_number, str) or not re.fullmatch(r"^\d{9,18}$", account_number):
            raise serializers.ValidationError("account_number must be a string of 9-18 digits.")

        if not isinstance(ifsc_code, str) or not re.fullmatch(r"^[A-Z]{4}0[A-Z0-9]{6}$", ifsc_code):
            raise serializers.ValidationError("ifsc_code must be a string in the format AAAA0XXXXXX.")

        return value
    
class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = ['id', 'position_name']

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'RoleName']

class ProjectSerializer(serializers.ModelSerializer):
    AssignedUsers = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        required=False
    )
    class Meta:
        model = Project
        fields = [
            'ProjectID', 'Name', 'Description', 'CreatedDateUTC', 
            'CreatedBy', 'ModifiedDateUTC', 'ModifiedBy', 'CompletedDateUTC',
            'OverallProgress', 'ExpectedHours', 'ProjectState', 'AssignedUsers',
             'TotalTasks', 'CompletedTasks' 
        ]

class ProjectStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectState
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='ProjectID.Name', read_only=True)
    assigned_user_name = serializers.CharField(source='AssignedUserID.EmployeeName', read_only=True)
    AssignedByUserID = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )
    CompletedByUserID = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )
    
    AssignedUserID = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )
    
    Deadline = serializers.DateTimeField(
        allow_null=True, 
        required=False,
        format=None,  # This allows more flexible input formats
        input_formats=['iso-8601', '%Y-%m-%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%S.%f%z']
    )
    class Meta:
        model = Task
        fields = [
            'TaskID', 'TaskName', 'Description', 'ProjectID', 'project_name',
            'AssignedUserID', 'assigned_user_name', 'Status', 'ExpectedHours',
            'Priority', 'Deadline', 'CreatedDateUTC', 'ModifiedDateUTC', 'CompletedDateUTC','CompletedByUserID',
            'IsTaskVerified', 'VerifiedByUserID', 'VerifiedDateUTC', 'AssignedByUserID'
        ]
    
        def validate_Deadline(self, value):
            """
            Custom validation for Deadline field to handle empty strings
            """
            if value in ['', 'null', 'undefined'] or value is None:
                return None
            return value

class ProjectStateHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectStateHistory
        fields = '__all__'

class TaskAssignmentHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskAssignmentHistory
        fields = '__all__'

# class TaskWorkLogSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = TaskWorkLog
#         fields = '__all__'

class LeaveRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source='RequestedBy.EmployeeName', read_only=True)
    approved_by_name = serializers.CharField(source='ApprovedBy.EmployeeName', read_only=True)
    RequestedBy = serializers.PrimaryKeyRelatedField(read_only=True)
    Days = serializers.FloatField()
    class Meta:
        model = LeaveRequest
        fields = [
            'LeaveRequestID',
            'FromDate',
            'ToDate',
            'Days',
            'Reason',
            'RequestedBy',
            'requested_by_name',
            'CreatedAt',
            'Status',
            'ApprovedBy',
            'approved_by_name',
            'ApprovedAt',
            'UpdatedAt',
            'Comments',
            'IsHalfDay', 
            'HalfDayType'
        ]
        
    def validate_Days(self, value):
        # Convert to integer if needed for the database
        if self.context.get('convert_days_to_int', False):
            return int(value)
        return value
    
class WorkFromHomeRequestSerializer(serializers.ModelSerializer):
    RequestedBy = UserSerializer(read_only=True)
    ApprovedBy = UserSerializer(read_only=True)

    class Meta:
        model = WorkFromHomeRequest
        fields = [
            'WorkFromHomeRequestID', 'RequestedBy', 'FromDate', 'ToDate', 'Days', 
            'Reason', 'Status', 'ApprovedBy', 'ApprovedAt', 
            'Comments', 'IsHalfDay', 'HalfDayType', 'CreatedAt'  # Added IsHalfDay and HalfDayType
        ]
        read_only_fields = ['id', 'RequestedBy', 'ApprovedBy', 'ApprovedAt']

    def create(self, validated_data):
        # Ensure IsHalfDay is properly set (default to False if not provided)
        validated_data['IsHalfDay'] = validated_data.get('IsHalfDay', False)
        
        # Only set HalfDayType if IsHalfDay is True
        if validated_data.get('IsHalfDay'):
            validated_data['HalfDayType'] = validated_data.get('HalfDayType', 'First Half')
        else:
            validated_data['HalfDayType'] = None

        return super().create(validated_data)

    def validate(self, data):
        # Add validation for half-day requests
        if data.get('IsHalfDay'):
            if data.get('FromDate') != data.get('ToDate'):
                raise serializers.ValidationError(
                    "For half-day requests, FromDate and ToDate must be the same"
                )
            if not data.get('HalfDayType'):
                raise serializers.ValidationError(
                    "HalfDayType is required for half-day requests"
                )
            if data.get('HalfDayType') not in ['first_half', 'second_half']:
                raise serializers.ValidationError(
                    "HalfDayType must be either 'First Half' or 'Second Half'"
                )
        return data

