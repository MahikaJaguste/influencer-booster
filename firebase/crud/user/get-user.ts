import {
	collection,
    doc,
    getDoc,
} from "firebase/firestore";
import db from "../../config";
import {
    IUser,
} from "../../types";


export async function GetUser(
    eoa: string
): Promise<{
    user: IUser | null;
	success: boolean;
	error?: string;
}> {
	let success = false,
		error = "",
        user = null;

    const collectionName = "users";
    const ref = collection(db, collectionName);

    const docRef = doc(db, collectionName, eoa);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return {
            user,
            success,
            error: "No such document!",
        }
    }

    const user_ = docSnap.data();
    user = {
        eoa: user_.eoa,
        gnosisSafeAddress: user_.gnosisSafeAddress,
        createdAt: user_.createdAt,
        updatedAt: user_.updatedAt,
        id: docSnap.id,
    }
    
    return {
        user,
        success: true,
        error,
    }
    
}