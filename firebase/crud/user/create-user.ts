import {
	collection,
	doc,
    setDoc
} from "firebase/firestore";
import db from "../../config";
import { 
    ICreateUserRequest,
    IUser,
} from "../../types";


export async function CreateUser(
    data: ICreateUserRequest
): Promise<{
    user: IUser;
    success: boolean;
    error?: string;
}> {

    let success = false,
    error = "",
    user = null;

    const collectionName = "users";
    const ref = collection(db, collectionName);

    const {
        eoa,
        gnosisSafeAddress,
    } = data;

    await setDoc(doc(ref, eoa), {
        eoa,
        gnosisSafeAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return {
        user: {
            ...data,
            id: eoa,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        success: true,
        error,
    }
}