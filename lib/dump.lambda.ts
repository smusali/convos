import type { S3Event, S3Handler } from 'aws-lambda'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import Message from './model'

const s3Client = new S3Client({ region: process.env.AWS_REGION })

const channelResponses: Record<string, string> = {
  instagram: 'Hey {{sender_username}}, I am doing great!',
  email: 'Hey {{sender_username}}, it has been a long time we haven\'t met.',
  facebook: 'Hey {{sender_username}}, this is {{receiver_username}}. How are you doing these days?'
}

const replaceUsername = (response: string, senderUsername: string, receiverUsername: string): string => {
  return response.replace(/{{sender_username}}/g, senderUsername).replace(/{{receiver_username}}/g, receiverUsername)
}

const getResponseForChannel = (channel: string, senderUsername: string, receiverUsername: string): string => {
  const response = channelResponses[channel] ?? ''
  return replaceUsername(response, senderUsername, receiverUsername)
}

const processCsv = async (csv: string): Promise<void> => {
  const rows = csv.trim().split('\n')
  const dataRows = rows.slice(1)
  const data = dataRows.map((row) => {
    const values = row.split(',')
    return {
      senderUsername: values[0].trim(),
      receiverUsername: values[1].trim(),
      message: values[2].trim(),
      channel: values[3].trim()
    }
  })

  for (const row of data) {
    const { senderUsername, receiverUsername, message, channel } = row
    const response = getResponseForChannel(channel, senderUsername, receiverUsername)

    try {
      await Message.create({
        senderUsername,
        receiverUsername,
        message,
        channel,
        response
      })
    } catch (err) {
      console.error(`Failed to insert message into DB: ${JSON.stringify(err)}`)
    }
  }
}

export const handler: S3Handler = async (event: S3Event): Promise<void> => {
  try {
    const bucketName = event.Records[0].s3.bucket.name
    const objectKey = event.Records[0].s3.object.key

    const s3Object = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: objectKey }))
    const csv = s3Object.Body?.toString() ?? ''

    await processCsv(csv)
  } catch (err) {
    console.error(`Error processing CSV file: ${JSON.stringify(err)}`)
  }
}
