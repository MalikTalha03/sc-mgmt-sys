import * as admin from "firebase-admin";
const serviceAccountJson = require("/home/talha/Downloads/stud-mgmt-sys-firebase-adminsdk-fbsvc-f359141b43.json");

// Initialize Firebase Admin
const serviceAccount: admin.ServiceAccount = {
  projectId: serviceAccountJson.project_id,
  clientEmail: serviceAccountJson.client_email,
  privateKey: serviceAccountJson.private_key.replace(/\\n/g, "\n"),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

// Weightage for grade calculation
const gradeWeightage = { assignments: 0.1, quizzes: 0.15, mid: 0.25, final: 0.5 };

// Helper to calculate total & GPA
function calculateGPA(
  assignments: number[],
  quizzes: number[],
  mid: number,
  final: number
) {
  const totalAssignment = assignments.reduce((a, b) => a + b, 0);
  const totalQuizzes = quizzes.reduce((a, b) => a + b, 0);
  const total = totalAssignment + totalQuizzes + mid + final;

  const weightedTotal =
    (totalAssignment / 4) * gradeWeightage.assignments +
    (totalQuizzes / 4) * gradeWeightage.quizzes +
    mid * gradeWeightage.mid +
    final * gradeWeightage.final;

  const gpa = (weightedTotal / 100) * 4; // scale 4.0
  return { total, gpa };
}

async function clearCollection(collectionName: string) {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Cleared collection: ${collectionName}`);
}

async function seedLMS() {
  console.log("Seeding LMS database...");

  // Clear previous data
  const collections = [
    "admins",
    "departments",
    "courses",
    "teachers",
    "students",
    "enrollments",
    "grades",
  ];
  for (const col of collections) await clearCollection(col);

  // 1️⃣ Admin
  const adminUser = {
    adminId: "ADMIN-001",
    name: "Super Admin",
    email: "admin@lms.com",
    role: "superadmin",
  };
  await db
    .collection("admins")
    .doc(adminUser.adminId)
    .set({ ...adminUser, createdAt: serverTimestamp() });
  console.log("Added Admin:", adminUser.name);

  // 2️⃣ Departments
  const departments = [
    { name: "Computer Science", code: "CS", isActive: true },
    { name: "Electrical Engineering", code: "EE", isActive: true },
  ];
  for (const dept of departments) {
    await db
      .collection("departments")
      .doc(dept.code)
      .set({ ...dept, createdAt: serverTimestamp() });
    console.log("Added Department:", dept.code);
  }

  // 3️⃣ Courses
  const courses = [
    {
      title: "Programming Fundamentals",
      code: "CS101",
      creditHours: 3,
      departmentCode: "CS",
      semester: 1,
    },
    {
      title: "Data Structures",
      code: "CS102",
      creditHours: 3,
      departmentCode: "CS",
      semester: 2,
    },
    { title: "Circuits", code: "EE101", creditHours: 3, departmentCode: "EE", semester: 1 },
    { title: "Electromagnetics", code: "EE102", creditHours: 3, departmentCode: "EE", semester: 2 },
  ];
  for (const course of courses) {
    await db
      .collection("courses")
      .doc(course.code)
      .set({ ...course, createdAt: serverTimestamp() });
    console.log("Added Course:", course.code);
  }

  // 4️⃣ Teachers
  const teachers = [
    { name: "Dr. Alice", designation: "Lecturer", departmentCode: "CS", assignedCourses: ["CS101","CS102"] },
    { name: "Dr. Bob", designation: "Assistant Professor", departmentCode: "EE", assignedCourses: ["EE101","EE102"] },
  ];
  for (const teacher of teachers) {
    const docRef = await db.collection("teachers").add({ ...teacher, createdAt: serverTimestamp() });
    console.log("Added Teacher:", teacher.name, "ID:", docRef.id);
  }

  // 5️⃣ Students
  const students = [
    { studentId: "CS-001", name: "Malik", semester: 1, departmentCode: "CS", currentCreditHours: 0, maxCreditHours: 18 },
    { studentId: "CS-002", name: "Sara", semester: 2, departmentCode: "CS", currentCreditHours: 0, maxCreditHours: 18 },
    { studentId: "EE-001", name: "Talha", semester: 1, departmentCode: "EE", currentCreditHours: 0, maxCreditHours: 18 },
    { studentId: "EE-002", name: "Ali", semester: 2, departmentCode: "EE", currentCreditHours: 0, maxCreditHours: 18 },
  ];
  for (const student of students) {
    await db
      .collection("students")
      .doc(student.studentId)
      .set({ ...student, createdAt: serverTimestamp() });
    console.log("Added Student:", student.studentId);
  }

  // 6️⃣ Enrollments
  const enrollments = [
    { studentId: "CS-001", courseCode: "CS101", status: "approved" },
    { studentId: "CS-002", courseCode: "CS102", status: "pending" },
    { studentId: "EE-001", courseCode: "EE101", status: "approved" },
    { studentId: "EE-002", courseCode: "EE102", status: "rejected" },
  ];
  for (const enroll of enrollments) {
    await db.collection("enrollments").add({ ...enroll, createdAt: serverTimestamp() });
    console.log("Added Enrollment:", enroll.studentId, enroll.courseCode);
  }

  // 7️⃣ Grades with 4 quizzes and 4 assignments + max marks
  const gradesData = [
    {
      studentId: "CS-001",
      courseCode: "CS101",
      marks: {
        assignments: [8, 9, 10, 7],
        quizzes: [12, 11, 10, 13],
        mid: 20,
        final: 45,
        maxAssignments: [10, 10, 10, 10],
        maxQuizzes: [15, 15, 15, 15],
        maxMid: 25,
        maxFinal: 50,
      },
    },
    {
      studentId: "EE-001",
      courseCode: "EE101",
      marks: {
        assignments: [9, 8, 10, 10],
        quizzes: [13, 12, 14, 11],
        mid: 22,
        final: 40,
        maxAssignments: [10, 10, 10, 10],
        maxQuizzes: [15, 15, 15, 15],
        maxMid: 25,
        maxFinal: 50,
      },
    },
  ];

  for (const g of gradesData) {
    const { total, gpa } = calculateGPA(g.marks.assignments, g.marks.quizzes, g.marks.mid, g.marks.final);
    await db.collection("grades").add({ ...g, total, gpa, createdAt: serverTimestamp() });
    console.log("Added Grade:", g.studentId, g.courseCode, "GPA:", gpa.toFixed(2));
  }

  console.log("✅ LMS Database seeding completed successfully!");
}

seedLMS().catch(console.error);
