import { S3Event, S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Pool } from 'pg';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
};

const pool = new Pool(dbConfig);

const channelResponses = {
  instagram: 'Hey {{sender_username}}, i am doing great!',
  email: 'Hey {{sender_username}}, its has been a long time we haven\'t met.',
  facebook: 'Hey {{sender_username}}, this is {{reciever_username}}. How are you doing these days?',
};

const replaceUsername = (response: string, senderUsername: string, receiverUsername: string) => {
  return response.replace(/{{sender_username}}/g, senderUsername).replace(/{{reciever_username}}/g, receiverUsername);
};

const getResponseForChannel = (channel: string, senderUsername: string, receiverUsername: string) => {
  const response = channelResponses[channel] || '';
  return replaceUsername(response, senderUsername, receiverUsername);
};

const processCsv = async (csv: string) => {
  const rows = csv.trim().split('\n');
  const headers = rows[0].split(',');
  const dataRows = rows.slice(1);
  const data = dataRows.map(row => {
    const values = row.split(',');
    return {
      senderUsername: values[0].trim(),
      receiverUsername: values[1].trim(),
      message: values[2].trim(),
      channel: values[3].trim(),
    };
  });

  for (const row of data) {
    const { senderUsername, receiverUsername, message, channel } = row;
    const response = getResponseForChannel(channel, senderUsername, receiverUsername);

    try {
      await pool.query('INSERT INTO messages(sender_username, receiver_username, message, channel, response) VALUES ($1, $2, $3, $4, $5)', [senderUsername, receiverUsername, message, channel, response]);
    } catch (err) {
      console.error(`Failed to insert message into DB: ${err}`);
    }
  }
};

export const handler: S3Handler = async (event: S3Event) => {
  try {
    const bucketName = event.Records[0].s3.bucket.name;
    const objectKey = event.Records[0].s3.object.key;

    const s3Object = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: objectKey }));
    const csv = s3Object.Body?.toString() || '';

    await processCsv(csv);
  } catch (err) {
    console.error(`Error processing CSV file: ${err}`);
  }
};
