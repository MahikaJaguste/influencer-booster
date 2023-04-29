import {
	collection,
	addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
} from "firebase/firestore";
import db from "../../config";
import { 
    ICreateDealRequest,
    DealStatusEnum, 
    IDeal
} from "../../types";
import { nanoid } from 'nanoid'

export async function CreateDeal(
    data: ICreateDealRequest
): Promise<{
    deal: IDeal | null;
	success: boolean;
	error?: string;
}> {
	let success = false,
		error = "",
        deal = null;

    const collectionName = "deals";
    const ref = collection(db, collectionName);

    const {
        enterprise,
        influencer,
        flowRate,
        paymentPlan,
        durationSeconds,
        twitterHandle,
        influencerTwitterHandle
    } = data;

    const uniqueCode = nanoid(6);

	await addDoc(ref, {
		enterprise,
        influencer,
        flowRate,
        paymentPlan,
        durationSeconds,
        twitterHandle,
        influencerTwitterHandle,
        status: DealStatusEnum.EnterpriseApproved,
        uniqueCode,
		createdAt: new Date(),
		updatedAt: new Date(),
	}).then((deal_) => {
			success = true;
            deal = {
                id: deal_.id,
                ...data
            }
		})
		.catch((err) => {
			success = false;
			error = err;
		});

	return {
        deal,
		success,
		error,
	};
}

export async function AcceptDeal(
    uniqueCode: string,
    influencerSafeAddress: string,
): Promise<IDeal| null> {

    const collectionName = "deals";
    const ref = collection(db, collectionName);

    const q1 = query(
		ref,
		where("influencer", "==", influencerSafeAddress),
        where("uniqueCode", "==", uniqueCode),
        where("status", "==", DealStatusEnum.EnterpriseApproved),
	);

	let result: IDeal[] = [];

	const querySnapshot = await getDocs(q1);

	querySnapshot.forEach((doc) => {
		const data = doc.data();
		result.push({
			enterprise: data.enterprise,
            influencer: data.influencer,
            influencerTwitterHandle: data.influencerTwitterHandle,
            flowRate: data.flowRate,
            paymentPlan: data.paymentPlan,
            durationSeconds: data.durationSeconds,
            twitterHandle: data.twitterHandle,
            status: data.status,
            uniqueCode: data.uniqueCode,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            id: doc.id,
		});
	});

    if(!result.length) return null;

    return result[0];
}

export async function InitDeal(
    tweetId: string,
    dealId: string,
) {
    const collectionName = "deals";
    const ref = collection(db, collectionName);
    await updateDoc(doc(ref, dealId), {
        tweetId: tweetId,
        status: DealStatusEnum.DealStarted,
        updatedAt: new Date(),
    });
}

export async function UpdateDeal(
    dealId: string,
    flowRate: number,
) {
    const collectionName = "deals";
    const ref = collection(db, collectionName);
    await updateDoc(doc(ref, dealId), {
        flowRate: flowRate,
        updatedAt: new Date(),
    });
}