import path from "path"
import jwt from 'jsonwebtoken'
import fs from 'fs'
import http2 from 'http2'
import { ActivityAttributes, Alert, ATTRIBUTE_TYPE, ContentState, EVENT } from "./types"

export const KEY_ID = "..."
export const TEAM_ID = "..."
export const BUNDLE_ID = "itsuki.enjoy...."

export const PRIVATE_KEY_FILE_NAME = "APN_PRIVATE_KEY.p8"
export const PRIVATE_KEY_PATH = path.resolve(__dirname, "..", PRIVATE_KEY_FILE_NAME)
export const PRIVATE_KEY = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8')
export const IS_PRODUCTION = false

const TOPIC = `${BUNDLE_ID}.push-type.liveactivity`
const PUSH_TYPE = "liveactivity"
const DEV_APN_SERVER = "https://api.development.push.apple.com:443"
// following sandbox server will also work for development
// const DEV_APN_SERVER = "https://api.sandbox.push.apple.com:443"
const PROD_APN_SERVER = "api.push.apple.com:443"


// Notification related references:
// - Establishing a token-based connection to APNs: https://developer.apple.com/documentation/UserNotifications/establishing-a-token-based-connection-to-apns
// - Generating a remote notification: https://developer.apple.com/documentation/UserNotifications/generating-a-remote-notification
// - Starting and updating Live Activities with ActivityKit push notifications: https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications


// timestamp in seconds
export function getTimestamp(): number {
    return Math.floor(new Date().getTime() / 1000)
}

// For security, APNs requires you to refresh your token regularly.
//
// Refresh your token no more than once every 20 minutes and no less than once every 60 minutes.
// APNs rejects any request whose token contains a timestamp that’s more than one hour old.
// Similarly, APNs report an error if you use a new token more than once every 20 minutes on the **same** connection.
//
// Here, we don't need a recurring task to recreate our token with a current timestamp
// because we will be using a new connection for each request.
export function createJWTToken(): string {

    const header = {
        "alg": "ES256",
        "kid": KEY_ID,
        'typ': undefined // required. Otherwise, we will get `Unrecognizable claims found`
    }

    const payload = {
        "iss": TEAM_ID,
        "iat": getTimestamp() // timestamp in second
    }

    const token = jwt.sign(payload, PRIVATE_KEY, {
        header: header,
    })

    console.log(token)
    return token
}


export async function startNewActivity(
    pushToStartToken: string,
    contentState: ContentState,
    attributes: ActivityAttributes,
    alert: Alert): Promise<{
        status: number,
        data: string
    }> {
    const timeStamp = getTimestamp()

    const aps = {
        "timestamp": timeStamp,
        "event": EVENT.start,
        "content-state": contentState,
        "input-push-token": 1, // for getting a push token to update or end the activity (in app)
        "attributes-type": ATTRIBUTE_TYPE,
        "attributes": attributes,
        "alert": alert
    }

    const body = JSON.stringify({ aps })
    return sendLiveActivityNotification(pushToStartToken, body, 10)
}


export async function updateActivity(
    pushToken: string,
    contentState: ContentState,
    alert: Alert | null,
    relevantScore: number = 1): Promise<{
        status: number,
        data: string
    }> {
    const timeStamp = getTimestamp()

    let aps: { [key: string]: any } = {
        "timestamp": timeStamp,
        "event": EVENT.update,
        "relevance-score": relevantScore,
        "content-state": contentState,
    }

    if (alert) {
        aps = {
            ...aps,
            "alert": alert
        }
    }

    const body = JSON.stringify({ aps })
    return sendLiveActivityNotification(pushToken, body, 10)
}


// dismissal date:
// - undefined to use the system default strategy: ie: keeps a Live Activity that ended on the Lock Screen for up to four hours after it ends or the user removes it.
// - a timestamp (seconds) in the past for immediate dismissal
// - a custom date (timestamp in seconds) within a four-hour window to set a custom dismissal date.
export async function endActivity(
    pushToken: string,
    contentState: ContentState,
    dismissalDate: number | undefined = undefined): Promise<{
        status: number,
        data: string
    }> {
    const timeStamp = getTimestamp()

    let aps: { [key: string]: any } = {
        "timestamp": timeStamp,
        "event": EVENT.end,
        "content-state": contentState,
    }

    if (dismissalDate) {
        aps = {
            ...aps,
            "dismissal-date": dismissalDate
        }
    }

    const body = JSON.stringify({ aps })
    return sendLiveActivityNotification(pushToken, body, 10)
}


async function sendLiveActivityNotification(deviceToken: string, body: string, priority: 5 | 10 = 10): Promise<{
    status: number,
    data: string
}> {

    const token = createJWTToken()

    // A new connections for each request
    const client = http2.connect(IS_PRODUCTION ? PROD_APN_SERVER : DEV_APN_SERVER)

    const req = client.request({
        ':method': 'POST',
        ':path': `/3/device/${deviceToken}`,
        "authorization": `bearer ${token}`,
        "apns-push-type": PUSH_TYPE,
        "apns-expiration": 0,
        "apns-priority": priority,
        "apns-topic": TOPIC
    })

    req.write(body)

    return sendRequest(client, req)

}

async function sendRequest(client: http2.ClientHttp2Session, req: http2.ClientHttp2Stream): Promise<{
    status: number,
    data: string
}> {
    return new Promise((resolve, _reject) => {
        let status: number | undefined = undefined
        let responseData = ''

        req.setEncoding('utf8')

        req.on('response', (headers, _flags) => {
            console.log('Status:', headers[':status']) // Log the response status
            status = headers[':status']
        })

        req.on('data', chunk => {
            // Accumulate response data
            responseData = responseData + chunk
        })

        req.on('end', () => {
            console.log('Response:', responseData) // Log the complete response body
            client.close() // Close the client connection
            resolve({ status: status ?? 200, data: responseData })
        })

        req.end() // End the request stream to send the request
    })
}

// for testing
async function main() {
    // obtain the tokens from the App
    const pushToStartToken = "80633f53a3b4f2d94b91fe41afae77cfc3152af36f1b9a36e2092cf9d17e624959a87c28e89f0c71f9a18edfcfe395f7935f6291dca906c5aa83058e6263be345cf7cc02ca638fb9369096636f11fb0d9806e5e80065175cca5449e2804c74c7fc7b09faca76109c9c1fce5a369ad16f8cf1f94f7d9a08efe9c175cec793f5e7"
    const activityToken = "804da329a857d365c8b46615db18f194fae5430276299a94cc8dfe4b0bc09ceff69dc09455374daaeb1341171049b6637265174180612870cc1a0565ad449ca8819b8a3800a392329a3b1ff93237a9a435d598b07617bd43eb9e5d895e36556eb88eb21e60e9270e97e3db5cf66105cfab5a38323e69fb99a1af6293852a7fa0"

    const timeStamp = getTimestamp()

    const contentState = {
        currentHeroLevel: 1000,
        lastUpdatedBy: {
            id: "B2EFF797-D144-422A-85AA-2ACE622ED9B4",
            name: "Itsuki"
        },
        lastUpdatedAt: timeStamp
    }

    const attributes = {
        "hero": {
            "id": "f8fb6d23-1d74-405b-886c-22372ba998ab",
            "customIcon": "star",
            "name": "itsuki",
            "createdBy": {
                "id": "B2EFF797-D144-422A-85AA-2ACE622ED9B4",
                "name": "Itsuki"
            },
            "createdAt": timeStamp,
            "maxHeroLevel": 10000
        }
    }

    const alert = {
        "title": "Hero",
        "body": "a new hero for you!",
        "sound": "default"
    }

    try {
        const response = await startNewActivity(pushToStartToken, ContentState.parse(contentState), ActivityAttributes.parse(attributes), Alert.parse(alert))
        // const response = await updateActivity(activityToken, ContentState.parse(contentState), Alert.parse(alert))
        // const response = await endActivity(activityToken, ContentState.parse(contentState), getTimestamp() - 60 * 60)
        // console.log(response)
    } catch (e) {
        console.log(e)
    }

}

main()
