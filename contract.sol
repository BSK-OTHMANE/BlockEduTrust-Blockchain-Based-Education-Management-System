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
        uint256 deadline;
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

    // ✅ NEW: module materials
    struct ModuleMaterial {
        uint256 id;
        uint256 moduleId;
        string title;
        string ipfsHash;
        uint256 uploadedAt;
    }

    /* =====================================================
                        STATE VARIABLES
    ===================================================== */

    uint256 public moduleCount;
    uint256 public assignmentCount;
    uint256 public materialCount;

    mapping(uint256 => Module) public modules;
    mapping(uint256 => Assignment) public assignments;
    mapping(uint256 => ModuleMaterial) public materials;

    // moduleId => assignmentIds
    mapping(uint256 => uint256[]) private moduleAssignments;

    // moduleId => materialIds
    mapping(uint256 => uint256[]) private moduleMaterials;

    // moduleId => student => enrolled
    mapping(uint256 => mapping(address => bool)) public moduleStudents;
    mapping(uint256 => address[]) private moduleStudentList;

    // assignmentId => student => submission
    mapping(uint256 => mapping(address => Submission)) public submissions;

    // assignmentId => student => grade
    mapping(uint256 => mapping(address => Grade)) public grades;
    // materialId => removed
    mapping(uint256 => bool) private removedMaterials;

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
        emit ActionLog(_admin, "Admin added", block.timestamp);
    }

    function addProfessor(address _prof) external onlyAdmin {
        roles[_prof] = Role.PROFESSOR;
        emit ActionLog(_prof, "Professor added", block.timestamp);
    }

    function addStudent(address _student) external onlyAdmin {
        roles[_student] = Role.STUDENT;
        emit ActionLog(_student, "Student added", block.timestamp);
    }

    function removeProfessor(address _prof) external onlyAdmin {
        require(roles[_prof] == Role.PROFESSOR, "Not professor");
        roles[_prof] = Role.NONE;
        emit ActionLog(_prof, "Professor removed", block.timestamp);
    }

    function removeStudent(address _student) external onlyAdmin {
        require(roles[_student] == Role.STUDENT, "Not student");
        roles[_student] = Role.NONE;
        emit ActionLog(_student, "Student removed", block.timestamp);
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

    function removeModule(uint256 _moduleId) external onlyAdmin {
        require(modules[_moduleId].exists, "Module not found");
        modules[_moduleId].exists = false;
        emit ActionLog(msg.sender, "Module removed", block.timestamp);
    }

    function assignProfessorToModule(
        uint256 _moduleId,
        address _prof
    ) external onlyAdmin {
        require(modules[_moduleId].exists, "Module not found");
        require(roles[_prof] == Role.PROFESSOR, "Not professor");

        modules[_moduleId].professor = _prof;
        emit ActionLog(_prof, "Professor assigned to module", block.timestamp);
    }

    function removeProfessorFromModule(uint256 _moduleId) external onlyAdmin {
        require(modules[_moduleId].exists, "Module not found");
        modules[_moduleId].professor = address(0);
        emit ActionLog(msg.sender, "Professor removed from module", block.timestamp);
    }

    /* =====================================================
                STUDENT ENROLLMENT (ADMIN)
    ===================================================== */

    function enrollStudentInModule(
        uint256 _moduleId,
        address _student
    ) external onlyAdmin {
        require(modules[_moduleId].exists, "Module not found");
        require(roles[_student] == Role.STUDENT, "Not student");
        require(!moduleStudents[_moduleId][_student], "Already enrolled");

        moduleStudents[_moduleId][_student] = true;
        moduleStudentList[_moduleId].push(_student);

        emit ActionLog(_student, "Student enrolled", block.timestamp);
    }

    function removeStudentFromModule(
        uint256 _moduleId,
        address _student
    ) external onlyAdmin {
        require(moduleStudents[_moduleId][_student], "Not enrolled");

        moduleStudents[_moduleId][_student] = false;

        address[] storage students = moduleStudentList[_moduleId];
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i] == _student) {
                students[i] = students[students.length - 1];
                students.pop();
                break;
            }
        }

        emit ActionLog(_student, "Student removed", block.timestamp);
    }

    function getStudentsByModule(
        uint256 _moduleId
    ) external view returns (address[] memory) {
        return moduleStudentList[_moduleId];
    }

    /* =====================================================
                READ HELPERS (FRONTEND)
    ===================================================== */

    function getAllModules() external view returns (Module[] memory) {
        uint256 count = moduleCount;
        uint256 active = 0;

        for (uint256 i = 1; i <= count; i++) {
            if (modules[i].exists) active++;
        }

        Module[] memory result = new Module[](active);
        uint256 index = 0;

        for (uint256 i = 1; i <= count; i++) {
            if (modules[i].exists) {
                result[index] = modules[i];
                index++;
            }
        }

        return result;
    }

    function getModulesByProfessor(
        address _prof
    ) external view returns (Module[] memory) {
        uint256 count = moduleCount;
        uint256 matches = 0;

        for (uint256 i = 1; i <= count; i++) {
            if (modules[i].exists && modules[i].professor == _prof) {
                matches++;
            }
        }

        Module[] memory result = new Module[](matches);
        uint256 index = 0;

        for (uint256 i = 1; i <= count; i++) {
            if (modules[i].exists && modules[i].professor == _prof) {
                result[index] = modules[i];
                index++;
            }
        }

        return result;
    }

    function getModulesByStudent(
        address _student
    ) external view returns (Module[] memory) {
        uint256 count = moduleCount;
        uint256 matches = 0;

        for (uint256 i = 1; i <= count; i++) {
            if (modules[i].exists && moduleStudents[i][_student]) {
                matches++;
            }
        }

        Module[] memory result = new Module[](matches);
        uint256 index = 0;

        for (uint256 i = 1; i <= count; i++) {
            if (modules[i].exists && moduleStudents[i][_student]) {
                result[index] = modules[i];
                index++;
            }
        }

        return result;
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
        require(_deadline > block.timestamp, "Invalid deadline");

        assignmentCount++;
        assignments[assignmentCount] = Assignment(
            assignmentCount,
            _moduleId,
            _ipfsHash,
            _publicKey,
            _deadline,
            true
        );

        // ✅ NEW
        moduleAssignments[_moduleId].push(assignmentCount);

        emit ActionLog(msg.sender, "Assignment created", block.timestamp);
    }

    // ✅ NEW
    function getAssignmentsByModule(
        uint256 _moduleId
    ) external view returns (Assignment[] memory) {
        uint256[] memory ids = moduleAssignments[_moduleId];
        Assignment[] memory result = new Assignment[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = assignments[ids[i]];
        }

        return result;
    }

    /* =====================================================
                MODULE MATERIALS (RESOURCES)
    ===================================================== */

    function addModuleMaterial(
        uint256 _moduleId,
        string calldata _title,
        string calldata _ipfsHash
    ) external onlyProfessor {
        require(modules[_moduleId].exists, "Module not found");
        require(modules[_moduleId].professor == msg.sender, "Not module professor");

        materialCount++;
        materials[materialCount] = ModuleMaterial(
            materialCount,
            _moduleId,
            _title,
            _ipfsHash,
            block.timestamp
        );

        moduleMaterials[_moduleId].push(materialCount);

        emit ActionLog(msg.sender, "Module material added", block.timestamp);
    }

    function getMaterialsByModule(
        uint256 _moduleId
    ) external view returns (ModuleMaterial[] memory) {
        uint256[] memory ids = moduleMaterials[_moduleId];
        ModuleMaterial[] memory result = new ModuleMaterial[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = materials[ids[i]];
        }

        return result;
    }
    
    
    /* =====================================================
                SUBMISSIONS & GRADING
    ===================================================== */

    function submitAssignment(
        uint256 _assignmentId,
        string calldata _encryptedIpfsHash
    ) external onlyStudent {
        require(assignments[_assignmentId].exists, "Assignment not found");
        require(block.timestamp <= assignments[_assignmentId].deadline, "Deadline passed");

        uint256 moduleId = assignments[_assignmentId].moduleId;
        require(moduleStudents[moduleId][msg.sender], "Not enrolled");

        submissions[_assignmentId][msg.sender] = Submission(
            msg.sender,
            _encryptedIpfsHash,
            false
        );

        emit ActionLog(msg.sender, "Assignment submitted", block.timestamp);
    }

    function addGrade(
        uint256 _assignmentId,
        address _student,
        uint8 _grade,
        string calldata _note
    ) external onlyProfessor {
        require(assignments[_assignmentId].exists, "Assignment not found");
        require(block.timestamp > assignments[_assignmentId].deadline, "Too early");

        uint256 moduleId = assignments[_assignmentId].moduleId;
        require(modules[moduleId].professor == msg.sender, "Not module professor");
        require(submissions[_assignmentId][_student].student != address(0), "No submission");

        grades[_assignmentId][_student] = Grade(_grade, _note);
        submissions[_assignmentId][_student].graded = true;

        emit ActionLog(msg.sender, "Grade added or updated", block.timestamp);
    }
}
