import { useState } from 'react'
import useAuthKit from '@/hooks/useAuthKit'
import useSafeSigner from '@/hooks/useSafeSigner';
import useDealModule from '@/hooks/useDealModule';
import axios from 'axios';
import CreateDeal from '@/components/CreateDeal';
import useSafeWallet from '@/hooks/useSafeWallet';
import * as ethers from 'ethers';

export default function Home() {

	const  { safeAuth } = useAuthKit()
    const { createSafeWallet } = useSafeWallet()
    const { getSafeSigner } = useSafeSigner()
    const { approveDeal, initDeal, startDeal, updateDeal, getDeal, getFlow } = useDealModule()
    const [user, setUser] = useState<string>('')

    async function handleSignIn() {
		if (safeAuth) {
			const response = await safeAuth.signIn();
			console.log(response.eoa, response);
            setUser(response.eoa);
            const safeSigner = await getSafeSigner(safeAuth)
            console.log(safeSigner)
            if(!safeSigner) return
            const gnosisSafe = await createSafeWallet(safeSigner)
            console.log(gnosisSafe)
            const influencer = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
            const flowRate = 1000000000
            const tweetId = ethers.utils.formatBytes32String("123456");
            await approveDeal(safeSigner, gnosisSafe, influencer, flowRate);
            await initDeal(safeSigner, gnosisSafe, influencer, tweetId);
            await startDeal(safeSigner, gnosisSafe, influencer, tweetId, flowRate);
            await getDeal(safeSigner, gnosisSafe, influencer);
            await getFlow(safeSigner, gnosisSafe, influencer);
            await updateDeal(safeSigner, gnosisSafe, influencer);
            await getDeal(safeSigner, gnosisSafe, influencer);
            await getFlow(safeSigner, gnosisSafe, influencer);
            await updateDeal(safeSigner, gnosisSafe, influencer);
            await getDeal(safeSigner, gnosisSafe, influencer);
            await getFlow(safeSigner, gnosisSafe, influencer);
            await updateDeal(safeSigner, gnosisSafe, influencer);
            await getDeal(safeSigner, gnosisSafe, influencer);
            await getFlow(safeSigner, gnosisSafe, influencer);
		};
	}

    async function handleSignOut() {
        if (safeAuth) {
            await safeAuth.signOut();
        };
    }

    return (
        <>
            <h1>Hey</h1>
            <button
                onClick={() => {
                    console.log('clicked')
					handleSignIn()
                }}
            >Sign In</button>

            {user && user.length ?
                <CreateDeal enterprise={user} enterpriseEmail={user} />
            : null}
        </>
    )
}
