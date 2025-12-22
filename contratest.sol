
// contract AcademicManagementSystem {

//     /* =====================================================
//                         ROLES
//     ===================================================== */

//     enum Role {
//         NONE,
//         ADMIN,
//         PROFESSOR,
//         STUDENT
//     }

//     mapping(address => Role) private roles;

//     /* =====================================================
//                         STRUCTS
//     ===================================================== */

//     struct Module {
//         uint256 id;
//         string name;
//         address professor;
//         bool exists;
//     }

//     struct Assignment {
//         uint256 id;
//         uint256 moduleId;
//         string ipfsHash;
//         string professorPublicKey;
//         bool exists;
//     }

//     struct Submission {
//         address student;
//         string encryptedIpfsHash;
//         bool graded;
//     }

//     struct Grade {
//         uint8 value;
//         string note;
//     }

//     /* =====================================================
//                     STATE VARIABLES
//     ===================================================== */

//     uint256 public moduleCount;
//     uint256 public assignmentCount;

//     mapping(uint256 => Module) public modules;
//     mapping(uint256 => Assignment) public assignments;

//     // moduleId => student => enrolled
//     mapping(uint256 => mapping(address => bool)) public moduleStudents;

//     // assignmentId => student => submission
//     mapping(uint256 => mapping(address => Submission)) public submissions;

//     // assignmentId => student => grade
//     mapping(uint256 => mapping(address => Grade)) public grades;

//     /* =====================================================
//                         EVENTS
//     ===================================================== */

//     event ActionLog(
//         address indexed user,
//         string action,
//         uint256 timestamp
//     );

//     /* =====================================================
//                         MODIFIERS
//     ===================================================== */

//     modifier onlyAdmin() {
//         require(roles[msg.sender] == Role.ADMIN, "Access denied: Admin only");
//         _;
//     }

//     modifier onlyProfessor() {
//         require(roles[msg.sender] == Role.PROFESSOR, "Access denied: Professor only");
//         _;
//     }

//     modifier onlyStudent() {
//         require(roles[msg.sender] == Role.STUDENT, "Access denied: Student only");
//         _;
//     }

//     /* =====================================================
//                     CONSTRUCTOR
//     ===================================================== */

//     constructor() {
//         roles[msg.sender] = Role.ADMIN;
//         emit ActionLog(msg.sender, "Admin initialized", block.timestamp);
//     }

//     /* =====================================================
//                 ROLE MANAGEMENT (ADMIN)
//     ===================================================== */

//     function addProfessor(address _prof) external onlyAdmin {
//         roles[_prof] = Role.PROFESSOR;
//         emit ActionLog(msg.sender, "Professor added", block.timestamp);
//     }

//     function addStudent(address _student) external onlyAdmin {
//         roles[_student] = Role.STUDENT;
//         emit ActionLog(msg.sender, "Student added", block.timestamp);
//     }

//     function getRole(address user) external view returns (Role) {
//         return roles[user];
//     }

//     /* =====================================================
//                 MODULE MANAGEMENT (ADMIN)
//     ===================================================== */

//     function createModule(string calldata _name) external onlyAdmin {
//         moduleCount++;
//         modules[moduleCount] = Module(
//             moduleCount,
//             _name,
//             address(0),
//             true
//         );
//         emit ActionLog(msg.sender, "Module created", block.timestamp);
//     }

//     function assignProfessorToModule(
//         uint256 _moduleId,
//         address _prof
//     ) external onlyAdmin {
//         require(modules[_moduleId].exists, "Module does not exist");
//         require(roles[_prof] == Role.PROFESSOR, "Not a professor");

//         modules[_moduleId].professor = _prof;
//         emit ActionLog(msg.sender, "Professor assigned to module", block.timestamp);
//     }

//     function enrollStudentInModule(
//         uint256 _moduleId,
//         address _student
//     ) external onlyAdmin {
//         require(modules[_moduleId].exists, "Module does not exist");
//         require(roles[_student] == Role.STUDENT, "Not a student");

//         moduleStudents[_moduleId][_student] = true;
//         emit ActionLog(msg.sender, "Student enrolled in module", block.timestamp);
//     }

//     /* =====================================================
//                 ASSIGNMENTS (PROFESSOR)
//     ===================================================== */

//     function createAssignment(
//         uint256 _moduleId,
//         string calldata _ipfsHash,
//         string calldata _publicKey
//     ) external onlyProfessor {
//         require(modules[_moduleId].exists, "Module does not exist");
//         require(
//             modules[_moduleId].professor == msg.sender,
//             "Not module professor"
//         );

//         assignmentCount++;
//         assignments[assignmentCount] = Assignment(
//             assignmentCount,
//             _moduleId,
//             _ipfsHash,
//             _publicKey,
//             true
//         );

//         emit ActionLog(msg.sender, "Assignment created", block.timestamp);
//     }

//     /* =====================================================
//                 SUBMISSIONS (STUDENT)
//     ===================================================== */

//     function submitAssignment(
//         uint256 _assignmentId,
//         string calldata _encryptedIpfsHash
//     ) external onlyStudent {
//         require(assignments[_assignmentId].exists, "Assignment does not exist");

//         uint256 moduleId = assignments[_assignmentId].moduleId;
//         require(
//             moduleStudents[moduleId][msg.sender],
//             "Student not enrolled in module"
//         );

//         submissions[_assignmentId][msg.sender] = Submission(
//             msg.sender,
//             _encryptedIpfsHash,
//             false
//         );

//         emit ActionLog(msg.sender, "Assignment submitted", block.timestamp);
//     }

//     /* =====================================================
//                 GRADING (PROFESSOR)
//     ===================================================== */

//     function addGrade(
//         uint256 _assignmentId,
//         address _student,
//         uint8 _grade,
//         string calldata _note
//     ) external onlyProfessor {
//         require(assignments[_assignmentId].exists, "Assignment does not exist");

//         uint256 moduleId = assignments[_assignmentId].moduleId;
//         require(
//             modules[moduleId].professor == msg.sender,
//             "Not module professor"
//         );

//         grades[_assignmentId][_student] = Grade(_grade, _note);
//         submissions[_assignmentId][_student].graded = true;

//         emit ActionLog(msg.sender, "Grade added", block.timestamp);
//     }
// }

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AcademicManagementSystem {

    /* =====================================================
                            ROLES
    ===================================================== */

    enum Role {
        NONE,
        ADMIN,
        PROFESSOR,
        STUDENT
    }

    mapping(address => Role) private roles;

    /* =====================================================
                            STRUCTS
    ===================================================== */

    struct Module {
        uint256 id;
        string name;
        address professor;
        bool exists;
    }

    struct Assignment {
        uint256 id;
        uint256 moduleId;
        string ipfsHash;
        string professorPublicKey;
        uint256 deadline; // unix timestamp
        bool exists;
    }

    struct Submission {
        address student;
        string encryptedIpfsHash;
        bool graded;
    }

    struct Grade {
        uint8 value;
        string note;
    }

    /* =====================================================
                        STATE VARIABLES
    ===================================================== */

    uint256 public moduleCount;
    uint256 public assignmentCount;

    mapping(uint256 => Module) public modules;
    mapping(uint256 => Assignment) public assignments;

    // moduleId => student => enrolled
    mapping(uint256 => mapping(address => bool)) public moduleStudents;

    // assignmentId => student => submission
    mapping(uint256 => mapping(address => Submission)) public submissions;

    // assignmentId => student => grade
    mapping(uint256 => mapping(address => Grade)) public grades;

    /* =====================================================
                            EVENTS
    ===================================================== */

    event ActionLog(
        address indexed user,
        string action,
        uint256 timestamp
    );

    /* =====================================================
                            MODIFIERS
    ===================================================== */

    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.ADMIN, "Admin only");
        _;
    }

    modifier onlyProfessor() {
        require(roles[msg.sender] == Role.PROFESSOR, "Professor only");
        _;
    }

    modifier onlyStudent() {
        require(roles[msg.sender] == Role.STUDENT, "Student only");
        _;
    }

    /* =====================================================
                        CONSTRUCTOR
    ===================================================== */

    constructor() {
        roles[msg.sender] = Role.ADMIN;
        emit ActionLog(msg.sender, "Admin initialized", block.timestamp);
    }

    /* =====================================================
                    ROLE MANAGEMENT (ADMIN)
    ===================================================== */

    function addAdmin(address _admin) external onlyAdmin {
        roles[_admin] = Role.ADMIN;
        emit ActionLog(msg.sender, "Admin added", block.timestamp);
    }

    function addProfessor(address _prof) external onlyAdmin {
        roles[_prof] = Role.PROFESSOR;
        emit ActionLog(msg.sender, "Professor added", block.timestamp);
    }

    function addStudent(address _student) external onlyAdmin {
        roles[_student] = Role.STUDENT;
        emit ActionLog(msg.sender, "Student added", block.timestamp);
    }

    function removeProfessor(address _prof) external onlyAdmin {
        require(roles[_prof] == Role.PROFESSOR, "Not a professor");
        roles[_prof] = Role.NONE;
        emit ActionLog(msg.sender, "Professor removed", block.timestamp);
    }

    function removeStudent(address _student) external onlyAdmin {
        require(roles[_student] == Role.STUDENT, "Not a student");
        roles[_student] = Role.NONE;
        emit ActionLog(msg.sender, "Student removed", block.timestamp);
    }

    function getRole(address _user) external view returns (Role) {
        return roles[_user];
    }

    /* =====================================================
                    MODULE MANAGEMENT (ADMIN)
    ===================================================== */

    function createModule(string calldata _name) external onlyAdmin {
        moduleCount++;
        modules[moduleCount] = Module(
            moduleCount,
            _name,
            address(0),
            true
        );
        emit ActionLog(msg.sender, "Module created", block.timestamp);
    }

    function assignProfessorToModule(
        uint256 _moduleId,
        address _prof
    ) external onlyAdmin {
        require(modules[_moduleId].exists, "Module not found");
        require(roles[_prof] == Role.PROFESSOR, "Not a professor");

        modules[_moduleId].professor = _prof;
        emit ActionLog(msg.sender, "Professor assigned to module", block.timestamp);
    }

    function enrollStudentInModule(
        uint256 _moduleId,
        address _student
    ) external onlyAdmin {
        require(modules[_moduleId].exists, "Module not found");
        require(roles[_student] == Role.STUDENT, "Not a student");

        moduleStudents[_moduleId][_student] = true;
        emit ActionLog(msg.sender, "Student enrolled in module", block.timestamp);
    }

    function removeStudentFromModule(
        uint256 _moduleId,
        address _student
    ) external onlyAdmin {
        require(moduleStudents[_moduleId][_student], "Not enrolled");

        moduleStudents[_moduleId][_student] = false;
        emit ActionLog(msg.sender, "Student removed from module", block.timestamp);
    }
function removeProfessorFromModule(
    uint256 _moduleId
) external onlyAdmin {
    require(modules[_moduleId].exists, "Module not found");
    require(
        modules[_moduleId].professor != address(0),
        "No professor assigned"
    );

    modules[_moduleId].professor = address(0);

    emit ActionLog(msg.sender, "Professor removed from module", block.timestamp);
}

    function removeModule(uint256 _moduleId) external onlyAdmin {
        require(modules[_moduleId].exists, "Module not found");

        modules[_moduleId].exists = false;
        emit ActionLog(msg.sender, "Module removed", block.timestamp);
    }

    /* =====================================================
                ASSIGNMENTS (PROFESSOR)
    ===================================================== */

    function createAssignment(
        uint256 _moduleId,
        string calldata _ipfsHash,
        string calldata _publicKey,
        uint256 _deadline
    ) external onlyProfessor {
        require(modules[_moduleId].exists, "Module not found");
        require(modules[_moduleId].professor == msg.sender, "Not module professor");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        assignmentCount++;
        assignments[assignmentCount] = Assignment(
            assignmentCount,
            _moduleId,
            _ipfsHash,
            _publicKey,
            _deadline,
            true
        );

        emit ActionLog(msg.sender, "Assignment created", block.timestamp);
    }

    /* =====================================================
                SUBMISSIONS (STUDENT)
    ===================================================== */

    function submitAssignment(
        uint256 _assignmentId,
        string calldata _encryptedIpfsHash
    ) external onlyStudent {
        require(assignments[_assignmentId].exists, "Assignment not found");

        Assignment memory assignment = assignments[_assignmentId];

        require(block.timestamp <= assignment.deadline, "Deadline passed");

        uint256 moduleId = assignment.moduleId;
        require(moduleStudents[moduleId][msg.sender], "Not enrolled");

        submissions[_assignmentId][msg.sender] = Submission(
            msg.sender,
            _encryptedIpfsHash,
            false
        );

        emit ActionLog(msg.sender, "Assignment submitted or updated", block.timestamp);
    }

    /* =====================================================
                GRADING (PROFESSOR)
    ===================================================== */

    function addGrade(
        uint256 _assignmentId,
        address _student,
        uint8 _grade,
        string calldata _note
    ) external onlyProfessor {
        require(assignments[_assignmentId].exists, "Assignment not found");

        Assignment memory assignment = assignments[_assignmentId];
        require(block.timestamp > assignment.deadline, "Grading before deadline");

        uint256 moduleId = assignment.moduleId;
        require(modules[moduleId].professor == msg.sender, "Not module professor");

        require(
            submissions[_assignmentId][_student].student != address(0),
            "No submission"
        );

        // Re-grading allowed (transparent via events)
        grades[_assignmentId][_student] = Grade(_grade, _note);
        submissions[_assignmentId][_student].graded = true;

        emit ActionLog(msg.sender, "Grade added or updated", block.timestamp);
    }
}
