import { useState } from 'react'
import * as ethers from 'ethers'
import { IDeal, IUser } from '@/firebase/types';
import { AcceptDeal, CreateDeal, InitDeal } from '@/firebase/crud';
import useDealModule from '@/hooks/useDealModule';
import useSafeWallet from '@/hooks/useSafeWallet';

export default function DealAccept({
    user,
    userSigner,
}: {
    user: IUser | undefined,
    userSigner: ethers.providers.JsonRpcSigner | undefined,
}) {

    const { initDeal, startDeal, getFlow } = useDealModule()
    const { getSafe } = useSafeWallet()

    const [uniqueCode, setUniqueCode] = useState<string>('')
    const [deal, setDeal] = useState<IDeal>()
    const [tweetId, setTweetId] = useState<string>('')


    async function getDeal() {
        if(user && userSigner) {
            const deal = await AcceptDeal(uniqueCode, user.gnosisSafeAddress)
            if(!deal) {
                alert('Deal not found')
                return
            }
            setDeal(deal) 
        }
        else {
            alert('Sign in to accept deal')
        }
    }

    async function executeDeal() {
        if(!user || !userSigner) {
            alert('Sign in to execute deal')
            return
        }
        if(!deal) {
            alert('Please enter deal unique code first.')
            return
        }
        if(!tweetId) {
            alert('Please enter tweet id first.')
            return
        }
        const tweetId_ = ethers.utils.formatBytes32String(tweetId);
        const gnosisSafe = await getSafe(userSigner, user.gnosisSafeAddress);
        const safe = await getSafe(userSigner, deal.enterprise)
        await initDeal(userSigner, safe, deal.influencer, tweetId_);
        await startDeal(userSigner, safe, deal.influencer, tweetId_, deal.flowRate);
        await InitDeal(tweetId, deal.id)
    }


    async function getFlowRate() {
        if(!user || !userSigner) {
            alert('Sign in to execute deal')
            return
        }
        if(!deal) {
            alert('Please enter deal unique code first.')
            return
        }
        const safe = await getSafe(userSigner, deal.enterprise)
        const r = await getFlow(userSigner, safe, deal?.influencer)
        console.log(r)
    }

    return (
        <>
            <h2>Accept Deal</h2>
            <label>Unique Code:</label>
            <input
                type="text"
                placeholder="Unique Code"
                value={uniqueCode}
                onChange={(e) => setUniqueCode(e.target.value)}
            />


            {user && userSigner ?
                <button
                    onClick={() => {
                        console.log('clicked')
                        getDeal()
                    }}
                >Accept Deal</button>

            : <p>Sign In to accpet deal</p>}

            {deal ? <li key={deal.id}>
                <p>Deal ID: {deal.unqiueCode}</p>
                <p>Flow Rate: {deal.flowRate}</p>
                <p>Payment Plan: {deal.paymentPlan}</p>
                <p>Duration: {deal.durationSeconds}</p>
                <p>Influencer Safe: {deal.influencer}</p>
                <p>Enterprise: {deal.enterprise}</p>
                <p>Status: {deal.status}</p>
            </li>
            : null }


            <label>Tweet ID:</label>
            <input
                type="text"
                placeholder="Tweet ID"
                value={tweetId}
                onChange={(e) => setTweetId(e.target.value)}
            />

            {user && userSigner ?
                <button
                    onClick={() => {
                        console.log('clicked')
                        executeDeal()
                    }}
                >Create Deal</button>

            : <p>Sign In to start deal</p>}

            {user && userSigner ?
                <button
                    onClick={() => {
                        getFlowRate()
                    }}
                >Get flow rate</button>

            : <p>Sign In to start deal</p>}

        </>
    )
}
