import { useEffect, useState } from 'react'
import ethers from 'ethers'
import { IUser } from '@/firebase/types';
import { GetDeals } from '@/firebase/crud';
import { IDeal } from '@/firebase/types';
import useDealModule from '@/hooks/useDealModule';
import useSafeWallet from '@/hooks/useSafeWallet';

export default function DealDisplay({
    user,
}: {
    user: IUser | undefined
}) {


    const [influencer, setInfluencer] = useState<string>('')
    const [flowRate, setFlowRate] = useState<number>(0)
    const [paymentPlan, setPaymentPlan] = useState<number>(0)
    const [durationSeconds, setDurationSeconds] = useState<number>(0)
    const { approveDeal } = useDealModule()
    const { getSafe } = useSafeWallet()

    const [deals, setDeals] = useState<IDeal[]>([])


    async function getDeals(user: IUser){
        const deals_ = await GetDeals(user.eoa, user.gnosisSafeAddress)
        setDeals(deals_)  
    }

    useEffect(() => {
        if(user)
            getDeals(user)
    }, [user]);


    return (
        <>
            <h2>Display Deals</h2>
            {user ? (
                <>
                    <p>Deals:</p>
                    <ul>
                        {deals.map((deal) => (
                            <li key={deal.id}>
                                <p>Deal ID: {deal.unqiueCode}</p>
                                <p>Flow Rate: {deal.flowRate}</p>
                                <p>Payment Plan: {deal.paymentPlan}</p>
                                <p>Duration: {deal.durationSeconds}</p>
                                <p>Influencer Safe: {deal.influencer}</p>
                                <p>Enterprise: {deal.enterprise}</p>
                                <p>Status: {deal.status}</p>
                            </li>
                        ))}
                    </ul>
                </>
            )
            : <p>Sign In to start deal</p>}
        </>
    )
}
