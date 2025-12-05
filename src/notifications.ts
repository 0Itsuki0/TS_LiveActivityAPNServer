import http2 from 'http2'
import { ActivityAttributes, Alert, ATTRIBUTE_TYPE, ContentState, EVENT, ServerResponse } from "./types"
import { BUNDLE_ID, DEV_APN_SERVER, IS_PRODUCTION, KEY_ID, PRIVATE_KEY, PROD_APN_SERVER, PUSH_TYPE, TEAM_ID, TOPIC } from "./constants"
import { getTimestamp, sendRequest } from "./helpers"
import { createJWTToken } from './token'

// Notification related references:
// - Establishing a token-based connection to APNs: https://developer.apple.com/documentation/UserNotifications/establishing-a-token-based-connection-to-apns
// - Generating a remote notification: https://developer.apple.com/documentation/UserNotifications/generating-a-remote-notification
// - Starting and updating Live Activities with ActivityKit push notifications: https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications
// - Sending channel management requests to APNs: https://developer.apple.com/documentation/usernotifications/sending-channel-management-requests-to-apns
// - Sending broadcast push notification requests to APNs: https://developer.apple.com/documentation/usernotifications/sending-broadcast-push-notification-requests-to-apns


// channelId:
// - set to an existing channel ID to start a new activity on the channel and subscribe to it, ie:  a Live Activity that supports push updates on a channel
// - set to undefined to start a (regular) new activity on the given device, ie: a Live Activity that supports push updates to push tokens
export async function startNewActivity(
    pushToStartToken: string,
    channelId: string | undefined,
    contentState: ContentState,
    attributes: ActivityAttributes,
    alert: Alert
): Promise<ServerResponse> {
    const timeStamp = getTimestamp()

    let aps: { [key: string]: any } = {
        "timestamp": timeStamp,
        "event": EVENT.start,
        "content-state": contentState,
        "attributes-type": ATTRIBUTE_TYPE,
        "attributes": attributes,
        "alert": alert
    }

    if (channelId) {
        aps = {
            ...aps,
            "input-push-channel": channelId,
        }
    } else {
        aps = {
            ...aps,
            "input-push-token": 1, // for getting a push token to update or end the activity (in app)
        }
    }

    const body = JSON.stringify({ aps })
    return sendDeviceNotification(pushToStartToken, body, 10)
}


// token:
// - for broadcasting: channel ID
// - for regular live activty: push token of the specific activity to update
export async function updateActivity(
    token: string,
    isBroadcast: boolean,
    contentState: ContentState,
    alert: Alert | null,
    relevantScore: number = 1
): Promise<ServerResponse> {
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
    return isBroadcast ? sendBroadcast(token, body, 10) : sendDeviceNotification(token, body, 10)
}

// token:
// - for broadcasting: channel ID
// - for regular live activty: push token of the specific activity to update
//
// dismissal date:
// - undefined to use the system default strategy: ie: keeps a Live Activity that ended on the Lock Screen for up to four hours after it ends or the user removes it.
// - a timestamp (seconds) in the past for immediate dismissal
// - a custom date (timestamp in seconds) within a four-hour window to set a custom dismissal date.
export async function endActivity(
    token: string,
    isBroadcast: boolean,
    contentState: ContentState,
    dismissalDate: number | undefined = undefined
): Promise<ServerResponse> {
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
    return isBroadcast ? sendBroadcast(token, body, 10) : sendDeviceNotification(token, body, 10)
}


async function sendDeviceNotification(
    deviceToken: string,
    body: string,
    priority: 5 | 10 = 10
): Promise<ServerResponse> {

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


async function sendBroadcast(
    channelId: string,
    body: string,
    priority: 5 | 10 = 10
): Promise<ServerResponse> {

    const token = createJWTToken()

    // A new connections for each request
    const client = http2.connect(IS_PRODUCTION ? PROD_APN_SERVER : DEV_APN_SERVER)

    const req = client.request({
        ':method': 'POST',
        ':path': `/4/broadcasts/apps/${BUNDLE_ID}`,
        "authorization": `bearer ${token}`,
        "apns-push-type": PUSH_TYPE,
        "apns-expiration": 0,
        "apns-priority": priority,
        "apns-channel-id": channelId
    })

    req.write(body)

    return sendRequest(client, req)

}
