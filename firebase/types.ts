export interface ICreateDealRequest {
    enterprise: string;
    influencer: string;
    flowRate: number;
    paymentPlan: number,
    durationSeconds: number;
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
    flowRate: number;
    paymentPlan: number,
    durationSeconds: number;
    status: DealStatusEnum;
    unqiueCode: string;
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