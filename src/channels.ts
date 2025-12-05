import { BUNDLE_ID, PASCAL_PUSH_TYPE, DEV_APN_SERVER, DEV_CHANNEL_MANAGEMENT_SERVER, IS_PRODUCTION, PROD_APN_SERVER, PROD_CHANNEL_MANAGEMENT_SERVER, PUSH_TYPE, TOPIC } from "./constants"
import { sendRequest } from "./helpers"
import { createJWTToken } from "./token"
import { CreateChannelResponse, EVENT, GetChannelResponse, ListChannelsResponse, MessageStoragePolicy, ServerResponse } from "./types"
import http2 from 'http2'


// https://developer.apple.com/documentation/usernotifications/sending-channel-management-requests-to-apns#Create-a-channel
export async function createChannel(
    messageStoragePolicy: MessageStoragePolicy,
): Promise<CreateChannelResponse> {
    const bodyJson: { [key: string]: any } = {
        "message-storage-policy": messageStoragePolicy,
        "push-type": PASCAL_PUSH_TYPE,
    }

    const body = JSON.stringify(bodyJson)

    const response = await sendSingleChannelManagementRequest("POST", body, undefined)

    return {
        ...response,
        channelId: response.headers["apns-channel-id"]
    }
}


// https://developer.apple.com/documentation/usernotifications/sending-channel-management-requests-to-apns#Read-a-channel
export async function getChannel(channelId: string): Promise<GetChannelResponse> {

    const response = await sendSingleChannelManagementRequest("GET", undefined, channelId)

    try {
        const jsonData = JSON.parse(response.data)

        return {
            ...response,
            pushType: jsonData["push-type"],
            messageStoragePolicy: jsonData["message-storage-policy"]
        }
    } catch (error) {
        console.log(error)
        return {
            ...response,
            pushType: undefined,
            messageStoragePolicy: undefined
        }
    }
}


// https://developer.apple.com/documentation/usernotifications/sending-channel-management-requests-to-apns#Delete-a-channel
// status: 204 for success
// when trying to delete a non-existing channe: 404: BadPath
export async function deleteChannel(channelId: string): Promise<ServerResponse> {
    return sendSingleChannelManagementRequest("DELETE", undefined, channelId)
}


async function sendSingleChannelManagementRequest(
    method: "GET" | "POST" | "DELETE",
    body: string | undefined,
    channelId: string | undefined
): Promise<ServerResponse> {
    const token = createJWTToken()

    const client = http2.connect(IS_PRODUCTION ? PROD_CHANNEL_MANAGEMENT_SERVER : DEV_CHANNEL_MANAGEMENT_SERVER)

    let requestOptions: { [key: string]: any } = {
        ':method': method,
        ':path': `/1/apps/${BUNDLE_ID}/channels`,
        "authorization": `bearer ${token}`,
    }
    if (channelId) {
        requestOptions = {
            ...requestOptions,
            "apns-channel-id": channelId
        }
    }

    const req = client.request(requestOptions)

    if (body) {
        req.write(body)
    }

    return sendRequest(client, req)

}


// https://developer.apple.com/documentation/usernotifications/sending-channel-management-requests-to-apns#Read-all-channel-IDs-for-a-bundle-ID
export async function listChannels(): Promise<ListChannelsResponse> {

    const token = createJWTToken()

    const client = http2.connect(IS_PRODUCTION ? PROD_CHANNEL_MANAGEMENT_SERVER : DEV_CHANNEL_MANAGEMENT_SERVER)

    const req = client.request({
        ':method': "GET",
        ':path': `/1/apps/${BUNDLE_ID}/all-channels`,
        "authorization": `bearer ${token}`,
    })

    const response = await sendRequest(client, req)

    try {
        const jsonData = JSON.parse(response.data)

        return {
            ...response,
            channels: jsonData["channels"],
        }
    } catch (error) {
        console.log(error)
        return {
            ...response,
            channels: []
        }
    }

}
