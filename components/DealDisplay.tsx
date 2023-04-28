import { useEffect, useState } from 'react'
import ethers from 'ethers'
import { IUser } from '@/firebase/types';
import { GetDeals } from '@/firebase/crud';
import { IDeal } from '@/firebase/types';
import useDealModule from '@/hooks/useDealModule';
import useSafeWallet from '@/hooks/useSafeWallet';

export default function DealDisplay({
    user,
    userSigner
}: {
    user: IUser | undefined
    userSigner: ethers.providers.JsonRpcSigner | undefined
}) {


    const [influencer, setInfluencer] = useState<string>('')
    const [flowRate, setFlowRate] = useState<number>(0)
    const [paymentPlan, setPaymentPlan] = useState<number>(0)
    const [durationSeconds, setDurationSeconds] = useState<number>(0)
    const { updateDeal, getBalance } = useDealModule()
    const { getSafe } = useSafeWallet()

    const [deals, setDeals] = useState<IDeal[]>([])


    async function getDeals(user: IUser){
        const deals_ = await GetDeals(user.eoa, user.gnosisSafeAddress)
        setDeals(deals_)  
    }

    async function updateDeal_(deal: IDeal){
        if(!user || !userSigner) {
            alert('Sign in to execute deal')
            return
        }
        if(!deal) {
            alert('Please enter deal unique code first.')
            return
        }
        const safe = await getSafe(userSigner, deal.enterprise)
        await updateDeal(userSigner, safe, deal.influencer);
    }

    async function refreshBalance() {
        if(!user || !userSigner) {
            alert('Sign in to execute deal')
            return
        }
        await getBalance(userSigner, user.gnosisSafeAddress)
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
                                <button onClick={() => updateDeal_(deal)}>Update Deal</button>
                                <button onClick={() => refreshBalance()}>Refresh Balance</button>
                            </li>
                        ))}
                    </ul>
                </>
            )
            : <p>Sign In to start deal</p>}
        </>
    )
}
