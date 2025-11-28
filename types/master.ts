export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ClassData {
  id: string;
  name: string;
  level: number;
  waliKelasId: string | null;
}

export interface SubjectData {
  id: string;
  name: string;
  code: string;
}

export interface ScheduleData {
  id: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

export type AttendanceStatus = "Hadir" | "Sakit" | "Izin" | "Alpha";

export interface AttendanceRecord {
  id: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  date: string;
  records: {
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
  }[];
}

export type AssessmentType = "Tugas Harian" | "UTS" | "UAS" | "Lainnya";

export interface GradeRecord {
  id: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  assessmentType: AssessmentType;
  assessmentName: string;
  date: string;
  scores: { [studentId: string]: number | null };
}

export interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  authorId: string; 
  authorName: string;
  date: string;
  targetRole: "all" | "siswa";
}

export interface GradeSettings {
  id: string;
  academicYearId: string;
  tugasPercentage: number;
  utsPercentage: number;
  uasPercentage: number;
  lainnyaPercentage?: number;
  absencePercentage?: number;
  updatedAt: string;
}
