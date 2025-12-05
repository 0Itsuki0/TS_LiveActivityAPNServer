import { createChannel, deleteChannel, getChannel, listChannels } from "./channels"
import { getTimestamp } from "./helpers"
import { endActivity, startNewActivity, updateActivity } from "./notifications"
import { ActivityAttributes, Alert, ContentState, MessageStoragePolicy } from "./types"

// for testing
async function main() {
    // obtain the tokens from the App
    const pushToStartToken = "..."
    const activityToken = "..."
    const channelId: string | undefined = "bg+...=="

    const timeStamp = getTimestamp()

    const contentState = {
        currentHeroLevel: 10000,
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
        },
        "channelId": channelId
    }

    const alert = {
        "title": "Hero",
        "body": "a new hero for you!",
        "sound": "default"
    }

    try {
        /**************************************/
        /******** Channel management **********/
        /**************************************/
        // const response = await createChannel(MessageStoragePolicy.noMessageStored)
        // const response = await getChannel(channelId!)
        // const response = await deleteChannel(channelId!)
        // const response = await listChannels()
        /******************************************/
        /******** notifications requests **********/
        /******************************************/
        //
        // const response = await startNewActivity(pushToStartToken, channelId, ContentState.parse(contentState), ActivityAttributes.parse(attributes), Alert.parse(alert))
        // target device:
        // const response = await updateActivity(activityToken, false, ContentState.parse(contentState), Alert.parse(alert))
        // broadcast:
        const response = await updateActivity(channelId!, true, ContentState.parse(contentState), Alert.parse(alert))
        // target device:
        // const response = await endActivity(activityToken, false, ContentState.parse(contentState), getTimestamp() - 60 * 60)
        // broadcast
        // const response = await endActivity(channelId!, true, ContentState.parse(contentState), getTimestamp() - 60 * 60)

        console.log(response)
    } catch (e) {
        console.log(e)
    }

}

main()
