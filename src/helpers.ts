import http2 from 'http2'
import { ServerResponse } from './types'


// timestamp in seconds
export function getTimestamp(): number {
    return Math.floor(new Date().getTime() / 1000)
}

export async function sendRequest(
    client: http2.ClientHttp2Session,
    req: http2.ClientHttp2Stream,
): Promise<ServerResponse> {
    return new Promise((resolve, _reject) => {
        let status: number | undefined = undefined
        let responseData = ''
        let returningHeaders: { [key: string]: any } = []

        req.setEncoding('utf8')

        req.on('response', (headers, _flags, rawHeaders) => {
            // console.log('Status:', headers[':status']) // Log the response status
            // console.log(headers)
            status = headers[':status']
            returningHeaders = headers
        })

        req.on('data', chunk => {
            // Accumulate response data
            responseData = responseData + chunk
        })

        req.on('end', () => {
            // console.log('Response:', responseData) // Log the complete response body
            client.close() // Close the client connection
            resolve({ status: status ?? 200, data: responseData, headers: returningHeaders })
        })

        req.end() // End the request stream to send the request
    })
}
