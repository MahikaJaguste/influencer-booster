import {
	collection,
	addDoc,
} from "firebase/firestore";
import db from "../../config";
import { 
    ICreateDealRequest,
    DealStatusEnum, 
    IDeal
} from "../../types";


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
        enterpriseEmail,
        influencerEmail,
        dealCategory,
        dealInfo,
        dealPrice,
        dealDuration,
    } = data;

	await addDoc(ref, {
		enterprise,
        enterpriseEmail,
        influencerEmail,
        dealCategory,
        dealInfo,
        dealPrice,
        dealDuration,
        status: DealStatusEnum.EnterpriseCreated,
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