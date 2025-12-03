# Typescript: LiveActivityAPNServer

A sample implementation for ActivityKit Remote notification server to control Live Activities with push notifications remotely.

For more details, please refer to my blog [SwiftUI / LiveActivity: REMOTE Control With Push Notifications]()

## Set Up

1. Obtain a private key (with a .p8 file extension) and a key ID from developer account on [developer.apple.com](https://developer.apple.com/account/resources/keys/list)
2. Replace `APN_PRIVATE_KEY.p8` with your p8 key file above.
3. Obtain the TEAM_ID
4. Obtain the BUNDLE_ID for the app to send notification to.
5. Set up the constants in [notifications.ts](./src/notifications.ts)


## Testing

1. If you don't have an app already, you can Grab the sample App from my [GitHub](https://github.com/0Itsuki0/SwiftUI_LiveActivityWithPushNotification)
2. Run the app to obtain a push to start token
3. Call `startNewActivity` to start a new live activity with the token
4. Get the activity push token from the App
5. Call `updateActivity` or `endActivity` to update or end the activity

I have added a testing function in [notifications.ts](./src/notifications.ts) that you can just run with `npm run dev`.

![](./demo.gif)


## References

- Establishing a token-based connection to APNs: https://developer.apple.com/documentation/UserNotifications/establishing-a-token-based-connection-to-apns
- Generating a remote notification: https://developer.apple.com/documentation/UserNotifications/generating-a-remote-notification
- Starting and updating Live Activities with ActivityKit push notifications: https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications
