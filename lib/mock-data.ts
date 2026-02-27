import type { User, Exam, ExamQuestion, Report, Notification, AuditLog } from "./types"

export const mockUsers: Record<string, User> = {
  candidate: {
    id: "u1",
    name: "Arjun Mehta",
    email: "arjun@example.com",
    role: "candidate",
    phone: "+91 98765 43210",
    institution: "IIT Delhi",
  },
  institution: {
    id: "u2",
    name: "Dr. Priya Sharma",
    email: "priya@iitd.edu",
    role: "institution",
    institution: "IIT Delhi",
  },
  admin: {
    id: "u3",
    name: "System Admin",
    email: "admin@proctora.ai",
    role: "admin",
  },
}

export const mockExamQuestions: ExamQuestion[] = [
  { id: "eq1", text: "What is the time complexity of binary search?", type: "mcq", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], correctAnswer: 1, marks: 2 },
  { id: "eq2", text: "Which data structure uses LIFO ordering?", type: "mcq", options: ["Queue", "Stack", "Array", "Linked List"], correctAnswer: 1, marks: 2 },
  { id: "eq3", text: "Explain the concept of polymorphism in object-oriented programming.", type: "descriptive", marks: 5 },
  { id: "eq4", text: "What is the output of: console.log(typeof null)?", type: "mcq", options: ["null", "undefined", "object", "string"], correctAnswer: 2, marks: 2 },
  { id: "eq5", text: "Which of the following is NOT a JavaScript framework?", type: "mcq", options: ["Angular", "Django", "React", "Vue"], correctAnswer: 1, marks: 2 },
  { id: "eq6", text: "Describe the difference between process and thread.", type: "descriptive", marks: 5 },
  { id: "eq7", text: "What is a closure in JavaScript?", type: "mcq", options: ["A function with its lexical scope", "A class method", "A loop construct", "A data type"], correctAnswer: 0, marks: 2 },
  { id: "eq8", text: "Explain the CAP theorem in distributed systems.", type: "descriptive", marks: 5 },
  { id: "eq9", text: "Which sorting algorithm has worst-case O(n log n)?", type: "mcq", options: ["Quick Sort", "Bubble Sort", "Merge Sort", "Selection Sort"], correctAnswer: 2, marks: 2 },
  { id: "eq10", text: "Write a brief essay on the importance of testing in software development.", type: "descriptive", marks: 10 },
]

export const mockExams: Exam[] = [
  { id: "e1", title: "Data Structures & Algorithms", subject: "Computer Science", status: "completed", date: "2026-02-18", duration: 90, totalQuestions: 30, score: 78, maxScore: 100, questions: mockExamQuestions.slice(0, 5) },
  { id: "e2", title: "Web Development Fundamentals", subject: "Web Dev", status: "not-started", date: "2026-03-02", duration: 60, totalQuestions: 25, maxScore: 80, questions: mockExamQuestions.slice(2, 7) },
  { id: "e3", title: "Operating Systems Midterm", subject: "OS", status: "in-progress", date: "2026-02-26", duration: 120, totalQuestions: 40, maxScore: 120, questions: mockExamQuestions.slice(4, 10) },
  { id: "e4", title: "Database Management Systems", subject: "DBMS", status: "completed", date: "2026-02-12", duration: 75, totalQuestions: 35, score: 65, maxScore: 100, questions: mockExamQuestions },
  { id: "e5", title: "Computer Networks", subject: "Networking", status: "not-started", date: "2026-03-10", duration: 90, totalQuestions: 30, maxScore: 90, questions: mockExamQuestions.slice(0, 8) },
]

export const mockReports: Report[] = [
  {
    id: "r2", type: "exam", title: "Data Structures & Algorithms", date: "2026-02-18", overallScore: 78, maxScore: 100,
    strengths: ["Strong in tree algorithms", "Good understanding of complexity analysis", "Clean code"],
    weaknesses: ["Graph algorithms need improvement", "Dynamic programming practice needed"],
    feedback: "Good overall performance. Above average in most categories. Focus on graph problems for improvement.",
    riskScore: 12,
    details: { "Arrays": 85, "Trees": 92, "Graphs": 60, "DP": 65, "Sorting": 88 },
  },
  {
    id: "r4", type: "exam", title: "Database Management Systems", date: "2026-02-12", overallScore: 65, maxScore: 100,
    strengths: ["Good SQL knowledge", "Understanding of normalization"],
    weaknesses: ["Indexing concepts need work", "Transaction management is weak"],
    feedback: "Average performance. Needs to focus on advanced topics like indexing and transactions.",
    riskScore: 8,
    details: { "SQL": 80, "Normalization": 75, "Indexing": 50, "Transactions": 45, "NoSQL": 60 },
  },
]

export const mockNotifications: Notification[] = [
  { id: "n2", title: "Exam Reminder", message: "Web Development Fundamentals exam in 4 days", type: "warning", read: false, date: "2026-02-26" },
  { id: "n4", title: "Score Updated", message: "DSA exam score has been finalized: 78/100", type: "info", read: true, date: "2026-02-19" },
  { id: "n5", title: "Proctoring Alert", message: "Unusual activity detected during OS exam - under review", type: "error", read: false, date: "2026-02-26" },
]

export const mockAuditLogs: AuditLog[] = [
  { id: "a1", action: "Login", user: "arjun@example.com", role: "candidate", timestamp: "2026-02-26T10:00:00Z", details: "Successful login from Chrome/Windows", severity: "low" },
  { id: "a2", action: "Exam Started", user: "arjun@example.com", role: "candidate", timestamp: "2026-02-26T10:05:00Z", details: "Started OS Midterm exam", severity: "low" },
  { id: "a3", action: "Proctoring Alert", user: "arjun@example.com", role: "candidate", timestamp: "2026-02-26T10:15:00Z", details: "Tab switch detected during exam", severity: "high" },
  { id: "a4", action: "Risk Threshold Updated", user: "admin@proctora.ai", role: "admin", timestamp: "2026-02-25T14:00:00Z", details: "Risk threshold changed from 0.7 to 0.8", severity: "medium" },
  { id: "a5", action: "AI Model Updated", user: "admin@proctora.ai", role: "admin", timestamp: "2026-02-24T09:00:00Z", details: "Proctoring model v2.3 deployed", severity: "medium" },
  { id: "a6", action: "User Registered", user: "newuser@example.com", role: "candidate", timestamp: "2026-02-23T16:30:00Z", details: "New candidate registration", severity: "low" },
  { id: "a7", action: "Exam Published", user: "priya@iitd.edu", role: "institution", timestamp: "2026-02-22T11:00:00Z", details: "Published Web Development Fundamentals exam", severity: "low" },
  { id: "a8", action: "Bulk Import", user: "priya@iitd.edu", role: "institution", timestamp: "2026-02-21T08:00:00Z", details: "Imported 150 candidate records", severity: "medium" },
]

export const weeklyActivity = [
  { day: "Mon", exams: 1, studyHours: 3 },
  { day: "Tue", exams: 2, studyHours: 4 },
  { day: "Wed", exams: 0, studyHours: 2 },
  { day: "Thu", exams: 1, studyHours: 5 },
  { day: "Fri", exams: 3, studyHours: 3 },
  { day: "Sat", exams: 1, studyHours: 6 },
  { day: "Sun", exams: 0, studyHours: 1 },
]

export const candidateSkills = [
  { skill: "React", score: 90 },
  { skill: "System Design", score: 70 },
  { skill: "DSA", score: 78 },
  { skill: "Communication", score: 85 },
  { skill: "Node.js", score: 72 },
  { skill: "Databases", score: 65 },
]

export const institutionCandidateStats = [
  { month: "Sep", registered: 120, active: 100, completed: 45 },
  { month: "Oct", registered: 150, active: 130, completed: 78 },
  { month: "Nov", registered: 180, active: 155, completed: 110 },
  { month: "Dec", registered: 200, active: 170, completed: 140 },
  { month: "Jan", registered: 230, active: 200, completed: 165 },
  { month: "Feb", registered: 250, active: 220, completed: 190 },
]

export const institutionExamPerformance = [
  { exam: "DSA", avgScore: 72, passRate: 68, attempts: 245 },
  { exam: "Web Dev", avgScore: 78, passRate: 75, attempts: 198 },
  { exam: "OS", avgScore: 65, passRate: 58, attempts: 210 },
  { exam: "DBMS", avgScore: 70, passRate: 62, attempts: 180 },
  { exam: "Networks", avgScore: 68, passRate: 60, attempts: 156 },
]

export const riskDistribution = [
  { range: "0-20", count: 180, label: "Low Risk" },
  { range: "21-40", count: 95, label: "Moderate" },
  { range: "41-60", count: 45, label: "Medium" },
  { range: "61-80", count: 20, label: "High" },
  { range: "81-100", count: 8, label: "Critical" },
]
