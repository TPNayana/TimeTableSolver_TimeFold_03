import { storage } from "./storage";

export async function seedData() {
  // Check if data already exists
  const existingTeachers = await storage.getAllTeachers();
  if (existingTeachers.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database with initial data...");

  // Create teachers
  const drSmith = await storage.createTeacher({
    name: "Dr. Smith",
    email: "smith@university.edu",
    department: "CS",
  });

  const profJohnson = await storage.createTeacher({
    name: "Prof. Johnson",
    email: "johnson@university.edu",
    department: "MATH",
  });

  const drWilliams = await storage.createTeacher({
    name: "Dr. Williams",
    email: "williams@university.edu",
    department: "MATH",
  });

  const profBrown = await storage.createTeacher({
    name: "Prof. Brown",
    email: "brown@university.edu",
    department: "CS",
  });

  // Mechanical Engineering Teachers
  const drMechanical = await storage.createTeacher({
    name: "Dr. Mechanical",
    email: "mechanical@university.edu",
    department: "ME",
  });

  const profThermo = await storage.createTeacher({
    name: "Prof. Thermo",
    email: "thermo@university.edu",
    department: "ME",
  });

  // Civil Engineering Teachers
  const drCivil = await storage.createTeacher({
    name: "Dr. Civil",
    email: "civil@university.edu",
    department: "CE",
  });

  const profStructure = await storage.createTeacher({
    name: "Prof. Structure",
    email: "structure@university.edu",
    department: "CE",
  });

  // Electrical Engineering Teachers
  const drElectrical = await storage.createTeacher({
    name: "Dr. Electrical",
    email: "electrical@university.edu",
    department: "EE",
  });

  const profPower = await storage.createTeacher({
    name: "Prof. Power",
    email: "power@university.edu",
    department: "EE",
  });

  // Electronics Engineering Teachers
  const drElectronics = await storage.createTeacher({
    name: "Dr. Electronics",
    email: "electronics@university.edu",
    department: "Electronics",
  });

  const profMicro = await storage.createTeacher({
    name: "Prof. Micro",
    email: "micro@university.edu",
    department: "Electronics",
  });

  // Chemical Engineering Teachers
  const drChemical = await storage.createTeacher({
    name: "Dr. Chemical",
    email: "chemical@university.edu",
    department: "ChE",
  });

  const profProcess = await storage.createTeacher({
    name: "Prof. Process",
    email: "process@university.edu",
    department: "ChE",
  });

  // Aerospace Engineering Teachers
  const drAerospace = await storage.createTeacher({
    name: "Dr. Aerospace",
    email: "aerospace@university.edu",
    department: "AE",
  });

  const profFlight = await storage.createTeacher({
    name: "Prof. Flight",
    email: "flight@university.edu",
    department: "AE",
  });

  // Create student groups
  const cs3a = await storage.createStudentGroup({
    name: "CS-3A",
    department: "CS",
    yearLevel: 3,
  });

  const cs3b = await storage.createStudentGroup({
    name: "CS-3B",
    department: "CS",
    yearLevel: 3,
  });

  const cs4a = await storage.createStudentGroup({
    name: "CS-4A",
    department: "CS",
    yearLevel: 4,
  });

  const math2b = await storage.createStudentGroup({
    name: "MATH-2B",
    department: "MATH",
    yearLevel: 2,
  });

  // Mechanical Engineering Student Groups
  const me3a = await storage.createStudentGroup({
    name: "ME-3A",
    department: "ME",
    yearLevel: 3,
  });

  const me2b = await storage.createStudentGroup({
    name: "ME-2B",
    department: "ME",
    yearLevel: 2,
  });

  // Civil Engineering Student Groups
  const ce3a = await storage.createStudentGroup({
    name: "CE-3A",
    department: "CE",
    yearLevel: 3,
  });

  const ce2a = await storage.createStudentGroup({
    name: "CE-2A",
    department: "CE",
    yearLevel: 2,
  });

  // Electrical Engineering Student Groups
  const ee3b = await storage.createStudentGroup({
    name: "EE-3B",
    department: "EE",
    yearLevel: 3,
  });

  const ee2a = await storage.createStudentGroup({
    name: "EE-2A",
    department: "EE",
    yearLevel: 2,
  });

  // Electronics Engineering Student Groups
  const electronics3a = await storage.createStudentGroup({
    name: "Electronics-3A",
    department: "Electronics",
    yearLevel: 3,
  });

  const electronics2b = await storage.createStudentGroup({
    name: "Electronics-2B",
    department: "Electronics",
    yearLevel: 2,
  });

  // Chemical Engineering Student Groups
  const che3a = await storage.createStudentGroup({
    name: "ChE-3A",
    department: "ChE",
    yearLevel: 3,
  });

  const che2a = await storage.createStudentGroup({
    name: "ChE-2A",
    department: "ChE",
    yearLevel: 2,
  });

  // Aerospace Engineering Student Groups
  const ae3b = await storage.createStudentGroup({
    name: "AE-3B",
    department: "AE",
    yearLevel: 3,
  });

  const ae2a = await storage.createStudentGroup({
    name: "AE-2A",
    department: "AE",
    yearLevel: 2,
  });

  // Create courses
  const dataStructures = await storage.createCourse({
    name: "Data Structures",
    code: "CS201",
    department: "CS",
    duration: 1,
  });

  const algorithms = await storage.createCourse({
    name: "Algorithms",
    code: "CS202",
    department: "CS",
    duration: 1,
  });

  const databaseSystems = await storage.createCourse({
    name: "Database Systems",
    code: "CS301",
    department: "CS",
    duration: 1,
  });

  const computerNetworks = await storage.createCourse({
    name: "Computer Networks",
    code: "CS401",
    department: "CS",
    duration: 1,
  });

  const calculus = await storage.createCourse({
    name: "Calculus II",
    code: "MATH202",
    department: "MATH",
    duration: 1,
  });

  const linearAlgebra = await storage.createCourse({
    name: "Linear Algebra",
    code: "MATH301",
    department: "MATH",
    duration: 1,
  });

  // Mechanical Engineering Courses
  const thermodynamics = await storage.createCourse({
    name: "Thermodynamics",
    code: "ME101",
    department: "ME",
    duration: 1,
  });

  const mechanics = await storage.createCourse({
    name: "Mechanics of Materials",
    code: "ME201",
    department: "ME",
    duration: 1,
  });

  const fluidMechanics = await storage.createCourse({
    name: "Fluid Mechanics",
    code: "ME301",
    department: "ME",
    duration: 1,
  });

  const heatTransfer = await storage.createCourse({
    name: "Heat Transfer",
    code: "ME401",
    department: "ME",
    duration: 1,
  });

  // Civil Engineering Courses
  const structuralAnalysis = await storage.createCourse({
    name: "Structural Analysis",
    code: "CE101",
    department: "CE",
    duration: 1,
  });

  const reinforcedConcrete = await storage.createCourse({
    name: "Reinforced Concrete",
    code: "CE201",
    department: "CE",
    duration: 1,
  });

  const geotechnical = await storage.createCourse({
    name: "Geotechnical Engineering",
    code: "CE301",
    department: "CE",
    duration: 1,
  });

  const hydraulics = await storage.createCourse({
    name: "Hydraulics",
    code: "CE401",
    department: "CE",
    duration: 1,
  });

  // Electrical Engineering Courses
  const circuitTheory = await storage.createCourse({
    name: "Circuit Theory",
    code: "EE101",
    department: "EE",
    duration: 1,
  });

  const signals = await storage.createCourse({
    name: "Signals and Systems",
    code: "EE201",
    department: "EE",
    duration: 1,
  });

  const powerSystems = await storage.createCourse({
    name: "Power Systems",
    code: "EE301",
    department: "EE",
    duration: 1,
  });

  const machines = await storage.createCourse({
    name: "Electrical Machines",
    code: "EE401",
    department: "EE",
    duration: 1,
  });

  // Electronics Engineering Courses
  const digitalElectronics = await storage.createCourse({
    name: "Digital Electronics",
    code: "Electronics101",
    department: "Electronics",
    duration: 1,
  });

  const microcontrollers = await storage.createCourse({
    name: "Microcontrollers",
    code: "Electronics201",
    department: "Electronics",
    duration: 1,
  });

  const vlsi = await storage.createCourse({
    name: "VLSI Design",
    code: "Electronics301",
    department: "Electronics",
    duration: 1,
  });

  const embedded = await storage.createCourse({
    name: "Embedded Systems",
    code: "Electronics401",
    department: "Electronics",
    duration: 1,
  });

  // Chemical Engineering Courses
  const processEngineering = await storage.createCourse({
    name: "Process Engineering",
    code: "ChE101",
    department: "ChE",
    duration: 1,
  });

  const unitOperations = await storage.createCourse({
    name: "Unit Operations",
    code: "ChE201",
    department: "ChE",
    duration: 1,
  });

  const processControl = await storage.createCourse({
    name: "Process Control",
    code: "ChE301",
    department: "ChE",
    duration: 1,
  });

  const reactionEngineering = await storage.createCourse({
    name: "Reaction Engineering",
    code: "ChE401",
    department: "ChE",
    duration: 1,
  });

  // Aerospace Engineering Courses
  const aerodynamics = await storage.createCourse({
    name: "Aerodynamics",
    code: "AE101",
    department: "AE",
    duration: 1,
  });

  const flightMechanics = await storage.createCourse({
    name: "Flight Mechanics",
    code: "AE201",
    department: "AE",
    duration: 1,
  });

  const propulsion = await storage.createCourse({
    name: "Propulsion Systems",
    code: "AE301",
    department: "AE",
    duration: 1,
  });

  const aircraftDesign = await storage.createCourse({
    name: "Aircraft Design",
    code: "AE401",
    department: "AE",
    duration: 1,
  });

  // Create classes
  await storage.createClass({
    courseId: dataStructures.id,
    teacherId: drSmith.id,
    studentGroupId: cs3a.id,
    day: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: calculus.id,
    teacherId: profJohnson.id,
    studentGroupId: math2b.id,
    day: "Monday",
    startTime: "10:00",
    endTime: "11:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: databaseSystems.id,
    teacherId: drSmith.id,
    studentGroupId: cs4a.id,
    day: "Tuesday",
    startTime: "09:00",
    endTime: "10:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: linearAlgebra.id,
    teacherId: drWilliams.id,
    studentGroupId: cs3a.id,
    day: "Wednesday",
    startTime: "11:00",
    endTime: "12:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: computerNetworks.id,
    teacherId: profBrown.id,
    studentGroupId: cs4a.id,
    day: "Thursday",
    startTime: "14:00",
    endTime: "15:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: algorithms.id,
    teacherId: drSmith.id,
    studentGroupId: cs3b.id,
    day: "Friday",
    startTime: "10:00",
    endTime: "11:00",
    hasConflict: false,
  });

  // Mechanical Engineering Classes
  await storage.createClass({
    courseId: thermodynamics.id,
    teacherId: drMechanical.id,
    studentGroupId: me3a.id,
    day: "Monday",
    startTime: "11:00",
    endTime: "12:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: mechanics.id,
    teacherId: profThermo.id,
    studentGroupId: me2b.id,
    day: "Tuesday",
    startTime: "10:00",
    endTime: "11:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: fluidMechanics.id,
    teacherId: drMechanical.id,
    studentGroupId: me3a.id,
    day: "Wednesday",
    startTime: "14:00",
    endTime: "15:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: heatTransfer.id,
    teacherId: profThermo.id,
    studentGroupId: me2b.id,
    day: "Thursday",
    startTime: "09:00",
    endTime: "10:00",
    hasConflict: false,
  });

  // Civil Engineering Classes
  await storage.createClass({
    courseId: structuralAnalysis.id,
    teacherId: drCivil.id,
    studentGroupId: ce3a.id,
    day: "Monday",
    startTime: "14:00",
    endTime: "15:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: reinforcedConcrete.id,
    teacherId: profStructure.id,
    studentGroupId: ce2a.id,
    day: "Tuesday",
    startTime: "14:00",
    endTime: "15:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: geotechnical.id,
    teacherId: drCivil.id,
    studentGroupId: ce3a.id,
    day: "Wednesday",
    startTime: "10:00",
    endTime: "11:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: hydraulics.id,
    teacherId: profStructure.id,
    studentGroupId: ce2a.id,
    day: "Thursday",
    startTime: "11:00",
    endTime: "12:00",
    hasConflict: false,
  });

  // Electrical Engineering Classes
  await storage.createClass({
    courseId: circuitTheory.id,
    teacherId: drElectrical.id,
    studentGroupId: ee3b.id,
    day: "Monday",
    startTime: "15:00",
    endTime: "16:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: signals.id,
    teacherId: profPower.id,
    studentGroupId: ee2a.id,
    day: "Tuesday",
    startTime: "11:00",
    endTime: "12:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: powerSystems.id,
    teacherId: drElectrical.id,
    studentGroupId: ee3b.id,
    day: "Wednesday",
    startTime: "11:00",
    endTime: "12:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: machines.id,
    teacherId: profPower.id,
    studentGroupId: ee2a.id,
    day: "Friday",
    startTime: "14:00",
    endTime: "15:00",
    hasConflict: false,
  });

  // Electronics Engineering Classes
  await storage.createClass({
    courseId: digitalElectronics.id,
    teacherId: drElectronics.id,
    studentGroupId: electronics3a.id,
    day: "Monday",
    startTime: "10:00",
    endTime: "11:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: microcontrollers.id,
    teacherId: profMicro.id,
    studentGroupId: electronics2b.id,
    day: "Tuesday",
    startTime: "09:00",
    endTime: "10:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: vlsi.id,
    teacherId: drElectronics.id,
    studentGroupId: electronics3a.id,
    day: "Wednesday",
    startTime: "15:00",
    endTime: "16:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: embedded.id,
    teacherId: profMicro.id,
    studentGroupId: electronics2b.id,
    day: "Friday",
    startTime: "10:00",
    endTime: "11:00",
    hasConflict: false,
  });

  // Chemical Engineering Classes
  await storage.createClass({
    courseId: processEngineering.id,
    teacherId: drChemical.id,
    studentGroupId: che3a.id,
    day: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: unitOperations.id,
    teacherId: profProcess.id,
    studentGroupId: che2a.id,
    day: "Tuesday",
    startTime: "15:00",
    endTime: "16:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: processControl.id,
    teacherId: drChemical.id,
    studentGroupId: che3a.id,
    day: "Thursday",
    startTime: "14:00",
    endTime: "15:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: reactionEngineering.id,
    teacherId: profProcess.id,
    studentGroupId: che2a.id,
    day: "Friday",
    startTime: "11:00",
    endTime: "12:00",
    hasConflict: false,
  });

  // Aerospace Engineering Classes
  await storage.createClass({
    courseId: aerodynamics.id,
    teacherId: drAerospace.id,
    studentGroupId: ae3b.id,
    day: "Monday",
    startTime: "10:00",
    endTime: "11:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: flightMechanics.id,
    teacherId: profFlight.id,
    studentGroupId: ae2a.id,
    day: "Wednesday",
    startTime: "09:00",
    endTime: "10:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: propulsion.id,
    teacherId: drAerospace.id,
    studentGroupId: ae3b.id,
    day: "Thursday",
    startTime: "15:00",
    endTime: "16:00",
    hasConflict: false,
  });

  await storage.createClass({
    courseId: aircraftDesign.id,
    teacherId: profFlight.id,
    studentGroupId: ae2a.id,
    day: "Friday",
    startTime: "15:00",
    endTime: "16:00",
    hasConflict: false,
  });

  console.log("Database seeded successfully!");
}
