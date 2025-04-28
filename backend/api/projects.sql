CREATE TABLE Tasks (
    TaskID INT PRIMARY KEY AUTO_INCREMENT, -- Unique identifier for each task
    TaskName VARCHAR(255) NOT NULL, -- Name of the task
    Description TEXT, -- Detailed description of the task
    ProjectID INT NOT NULL, -- Foreign key referencing the project this task belongs to
    AssignedUserID INT NOT NULL, -- Foreign key referencing the user assigned to the task
    Status ENUM('queue', 'in_progress', 'completed') NOT NULL DEFAULT 'queue', -- Current status of the task
    ExpectedHours DECIMAL(6,2) DEFAULT 0, -- Estimated hours required to complete the task
    Priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium', -- Priority level of the task
    Deadline DATETIME, -- Deadline for the task
    CreatedDateUTC DATETIME DEFAULT CURRENT_TIMESTAMP, -- Timestamp when the task was created
    ModifiedDateUTC DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Timestamp when the task was last modified
    AssignedByUserID INT NOT NULL, -- Foreign key referencing the user who assigned the task
    CompletedDateUTC DATETIME, -- Timestamp when the task was completed
    CompletedByUserID INT, -- Foreign key referencing the user who completed the task
    VerifiedDateUTC DATETIME, -- Timestamp when the task was verified
    VerifiedByUserID INT, -- Foreign key referencing the user who verified the task 
    FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID), -- Foreign key constraint for ProjectID
    FOREIGN KEY (AssignedUserID) REFERENCES Users(UserID) -- Foreign key constraint for AssignedUserID
    IsTaskVerified BOOLEAN DEFAULT FALSE
    FOREIGN KEY (AssignedByUserID) references Users(UserID),
    FOREIGN KEY (CompletedByUserID) references Users(UserID),
    FOREIGN KEY (VerifiedByUserID) references Users(UserID)
);


CREATE TABLE Projects (
    ProjectID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255) NOT NULL,
    Description TEXT,
    CreatedDateUTC DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INT NOT NULL,
    ModifiedDateUTC DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ModifiedBy INT,
    CompletedDateUTC DATETIME,
    OverallProgress DECIMAL(5,2) DEFAULT 0,
    ExpectedHours INT DEFAULT 0,
    ProjectState ENUM('queue', 'in_progress', 'on_hold', 'completed', 'cancelled') NOT NULL DEFAULT 'queue',
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    FOREIGN KEY (ModifiedBy) REFERENCES Users(UserID)
);
