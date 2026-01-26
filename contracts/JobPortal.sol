// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title JobPortal
/// @notice University-demo smart contract for a decentralized job portal.
/// @dev Stores roles, jobs, applications, and application status on-chain.
contract JobPortal {
  enum Role {
    None,
    JobSeeker,
    Employer,
    Validator
  }

  enum ApplicationStatus {
    None,
    Applied,
    Shortlisted,
    Accepted,
    Rejected
  }

  struct Job {
    address employer;
    string title;
    string company;
    string location;
    string jobType;
    string descriptionCID;
    uint64 createdAt;
    bool isOpen;
  }

  struct Application {
    string resumeCID;
    uint64 appliedAt;
    ApplicationStatus status;
  }

  mapping(address => Role) private _roles;

  Job[] private _jobs;

  // jobId => applicant => application
  mapping(uint256 => mapping(address => Application)) private _applications;

  // jobId => list of applicant addresses (for employer UI)
  mapping(uint256 => address[]) private _applicantsByJob;

  // applicant => list of jobIds they applied to (for job seeker UI)
  mapping(address => uint256[]) private _appliedJobIdsByApplicant;

  event RoleRegistered(address indexed user, Role role);
  event JobCreated(uint256 indexed jobId, address indexed employer);
  event JobClosed(uint256 indexed jobId, address indexed employer);
  event Applied(uint256 indexed jobId, address indexed applicant, string resumeCID);
  event ApplicationStatusChanged(
    uint256 indexed jobId,
    address indexed applicant,
    ApplicationStatus status
  );

  error JobNotFound();
  error NotAuthorized();
  error InvalidRole();
  error InvalidStatus();
  error JobClosedAlready();
  error JobIsClosed();
  error EmptyResumeCID();
  error AlreadyApplied();
  error NoApplication();

  modifier onlyRole(Role requiredRole) {
    if (_roles[msg.sender] != requiredRole) revert NotAuthorized();
    _;
  }

  modifier jobExists(uint256 jobId) {
    if (jobId >= _jobs.length) revert JobNotFound();
    _;
  }

  /// @notice Register or update your role for the dApp.
  /// @dev For demo simplicity, a wallet can change roles by calling register again.
  function register(Role role) external {
    if (role == Role.None) revert InvalidRole();
    _roles[msg.sender] = role;
    emit RoleRegistered(msg.sender, role);
  }

  function getRole(address user) external view returns (Role) {
    return _roles[user];
  }

  function createJob(
    string calldata title,
    string calldata company,
    string calldata location,
    string calldata jobType,
    string calldata descriptionCID
  ) external onlyRole(Role.Employer) returns (uint256 jobId) {
    Job memory job = Job({
      employer: msg.sender,
      title: title,
      company: company,
      location: location,
      jobType: jobType,
      descriptionCID: descriptionCID,
      createdAt: uint64(block.timestamp),
      isOpen: true
    });

    _jobs.push(job);
    jobId = _jobs.length - 1;

    emit JobCreated(jobId, msg.sender);
  }

  function closeJob(uint256 jobId) external onlyRole(Role.Employer) jobExists(jobId) {
    Job storage job = _jobs[jobId];

    if (job.employer != msg.sender) revert NotAuthorized();
    if (!job.isOpen) revert JobClosedAlready();

    job.isOpen = false;
    emit JobClosed(jobId, msg.sender);
  }

  function getJobsCount() external view returns (uint256) {
    return _jobs.length;
  }

  function getJob(uint256 jobId) external view jobExists(jobId) returns (Job memory) {
    return _jobs[jobId];
  }

  function applyToJob(uint256 jobId, string calldata resumeCID)
    external
    onlyRole(Role.JobSeeker)
    jobExists(jobId)
  {
    Job storage job = _jobs[jobId];
    if (!job.isOpen) revert JobIsClosed();
    if (bytes(resumeCID).length == 0) revert EmptyResumeCID();

    Application storage existing = _applications[jobId][msg.sender];
    if (existing.status != ApplicationStatus.None) revert AlreadyApplied();

    _applications[jobId][msg.sender] = Application({
      resumeCID: resumeCID,
      appliedAt: uint64(block.timestamp),
      status: ApplicationStatus.Applied
    });

    _applicantsByJob[jobId].push(msg.sender);
    _appliedJobIdsByApplicant[msg.sender].push(jobId);

    emit Applied(jobId, msg.sender, resumeCID);
  }

  function setApplicationStatus(
    uint256 jobId,
    address applicant,
    ApplicationStatus status
  ) external onlyRole(Role.Employer) jobExists(jobId) {
    if (status == ApplicationStatus.None) revert InvalidStatus();

    Job storage job = _jobs[jobId];
    if (job.employer != msg.sender) revert NotAuthorized();

    Application storage app = _applications[jobId][applicant];
    if (app.status == ApplicationStatus.None) revert NoApplication();

    app.status = status;

    emit ApplicationStatusChanged(jobId, applicant, status);
  }

  function getJobApplicants(uint256 jobId)
    external
    view
    jobExists(jobId)
    returns (address[] memory)
  {
    return _applicantsByJob[jobId];
  }

  function getApplication(uint256 jobId, address applicant)
    external
    view
    jobExists(jobId)
    returns (Application memory)
  {
    return _applications[jobId][applicant];
  }

  function getMyAppliedJobs(address applicant) external view returns (uint256[] memory) {
    return _appliedJobIdsByApplicant[applicant];
  }
}
