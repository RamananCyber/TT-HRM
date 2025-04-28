-- Table structure for table `positions`
CREATE TABLE `positions` (
  `id` int(11) NOT NULL,
  `position_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `roles`
CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `RoleName` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `users`
CREATE TABLE `users` (
  `UserID` int(11) NOT NULL,
  `UserName` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `EmployeeName` varchar(255) NOT NULL,
  `Photo` varchar(255) DEFAULT NULL,
  `PositionID` int(11) DEFAULT NULL,
  `RoleID` int(11) DEFAULT NULL,
  `EmployeeID` varchar(255) DEFAULT NULL,
  `bank_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`bank_details`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `projects`
CREATE TABLE `projects` (
  `ProjectID` int(11) NOT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `CreatedDateUTC` datetime DEFAULT current_timestamp(),
  `CreatedBy` int(11) NOT NULL,
  `ModifiedDateUTC` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ModifiedBy` int(11) DEFAULT NULL,
  `CompletedDateUTC` datetime DEFAULT NULL,
  `OverallProgress` decimal(5,2) DEFAULT 0.00,
  `Description` text DEFAULT NULL,
  `ExpectedHours` int(11) DEFAULT NULL,
  `ProjectState` enum('queue','in_progress','on_hold','completed','cancelled') NOT NULL DEFAULT 'queue',
  `TotalTasks` int(11) NOT NULL DEFAULT 0,
  `CompletedTasks` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `tasks`
CREATE TABLE `tasks` (
  `TaskID` int(11) NOT NULL,
  `TaskName` varchar(255) NOT NULL,
  `Description` text DEFAULT NULL,
  `ProjectID` int(11) NOT NULL,
  `AssignedUserID` int(11) DEFAULT NULL,
  `Status` enum('queue','in_progress','pending_approval','completed') DEFAULT NULL,
  `ExpectedHours` decimal(6,2) DEFAULT 0.00,
  `Priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `Deadline` datetime DEFAULT NULL,
  `CreatedDateUTC` datetime DEFAULT current_timestamp(),
  `ModifiedDateUTC` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `IsTaskVerified` tinyint(1) DEFAULT 0,
  `VerifiedByUserID` int(11) DEFAULT NULL,
  `AssignedByUserID` int(11) DEFAULT NULL,
  `CompletedDateUTC` datetime DEFAULT NULL,
  `CompletedByUserID` int(11) DEFAULT NULL,
  `VerifiedDateUTC` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `projectassignedusers`
CREATE TABLE `projectassignedusers` (
  `ProjectID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `attendance`
CREATE TABLE `attendance` (
  `BreakHours` text DEFAULT NULL,
  `AttendanceID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `CreatedDateUTC` datetime NOT NULL,
  `PunchInTime` datetime DEFAULT NULL,
  `PunchOutTime` datetime DEFAULT NULL,
  `TotalActiveHours` decimal(5,2) DEFAULT 0.00,
  `TotalInactiveHours` decimal(5,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `tasklogs`
CREATE TABLE `tasklogs` (
  `LogID` int(11) NOT NULL,
  `TaskID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `HoursWorked` decimal(5,2) NOT NULL CHECK (`HoursWorked` >= 0),
  `RequestedHours` decimal(5,2) NOT NULL DEFAULT 0.00 CHECK (`RequestedHours` >= 0),
  `LogDate` date NOT NULL DEFAULT curdate(),
  `Status` enum('queue','in_progress','completed') NOT NULL,
  `Blockers` text DEFAULT NULL,
  `Notes` text DEFAULT NULL,
  `CreatedDateUTC` datetime DEFAULT current_timestamp(),
  `ModifiedDateUTC` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `AttendanceID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `customers`
CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `customer_id` varchar(50) NOT NULL,
  `company_name` varchar(200) NOT NULL,
  `customer_name` varchar(200) NOT NULL,
  `created_date` date NOT NULL,
  `industry_segment` varchar(100) DEFAULT NULL,
  `manufacturers_of` varchar(200) DEFAULT NULL,
  `reference` varchar(200) DEFAULT NULL,
  `repeated_client` varchar(3) DEFAULT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `gst_no` varchar(15) DEFAULT NULL,
  `phone_no` varchar(15) DEFAULT NULL,
  `mail_id` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `django_migrations`
CREATE TABLE `django_migrations` (
  `id` bigint(20) NOT NULL,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `django_session`
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `leaverequest`
CREATE TABLE `leaverequest` (
  `LeaveRequestID` int(11) NOT NULL,
  `FromDate` date NOT NULL,
  `ToDate` date NOT NULL,
  `Days` int(11) NOT NULL CHECK (`Days` >= 0),
  `Reason` text DEFAULT NULL,
  `RequestedBy` int(11) NOT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  `Status` enum('Pending','Approved','Rejected','Cancelled') DEFAULT 'Pending',
  `ApprovedBy` int(11) DEFAULT NULL,
  `ApprovedAt` datetime DEFAULT NULL,
  `UpdatedAt` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `Comments` text DEFAULT NULL,
  `IsHalfDay` tinyint(1) NOT NULL DEFAULT 0,
  `HalfDayType` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `notifications`
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` longtext NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `workfromhomerequest`
CREATE TABLE `workfromhomerequest` (
  `WorkFromHomeRequestID` int(11) NOT NULL,
  `FromDate` date NOT NULL,
  `ToDate` date NOT NULL,
  `Days` int(11) NOT NULL CHECK (`Days` >= 0),
  `Reason` text DEFAULT NULL,
  `RequestedBy` int(11) NOT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  `Status` enum('Pending','Approved','Rejected','Cancelled') DEFAULT 'Pending',
  `ApprovedBy` int(11) DEFAULT NULL,
  `ApprovedAt` datetime DEFAULT NULL,
  `UpdatedAt` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `Comments` text DEFAULT NULL,
  `IsHalfDay` tinyint(1) NOT NULL DEFAULT 0,
  `HalfDayType` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;