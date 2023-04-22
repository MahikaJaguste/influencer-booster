export interface ICreateDealRequest {
    enterprise: string;
    enterpriseEmail: string;
    influencerEmail: string;
    dealCategory: string;
    dealInfo: any,
    dealPrice: number;
    dealDuration: number;
}

export interface ICreateUserRequest {
    eoa: string;
    gnosisSafeAddress: string;
}

export enum DealStatusEnum {
    EnterpriseCreated = "EnterpriseCreated",
}

export interface IDeal {
    id: string;
    enterprise: string;
    enterpriseEmail: string;
    influencer?: string;
    influencerEmail: string;
    dealCategory: string;
    dealInfo: any,
    dealPrice: number;
    dealDuration: number;
    status: DealStatusEnum;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUser {
    id: string;
    eoa: string;
    gnosisSafeAddress: string;
    createdAt: Date;
    updatedAt: Date;
}