import { KEY_ID, PRIVATE_KEY, TEAM_ID } from "./constants"
import { getTimestamp } from "./helpers"
import jwt from 'jsonwebtoken'

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

    // console.log(token)
    return token
}
