// This example shows how to make call an API using a secret key and return the result as a uint256

// Arguments can be provided when a request is initated on-chain and used in the request source code as shown below
const tweet_id = args[0]

if (
  !secrets.apiKey ||
  secrets.apiKey === "Invalid API key. Go to https://docs.rapidapi.com/docs/keys for more info."
) {
  throw Error(
    "RAPID_API_KEY environment variable not set for Rapid API.  Get a free key."
  )
}

// build HTTP request object

const twitterRequest = Functions.makeHttpRequest({
  method: "GET",
  url: `https://twitter154.p.rapidapi.com/tweet/details`,
  params: {tweet_id: tweet_id},
  headers: {
    "X-RapidAPI-Key": secrets.apiKey,
    "X-RapidAPI-Host": "twitter154.p.rapidapi.com"
  },
})

// Make the HTTP request
// const twitterResponse = await twitterRequest

if (twitterResponse.error) {
  throw new Error("Twitter Rapid API Error: " + twitterResponse.error)
}

// fetch the likes from the response
const likes = twitterResponse.data["favorite_count"]

console.log(`Likes: ${likes}`)

// price * 100 to move by 2 decimals (Solidity doesn't support decimals)
// Math.round() to round to the nearest integer
// Functions.encodeUint256() helper function to encode the result from uint256 to bytes
// return Functions.encodeUint256(likes)

/*
{
  tweet_id: '1517995317697916928',
  creation_date: 'Sat Apr 23 22:34:21 +0000 2022',
  text: 'Sometimes you know an exception can be thrown, and you just want to ignore it. Take advantage of the context manager, which allows you to allocate and release resources.\n' +
    '\n' +
    "Use “ignore instead”. Here's a full code example:\n" +
    '\n' +
    'Credits to: @raymondh https://t.co/ACw677xTtN',
  media_url: [ 'https://pbs.twimg.com/media/FREAsbkXIAYiaVV.jpg' ],
  video_url: null,
  user: {
    creation_date: 'Sun Dec 13 03:52:21 +0000 2009',
    user_id: '96479162',
    username: 'omarmhaimdat',
    name: 'Omar MHAIMDAT',
    follower_count: 951,
    following_count: 1206,
    favourites_count: 6239,
    is_private: false,
    is_verified: false,
    is_blue_verified: false,
    location: 'Casablanca, Morocco',
    profile_pic_url: 'https://pbs.twimg.com/profile_images/1271521722945110016/AvKfKpLo_normal.jpg',
    profile_banner_url: 'https://pbs.twimg.com/profile_banners/96479162/1599303392',
    description: 'Data Scientist | Software Engineer | Better programming and Heartbeat contributor',
    external_url: 'https://www.linkedin.com/in/omarmhaimdat/',
    number_of_tweets: 3161,
    bot: false,
    timestamp: 1260676341,
    has_nft_avatar: false,
    category: null,
    default_profile: null,
    default_profile_image: null
  },
  language: 'en',
  favorite_count: 16,
  retweet_count: 1,
  reply_count: 2,
  quote_count: 0,
  retweet: false,
  views: null,
  timestamp: 1650753261,
  video_view_count: null,
  in_reply_to_status_id: null,
  quoted_status_id: null,
  binding_values: null,
  expanded_url: 'https://twitter.com/omarmhaimdat/status/1517995317697916928/photo/1',
  retweet_tweet_id: null,
  extended_entities: { media: [ [Object] ] },
  conversation_id: '1517995317697916928'
}
*/