import { useState } from 'react'
import { IUser } from '@/firebase/types';

export default function CreateDeal({
    enterprise,
}: {
    enterprise: IUser
}) {

    const [influencerEmail, setInfluencerEmail] = useState<string>('')
    const [dealCategory, setDealCategory] = useState<string>('')
    const [dealInfo, setDealInfo] = useState<any>(null)
    const [dealPrice, setDealPrice] = useState<number>(0)
    const [dealDuration, setDealDuration] = useState<number>(0)


    async function createDeal() {
        if(enterprise) {
            
        }
    }


    return (
        <>
            <h1>Hey</h1>

            <input
                type="text"
                placeholder="Influencer Email"
                value={influencerEmail}
                onChange={(e) => setInfluencerEmail(e.target.value)}
            />

            <input

                type="text"
                placeholder="Deal Category"
                value={dealCategory}
                onChange={(e) => setDealCategory(e.target.value)}
            />

            <input
                type="text"
                placeholder="Deal Info"
                value={dealInfo}
                onChange={(e) => setDealInfo(e.target.value)}
            />

            <input
                type="number"
                placeholder="Deal Price"
                value={dealPrice}
                onChange={(e) => setDealPrice(Number(e.target.value))}
            />

            <input
                type="number"
                placeholder="Deal Duration"
                value={dealDuration}
                onChange={(e) => setDealDuration(Number(e.target.value))}
            />

            {enterprise ?
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
