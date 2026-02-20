# Test Credentials for School Management System

## Admin Account
- **Email**: admin@gmail.com
- **Password**: 12345678
- **Access**: Full system access, admin dashboard

## Teacher Accounts

### Teacher 1
- **Email**: teacher1@school.edu
- **Password**: password123
- **Department**: Computer Science
- **Designation**: Professor

### Teacher 2
- **Email**: teacher2@school.edu
- **Password**: password123
- **Department**: Mathematics
- **Designation**: Associate Professor

### Teacher 3
- **Email**: teacher3@school.edu
- **Password**: password123
- **Department**: Physics
- **Designation**: Assistant Professor

### Teacher 4
- **Email**: teacher4@school.edu
- **Password**: password123
- **Department**: Computer Science
- **Designation**: Lecturer

## Student Accounts

### Student 1
- **Email**: student1@school.edu
- **Password**: password123
- **Department**: Computer Science
- **Semester**: 3

### Student 2
- **Email**: student2@school.edu
- **Password**: password123
- **Department**: Computer Science
- **Semester**: 5

### Student 3
- **Email**: student3@school.edu
- **Password**: password123
- **Department**: Mathematics
- **Semester**: 2

### Student 4
- **Email**: student4@school.edu
- **Password**: password123
- **Department**: Mathematics
- **Semester**: 4

### Student 5
- **Email**: student5@school.edu
- **Password**: password123
- **Department**: Physics
- **Semester**: 1

### Student 6
- **Email**: student6@school.edu
- **Password**: password123
- **Department**: Physics
- **Semester**: 6

### Student 7
- **Email**: student7@school.edu
- **Password**: password123
- **Department**: Computer Science
- **Semester**: 8

## Database Statistics (Seeded Data)

- **Departments**: 3 (Computer Science, Mathematics, Physics)
- **Teachers**: 4 (each teaching exactly 3 courses)
- **Students**: 7 (distributed across departments)
- **Courses**: 12 (4 courses per department)
- **Enrollments**: 23 (students enrolled in various courses)
- **Grade Items**: 92 (assignments, quizzes, midterms, finals)

## Business Rules Enforced

1. **Teachers**: Maximum 3 courses per teacher
2. **Students**: Maximum 21 credit hours per semester
3. **Students**: Maximum 12 semesters allowed
4. **Courses**: Credit hours range 0-4
5. **Grade Items**: 
   - Assignment max: 20 marks
   - Quiz max: 20 marks
   - Final max: 50 or 100 marks
   - Final requires midterm + assignment + quiz to be completed first

## Quick Test Scenarios

### As Admin
1. Login with admin@gmail.com
2. View all departments, teachers, students, courses
3. Create/Edit/Delete any resource

### As Teacher
1. Login with any teacher account
2. View assigned courses
3. Add/update grades for enrolled students
4. Try to get assigned more than 3 courses (should fail)

### As Student
1. Login with any student account
2. View enrolled courses
3. Check grades and grade items
4. Try to enroll in courses exceeding 21 credit hours (should fail)
