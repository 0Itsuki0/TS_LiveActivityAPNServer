import path from "path"
import fs from 'fs'
import { configDotenv } from "dotenv"
configDotenv()

export const KEY_ID = process.env.KEY_ID ?? ""
export const TEAM_ID = process.env.TEAM_ID ?? ""
export const BUNDLE_ID = process.env.BUNDLE_ID ?? ""
export const IS_PRODUCTION: boolean = (process.env.IS_PRODUCTION ?? "false") === "true"

export const PRIVATE_KEY_FILE_NAME = "APN_PRIVATE_KEY.p8"
export const PRIVATE_KEY_PATH = path.resolve(__dirname, "..", PRIVATE_KEY_FILE_NAME)
export const PRIVATE_KEY = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8')

export const TOPIC = `${BUNDLE_ID}.push-type.liveactivity`
export const PUSH_TYPE = "liveactivity"
// for channel management request
export const PASCAL_PUSH_TYPE = "LiveActivity"

// for notifications & broadcasting
export const DEV_APN_SERVER = "https://api.development.push.apple.com:443"
// following sandbox server will also work for development
// const DEV_APN_SERVER = "https://api.sandbox.push.apple.com:443"
export const PROD_APN_SERVER = "https://api.push.apple.com:443"


// for channel management
export const DEV_CHANNEL_MANAGEMENT_SERVER = "https://api-manage-broadcast.sandbox.push.apple.com:2195"
export const PROD_CHANNEL_MANAGEMENT_SERVER = "https://api-manage-broadcast.push.apple.com:2196"
