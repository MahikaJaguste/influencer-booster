import { Card, CardContent, Typography} from '@mui/material';
import Image from 'next/image'

export default function About() {

    return (

        <Card sx={{ minWidth: 1000, marginLeft: 25, marginRight: 50 }} elevation={10}>
        <CardContent>
            <div style={{textAlign: "center", }}>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom paddingLeft={10} paddingRight={10}>
                <h3>Influencer-Booster is a marketing streaming protocol which enables trustless deals between enterprises 
                    and influencers with payment based on performance and impact.</h3>
                </Typography>
                <Image src="/faq.png"  alt="influencer-booster-about" width={600} height={400} />
            </div>
        </CardContent>
        </Card>
    )
}
