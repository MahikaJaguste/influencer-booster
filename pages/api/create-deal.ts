import type { NextApiRequest, NextApiResponse } from 'next'
import { CreateDeal } from '@/firebase/crud';
import { ICreateDealRequest } from '@/firebase/types';


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if(req.method === 'POST') {
        const {deal, success, error} = await CreateDeal(req.body as ICreateDealRequest);
        if(success) {
            res.status(200).json({ deal })
        }
        res.status(400).json({ error })
    } else {
        res.status(404).json({ error: 'Not Found' })
    }
}

// deal written to db
// acl given by safe to booster contract
// safe is funded by enterprise
// upgrade to fdaix
// when influencer signs, stream started by booster contract
