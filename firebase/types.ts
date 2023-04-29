export interface ICreateDealRequest {
    enterprise: string;
    influencer: string;
    influencerTwitterHandle: string;
    flowRate: number;
    paymentPlan: number,
    durationSeconds: number;
    twitterHandle: string;
}

export interface ICreateUserRequest {
    eoa: string;
    gnosisSafeAddress: string;
}

export enum DealStatusEnum {
    EnterpriseApproved = "EnterpriseApproved",
    DealStarted = "DealStarted",
}

export interface IDeal {
    id: string;
    enterprise: string;
    influencer: string;
    influencerTwitterHandle: string;
    flowRate: number;
    paymentPlan: number,
    durationSeconds: number;
    twitterHandle: string;
    status: DealStatusEnum;
    uniqueCode: string;
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