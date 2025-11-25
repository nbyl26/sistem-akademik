import { Admin, BaseUser, Guru, Siswa, User } from "@/types/user";

export async function mapUserRole(rawUser: BaseUser): Promise<User | null> {
  const role = rawUser.role;

  switch (role) {
    case "admin":
      return rawUser as Admin;
    case "guru":
      return rawUser as Guru;
    case "siswa":
      return rawUser as Siswa;
    default:
      return null;
  }
}
