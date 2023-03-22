import express, { type Request, type Response, type NextFunction } from 'express'
import multer from 'multer'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Pool } from 'pg'

const app = express()
const upload = multer({ dest: 'uploads/' })

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? undefined,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? undefined
  }
})

const dbConfig = {
  user: process.env.DB_USER ?? undefined,
  host: process.env.DB_HOST ?? undefined,
  database: process.env.DB_NAME ?? undefined,
  password: process.env.DB_PASSWORD ?? undefined,
  port: Number(process.env.DB_PORT) ?? undefined
}

const pool = new Pool(dbConfig)

app.post('/csv2s3', upload.single('csv'), async (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Validate the format of the CSV
    const csv = req.file?.buffer.toString()
    const csvRows = csv?.trim().split('\n')
    if (csvRows?.length !== 1000) {
      res.status(400).send({ error: 'CSV must contain 1000 records.' })
    }
    const csvHeaders = csvRows[0].trim().split(',')
    if (csvHeaders?.length !== 4 ||
        csvHeaders[0].trim() !== 'sender_username' ||
        csvHeaders[1].trim() !== 'reciever_username' ||
        csvHeaders[2].trim() !== 'message' ||
        !['instagram', 'facebook', 'whatsapp', 'email'].includes(csvHeaders[3].trim())) {
      res.status(400).send({ error: 'Invalid CSV format.' })
    }

    // Upload the CSV file to S3
    const bucketName = process.env.AWS_S3_BUCKET_NAME ?? undefined
    const objectKey = req.file?.originalname ?? undefined
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: req.file?.buffer
    })
    await s3.send(command)

    res.send({ message: 'CSV file uploaded to S3.' })
  } catch (err) {
    console.error(err)
    res.status(500).send({ error: 'Failed to upload CSV file to S3.' })
  }
})

app.get('/conversation', async (req: Request, res: Response): void => {
  try {
    const limit = parseInt(req.query.limit as string) ?? 10
    const offset = parseInt(req.query.offset as string) ?? 0
    const result = await pool.query(
      `SELECT DISTINCT ON (sender_username, receiver_username)
      sender_username, receiver_username, MAX(created_at) AS last_message_time
      FROM messages
      GROUP BY sender_username, receiver_username
      ORDER BY last_message_time DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    const conversations = result.rows.map((row: any) => {
      return {
        participants: [row.sender_username, row.receiver_username],
        lastMessageTime: row.last_message_time
      }
    })

    res.json(conversations)
  } catch (err) {
    console.error(err)
    res.status(500).send({ error: 'Failed to retrieve conversations.' })
  }
})

app.get('/conversation/:id/chat', async (req: Request, res: Response): void => {
  try {
    const participants = req.params.id.split(',')
    const limit = parseInt(req.query.limit as string) ?? 10
    const offset = parseInt(req.query.offset as string) ?? 0
    const result = await pool.query(
      `SELECT sender_username, receiver_username, message, channel, response, created_at
      FROM messages
      WHERE (sender_username = $1 AND receiver_username = $2) OR (sender_username = $2 AND receiver_username = $1)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4`,
      [participants[0], participants[1], limit, offset]
    )

    const messages = result.rows.map((row: any) => {
      return {
        sender: row.sender_username,
        receiver: row.receiver_username,
        message: row.message,
        channel: row.channel,
        response: row.response,
        createdAt: row.created_at
      }
    })

    res.json(messages)
  } catch (err) {
    console.error(err)
    res.status(500).send({ error: 'Failed to retrieve the chat.' })
  }
})

export default app
