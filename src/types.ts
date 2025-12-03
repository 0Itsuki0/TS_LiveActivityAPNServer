
import { z } from 'zod'

export const EVENT = {
    start: "start",
    update: "update",
    end: "end"
} as const


export const User = z.looseObject({
    id: z.uuid(),
    name: z.string(),
})
export type User = z.infer<typeof User>

export const Hero = z.looseObject({
    id: z.uuid(),
    name: z.string(),
    customIcon: z.string(),
    createdBy: User,
    // For date, use number because that's how swift decode dates by default
    // and we cannot implemnet custom decoding strategies.
    // Otherwise, will result in update failures
    createdAt: z.number().nonnegative(),
    maxHeroLevel: z.int().nonnegative(),
})
export type Hero = z.infer<typeof Hero>

// Match ActivityAttributes.ContentState defined in App
export const ContentState = z.looseObject({
    currentHeroLevel: z.int().nonnegative(),
    lastUpdatedBy: User,
    // For date, use number because that's how swift decode dates by default
    // and we cannot implemnet custom decoding strategies.
    // Otherwise, will result in update failures
    lastUpdatedAt: z.number().nonnegative()
})

export type ContentState = z.infer<typeof ContentState>

// Match ActivityAttributes defined in App
export const ActivityAttributes = z.looseObject({
    hero: Hero
})
export type ActivityAttributes = z.infer<typeof ActivityAttributes>

// the type name of the ActivityAttributes defined in App
export const ATTRIBUTE_TYPE = "HeroAttributes"

// to support localization, change title and body to be an object like following
// "title": {
//   "loc-key": "%@!",
//   "loc-args": ["Hero"]
// },
export const Alert = z.looseObject({
    title: z.string(),
    body: z.string(),
    // UNNotificationSound: https://developer.apple.com/documentation/usernotifications/unnotificationsound
    sound: z.string()
})
export type Alert = z.infer<typeof Alert>