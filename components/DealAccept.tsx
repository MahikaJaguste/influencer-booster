import { useEffect, useState } from 'react'
import * as ethers from 'ethers'
import { IDeal, IUser } from '@/firebase/types';
import { AcceptDeal, UpdateDeal, InitDeal } from '@/firebase/crud';
import useDealModule from '@/hooks/useDealModule';
import useSafeWallet from '@/hooks/useSafeWallet';
import { DealStatusEnum } from '@/firebase/types';
import { Button, Card, CardContent, LinearProgress, TextField } from '@mui/material';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import axios from 'axios';

export default function DealAccept({
    user,
    userSigner,
}: {
    user: IUser | undefined,
    userSigner: ethers.providers.JsonRpcSigner | undefined,
}) {

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const { initDeal, startDeal, getFlow } = useDealModule()
    const { getSafe } = useSafeWallet()

    const [uniqueCode, setUniqueCode] = useState<string>('')
    const [deal, setDeal] = useState<IDeal>()
    const [tweetId, setTweetId] = useState<string>('')

    async function verifyTweet(tweetId: string, influencerTwitterHandle: string, twitterHandle: string): Promise<boolean> {

        if(process.env.NEXT_PUBLIC_RAPID_API_KEY == undefined) {
            alert('Please set RAPID_API_KEY in .env.local')
            return false
        }
        const options = {
            method: 'POST',
            url: 'https://twitter154.p.rapidapi.com/tweet/details',
            headers: {
              'content-type': 'application/json',
              'X-RapidAPI-Key': '507a95299dmsh00933f03fc6a9abp1352a7jsn640a21f36a18',
              'X-RapidAPI-Host': 'twitter154.p.rapidapi.com'
            },
            data: {
              tweet_id: tweetId
            }
        };
          
        let res;
        try {
            res = await axios.request(options);
            console.log(res.data);
        } catch (error) {
            alert('Error fetching tweet')
            return false
        }
        
        if(!res.data){
            alert('Error fetching tweet')
            return false
        }

        const tweet = res.data['text']?.toLowerCase()
        const tweeter = res.data['user']['username']

        if(tweeter.toLowerCase() === influencerTwitterHandle.toLowerCase() && tweet.includes(twitterHandle.toLowerCase())) {
            return true
        }
        return false
    }

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
        if(deal.status === DealStatusEnum.DealStarted) {
            alert('Deal already started')
            return
        }
        setIsLoading(true)
        const isVerified = await verifyTweet(tweetId, deal.influencerTwitterHandle, deal.twitterHandle)
        if(!isVerified) {
            alert('Tweet does not match enterprise requirements.')
            return
        }
        const tweetId_ = ethers.utils.formatBytes32String(tweetId);
        const gnosisSafe = await getSafe(userSigner, user.gnosisSafeAddress);
        const safe = await getSafe(userSigner, deal.enterprise)
        await initDeal(userSigner, safe, deal.influencer, tweetId_);
        await startDeal(userSigner, safe, deal.influencer, tweetId_, deal.flowRate);
        await InitDeal(tweetId, deal.id)
        setDeal(undefined)
        setIsLoading(false)
        alert('Deal started successfully')
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
        { !deal ?
         <Card sx={{ minWidth: 275, marginLeft: 40, marginRight: 40 }} elevation={10}>
            <CardContent>
                <div style={{textAlign: "center", }}>
                <h2>Match a deal!</h2>
                &nbsp;
                <TextField
                    onChange={(e) => setUniqueCode(e.target.value)}
                    value={uniqueCode}
                    id="filled-basic"
                    label="Unique Code"
                    variant="standard"
                    size="small"
                    fullWidth={true}
                />
                <br />
                <br />
                <Button style={{textTransform: 'none'}} variant="outlined" hidden={isLoading} color="success" onClick={() => getDeal()}>
                    <ImportContactsIcon/> &nbsp; Get Deal
                </Button>
                </div>
            </CardContent>
        </Card> : null }

        { deal ? 
        <Card sx={{ minWidth: 275, marginLeft: 40, marginRight: 40 }} elevation={10}>
            <CardContent>
                <div style={{textAlign: "center", }}>
                    <h2>Deal Details</h2>
                    <p>Deal ID: {deal.uniqueCode}</p>
                    <p>Enterprise Safe: {deal.enterprise}</p>
                    <p>Enterprise Twitter Handle: {deal.twitterHandle}</p>
                    <p>Influencer Safe: {deal.influencer}</p>
                    <p>Influencer Twitter Handle: {deal.influencerTwitterHandle}</p>
                    <p>Flow Rate: {deal.flowRate} wei-DAIx per second</p>
                    <p>Duration: {deal.durationSeconds/86400} days</p>
                    <br />
                    <TextField
                        onChange={(e) => setTweetId(e.target.value)}
                        value={tweetId}
                        id="filled-basic"
                        label="Tweet ID"
                        variant="standard"
                        size="small"
                        fullWidth={true}
                    />
                    <br />
                    <br />
                    {isLoading && <span>
                        <LinearProgress color="success"/>
                        <br />
                    </span>}
                    <Button style={{textTransform: 'none'}} variant="outlined" hidden={isLoading} color="success" onClick={() => executeDeal()}>
                        <ImportContactsIcon/> &nbsp; Execute Deal
                    </Button>
                </div>
            </CardContent>
        </Card> : null }
    </>);
}
