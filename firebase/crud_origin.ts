import {
	collection,
	addDoc,
	getDocs,
	query,
	where,
	doc,
	updateDoc,
	deleteDoc,
} from "firebase/firestore";
import db from "./config";
import { 
    ICreateDealRequest,
    DealStatusEnum, 
    IDeal
} from "./types";

const collectionName = "attestations";
const ref = collection(db, collectionName);

const enum StatusEnum {
    PreSign = "PreSign",
    Signed = "Signed",
    TransactionSent = "TransactionSent",
    TransactionConfirmed = "TransactionConfirmed",
}

interface IAttestation {
    creator: string;
    about: string;
    key: string;
    key_bytes: string;
    value: string;
    value_bytes: string;
    createdAt: Date;
    updatedAt: Date;
    status: StatusEnum;
    txnHash?: string;
    signature?: string;
    docId?: string;
}

export async function GetInboxDocuments(address: string) {
	const q = query(
		ref,
		where("about", "==", address),
		where("status", "==", StatusEnum.PreSign),
	);

	let result: IAttestation[] = [];

	const querySnapshot = await getDocs(q);
	// console.log(querySnapshot)
	querySnapshot.forEach((doc) => {
		const data = doc.data();
		result.push({
			creator: data.creator,
			about: data.about,
			key: data.key,
			key_bytes: data.key_bytes,
			value: data.value,
			value_bytes: data.value_bytes,
			createdAt: data.createdAt,
			updatedAt: data.updatedAt,
			status: data.status,
			docId: doc.id,
		});
	});

	return result;
}

export async function GetOutboxDocuments(address: string) {
	const q1 = query(
		ref,
		where("creator", "==", address),
		where("status", "==", StatusEnum.PreSign),
	);

	const q2 = query(
		ref,
		where("creator", "==", address),
		where("status", "==", StatusEnum.Signed),
	);

	let result: IAttestation[] = [];

	const querySnapshot1 = await getDocs(q1);
	const querySnapshot2 = await getDocs(q2);

	const querySnapshot = [...querySnapshot1.docs, ...querySnapshot2.docs];

	querySnapshot.forEach((doc) => {
		const data = doc.data();
		result.push({
			creator: data.creator,
			about: data.about,
			key: data.key,
			key_bytes: data.key_bytes,
			value: data.value,
			value_bytes: data.value_bytes,
			createdAt: data.createdAt,
			updatedAt: data.updatedAt,
			status: data.status,
			signature: data.signature,
			docId: doc.id,
		});
	});

	return result;
}

export async function GetSentTxns(address: string) {
	const q1 = query(
		ref,
		where("about", "==", address),
		where("status", "==", StatusEnum.TransactionSent),
	);

	const q2 = query(
		ref,
		where("creator", "==", address),
		where("status", "==", StatusEnum.TransactionSent),
	);

	let result: IAttestation[] = [];

	const querySnapshot1 = await getDocs(q1);
	const querySnapshot2 = await getDocs(q2);

	const querySnapshot = [...querySnapshot1.docs, ...querySnapshot2.docs];

	querySnapshot.forEach((doc) => {
		const data = doc.data();
		result.push({
			creator: data.creator,
			about: data.about,
			key: data.key,
			key_bytes: data.key_bytes,
			value: data.value,
			value_bytes: data.value_bytes,
			createdAt: data.createdAt,
			updatedAt: data.updatedAt,
			status: data.status,
			signature: data.signature,
			txnHash: data.txnHash,
			docId: doc.id,
		});
	});

	// remove duplicate docId elements from result
	result = result.filter(
		(thing, index, self) =>
			index === self.findIndex((t) => t.docId === thing.docId),
	);

	return result;
}

export async function AddSignature(docId: string, signature: string) {
	const docRef = doc(ref, docId);

	await updateDoc(docRef, {
		signature: signature,
		status: StatusEnum.Signed,
		updatedAt: new Date(),
	});
}

export async function AddTxnHash(docId: string, txnHash: string) {
	const docRef = doc(ref, docId);

	await updateDoc(docRef, {
		txnHash: txnHash,
		status: StatusEnum.TransactionSent,
		updatedAt: new Date(),
	});
}

// write a function to delete a document given its docId
export async function DeleteDocument(docId: string) {
	const docRef = doc(ref, docId);
	await deleteDoc(docRef);
}