import { Siswa } from "@/types/user";

export default function SiswaDashboard({user} : {user: Siswa}){
    return(
        <div>
            <h1>Hello siswa ku {user.nama}</h1>
        </div>
    )
}