
export interface AcademicYear {
  id: string; // ID Firestore (non-optional setelah fetch)
  name: string; // Contoh: 2025/2026 Ganjil
  startDate: string; // ISO Date String
  endDate: string; // ISO Date String
  isActive: boolean;
}

export interface ClassData {
  id: string; // ID Firestore (non-optional setelah fetch)
  name: string; // Contoh: X RPL 1
  level: number; // Contoh: 10, 11, 12
  waliKelasId: string | null; // UID Guru
}

export interface SubjectData {
  id: string; // ID Firestore (non-optional setelah fetch)
  name: string; // Contoh: Matematika Wajib
  code: string; // Contoh: MTK-01
}

// --- 2. Transaksional Data Interfaces ---

export interface ScheduleData {
  id: string; // ID Firestore (non-optional setelah fetch)
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  day: string; // 'Senin', 'Selasa', etc.
  startTime: string;
  endTime: string;
  room: string; // E.g., 'Lab Komp 1'
}

// --- 3. Absensi Data ---

export type AttendanceStatus = "Hadir" | "Sakit" | "Izin" | "Alpha";

export interface AttendanceRecord {
  id: string; // ID Firestore (non-optional setelah fetch)
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  records: {
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
  }[];
}

export type AssessmentType = "Tugas Harian" | "UTS" | "UAS" | "Lainnya";

export interface GradeRecord {
  id: string; // ID Firestore (non-optional setelah fetch)
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  assessmentType: AssessmentType;
  assessmentName: string; // Nama spesifik (e.g., 'Tugas 1 Bab Trigonometri')
  date: string; 

  scores: { [studentId: string]: number | null };
}
