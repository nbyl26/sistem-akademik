export type UserRole = "admin" | "guru" | "siswa";

export interface BaseUser {
  uid: string;
  email: string;
  nama: string;
  role: UserRole;
}

export interface Admin extends BaseUser {
  role: "admin";
}

export interface Guru extends BaseUser {
  role: "guru";
  nip: string;
  mataPelajaran: string;
  kelasId: string;
}

export interface Siswa extends BaseUser {
  role: "siswa";
  nis: string;
  kelasId: string;
  currentSemester: number;
}

export type User = Admin | Guru | Siswa;
