import { useState } from 'react'
import ethers from 'ethers'
import { IUser } from '@/firebase/types';
import { CreateDeal } from '@/firebase/crud';
import useDealModule from '@/hooks/useDealModule';
import useSafeWallet from '@/hooks/useSafeWallet';

export default function DealCreation({
    enterprise,
    enterpriseSigner,
}: {
    enterprise: IUser | undefined,
    enterpriseSigner: ethers.providers.JsonRpcSigner | undefined,
}) {


    const [influencer, setInfluencer] = useState<string>('')
    const [flowRate, setFlowRate] = useState<number>(0)
    const [paymentPlan, setPaymentPlan] = useState<number>(0)
    const [durationSeconds, setDurationSeconds] = useState<number>(0)
    const { approveDeal } = useDealModule()
    const { getSafe } = useSafeWallet()


    async function createDeal() {
        if(enterprise && enterpriseSigner) {
            const gnosisSafe = await getSafe(enterpriseSigner, enterprise.gnosisSafeAddress)
            // await approveDeal(enterpriseSigner, gnosisSafe, influencer, flowRate);
            const deal = await CreateDeal({
                enterprise: enterprise.eoa,
                influencer,
                flowRate,
                paymentPlan,
                durationSeconds,
            })
        }
    }


    return (
        <>
            <h2>Create Deal</h2>
            <label>Influencer:</label>
            <input
                type="text"
                placeholder="Influencer Address"
                value={influencer}
                onChange={(e) => setInfluencer(e.target.value)}
            />

            <label>Flow rate (per second):</label>
            <input
                type="number"
                placeholder="Flow rate (per second)"
                value={flowRate}
                onChange={(e) => setFlowRate(Number(e.target.value))}
            />

            <label>Deal duration (in days):</label>
            <input
                type="number"
                placeholder="Deal duration (in days)"
                value={durationSeconds/86400}
                onChange={(e) => setDurationSeconds(Number(e.target.value) * 86400)}
            />

            <label>Payment plan:</label>
            <input
                type="number"
                placeholder="Payment plan"
                value={paymentPlan}
                onChange={(e) => setPaymentPlan(Number(e.target.value))}
            />

            {enterprise && enterpriseSigner ?
                <button
                    onClick={() => {
                        console.log('clicked')
                        createDeal()
                    }}
                >Create Deal</button>

            : <p>Sign In to start deal</p>}
        </>
    )
}
