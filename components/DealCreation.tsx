import { useState } from 'react'
import ethers from 'ethers'
import { IUser } from '@/firebase/types';
import { CreateDeal } from '@/firebase/crud';
import useDealModule from '@/hooks/useDealModule';
import useSafeWallet from '@/hooks/useSafeWallet';
import { Card, CardContent, TextField, LinearProgress, Button } from '@mui/material';
import  AddCircleOutlineIcon  from '@mui/icons-material/AddCircleOutline';
import { SafeAuthKit } from '@safe-global/auth-kit';

export default function DealCreation({
    enterprise,
    enterpriseSigner,
    safeAuth,
}: {
    enterprise: IUser | undefined,
    enterpriseSigner: ethers.providers.JsonRpcSigner | undefined,
    safeAuth: SafeAuthKit<any> | undefined,
}) {


    const [influencer, setInfluencer] = useState<string>('')
    const [flowRate, setFlowRate] = useState<number>()
    const [paymentPlan, setPaymentPlan] = useState<number>(1)
    const [durationSeconds, setDurationSeconds] = useState<number>()
    const [twitterHandle, setTwitterHandle] = useState<string>('')
    const [influencerTwitterHandle, setInfluencerTwitterHandle] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const { approveDeal, getDaiBalance } = useDealModule()
    const { getSafe } = useSafeWallet()


    async function createDeal() {
        if(enterprise && enterpriseSigner) {
            if(!(influencer.length && flowRate && paymentPlan && durationSeconds && twitterHandle.length && influencerTwitterHandle.length)){
                alert("Please fill in all fields.")
                return;
            }
            setIsLoading(true)
            const balance = await getDaiBalance(enterpriseSigner, enterprise.gnosisSafeAddress)
            if(parseFloat(balance) < flowRate * durationSeconds) {
                alert("Insufficient balance. Please deposit DAI into your Safe first.")
                setIsLoading(false)
                return;
            }
            const gnosisSafe = await getSafe(enterpriseSigner, enterprise.gnosisSafeAddress)
            await approveDeal(enterpriseSigner, gnosisSafe, influencer, flowRate);
            const deal = await CreateDeal({
                enterprise: enterprise.gnosisSafeAddress,
                influencer,
                flowRate,
                paymentPlan,
                durationSeconds,
                twitterHandle,
                influencerTwitterHandle,
            })
            setIsLoading(false)
            alert("Deal created successfully!")
        }
        else {
            alert("Please sign in first.")
        }
    }


    return (

        <Card sx={{ minWidth: 275, marginLeft: 40, marginRight: 40 }} elevation={10}>
        <CardContent>
        <div style={{textAlign: "center", }}>
        <h2>Kickstart your marketing!</h2>
        <TextField
            onChange={(e) => setInfluencer(e.target.value)}
            value={influencer}
            id="filled-basic"
            label="Influencer Safe address"
            variant="standard"
            size="small"
            fullWidth={true}
        />
        <br />
        <br />
        <TextField
            onChange={(e) => setInfluencerTwitterHandle(e.target.value)}
            value={influencerTwitterHandle}
            id="filled-basic"
            label="Influencer Twitter handle"
            variant="standard"
            size="small"
            fullWidth={true}
        />
        <br />
        <br />
        <TextField
            onChange={(e) => setFlowRate(Number(e.target.value))}
            value={flowRate}
            id="filled-basic"
            label="Flow rate (per second)"
            variant="standard"
            size="small"
            fullWidth={true}

        />
        <br />
        <br />
        <TextField
            onChange={(e) => setDurationSeconds(Number(e.target.value) * 86400)}
            value={durationSeconds ? durationSeconds/86400 : durationSeconds}
            id="filled-basic"
            label="Deal duration (in days)"
            variant="standard"
            size="small"
            fullWidth={true}
        />
        <br />
        <br />
        <TextField
            onChange={(e) => setTwitterHandle(e.target.value)}
            value={twitterHandle}
            id="filled-basic"
            label="Twitter handle to be included in the tweet"
            variant="standard"
            size="small"
            fullWidth={true}
        />
        <br />
        <br />
        {isLoading && <span>
            <LinearProgress color="success"/>
            </span>
        }
        <br />
        <Button style={{textTransform: 'none'}} variant="outlined" hidden={isLoading} color="success" onClick={() => createDeal()}>
            <AddCircleOutlineIcon/> &nbsp; Create
                </Button>
        </div>
    </CardContent>
    </Card>
    )
}
