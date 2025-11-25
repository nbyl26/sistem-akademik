import { BaseUser } from "@/types/user";
import jwt from "jsonwebtoken";

export async function verifyCookie(token : string) : Promise<BaseUser | null> {
    try {
        const payload = jwt.verify(token, process.env.JWT_KEY!);
    
        return payload as BaseUser;
    } catch (error) {
        console.log("Token invalid")
        return null
    }
}