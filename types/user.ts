export type UserRole = "admin" | "guru" | "siswa";

export interface BaseUser {
  uid: string;
  email: string;
  nama: string;
  role: UserRole;
  academicYearId: string;
}

export interface Admin extends BaseUser {
  role: "admin";
}

export interface Guru extends BaseUser {
  role: "guru";
  nip: string;
  mapelIds: string[];
  kelasWaliIds: string[];
}

export interface Siswa extends BaseUser {
  role: "siswa";
  nis: string;
  kelasId: string; 
}

export type User = Admin | Guru | Siswa;
