import {
	collection,
	query,
    where,
    getDocs,
} from "firebase/firestore";
import db from "../../config";
import { 
    ICreateDealRequest,
    DealStatusEnum, 
    IDeal
} from "../../types";
import { nanoid } from 'nanoid'


export async function GetDeals(
    eoa: string,
    safeAddress: string,
): Promise<IDeal[]> {

    const collectionName = "deals";
    const ref = collection(db, collectionName);

    const q1 = query(
		ref,
		where("enterprise", "==", safeAddress),
	);

	const q2 = query(
		ref,
		where("influencer", "==", safeAddress),
		where("status", "==", DealStatusEnum.DealStarted),
	);

	let result: IDeal[] = [];

	const querySnapshot1 = await getDocs(q1);
	const querySnapshot2 = await getDocs(q2);

	const querySnapshot = [...querySnapshot1.docs, ...querySnapshot2.docs];

	querySnapshot.forEach((doc) => {
		const data = doc.data();
		result.push({
			enterprise: data.enterprise,
            influencer: data.influencer,
            flowRate: data.flowRate,
            paymentPlan: data.paymentPlan,
            durationSeconds: data.durationSeconds,
            status: data.status,
            unqiueCode: data.unqiueCode,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            id: doc.id,
		});
	});

	return result;

}