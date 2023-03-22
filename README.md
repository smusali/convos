# Siena Test

## Description
Backend Engineering Challenge for Siena AI

## Endpoints
### POST /csv2s3
This endpoint accepts a CSV file as input, validates its format, and uploads it to an S3 bucket.

#### Request
- **Method**: `POST`
- **URL**: `/csv2s3`
- **Request Body**: Form data with the following fields:
 - `csv`: A CSV file containing 1000 records with the following columns:
  - `sender_username` *(string)*: The username of the message sender
  - `receiver_username` *(string)*: The username of the message receiver
  - `message` *(string)*: The message content
  - `channel` *(string)*: The channel used to send the message (one of "instagram", "facebook", "whatsapp", "email")

#### Response
- **Status Code**:
 - `200 OK` if the CSV file is uploaded successfully
 - `400 Bad Request` if the CSV format is invalid
 - `500 Internal Server Error` if there is a server error
- **Response Body**: JSON object with the following fields:
 - `message` *(string)*: A message indicating whether the CSV file was uploaded successfully or not.
 - `error` *(string)*: An error message if the request failed due to an invalid CSV format or a server error.

### GET /conversation
This endpoint retrieves a list of conversations and their last message time, ordered by the time of the last message.

#### Request
- **Method**: `GET`
- **URL**: `/conversation`
- **Query Parameters**:
 - `limit` *(optional, number)*: The maximum number of conversations to return *(default: 10)*.
 - `offset` *(optional, number)*: The number of conversations to skip *(default: 0)*.

#### Response
- **Status Code**:
 - `200 OK` if the conversations are retrieved successfully
 - `500 Internal Server Error` if there is a server error.
- **Response Body**: JSON object with the following fields:
 - `participants` *(array)*: An array containing the usernames of the conversation participants.
 - `lastMessageTime` *(string)*: The time of the last message in the conversation.


### GET /conversation/:id/chat
This endpoint retrieves a conversation between two participants, including their messages and the time they were sent.

#### Request
- **Method**: `GET`
- **URL**: `/conversation/:id/chat`, where `:id` is a comma-separated list of the two participants' usernames.
- **Query Parameters**:
 - `limit` *(optional, number)*: The maximum number of messages to return *(default: 10)*.
 - `offset` *(optional, number)*: The number of messages to skip *(default: 0)*.

#### Response
- **Status Code**:
 - `200 OK` if the conversation is retrieved successfully
 - `500 Internal Server Error` if there is a server error.
- **Response Body**: JSON object with the following fields:
 - `sender` *(string)*: The username of the message sender.
 - `receiver` *(string)*: The username of the message receiver.
 - `message` *(string)*: The message content.
 - `channel` *(string)*: The channel used to send the message.
 - `response` *(string)*: The response to the message (if any).
 - `createdAt` *(string)*: The time the message was sent.

## Dump Lambda
`lib/dump.lambda.ts` is a consumer service implemented as an AWS Lambda function, which gets triggered on upload of a CSV file to an AWS S3 bucket. This service is responsible for processing the CSV file and inserting the data into a PostgreSQL database.

### Dependencies
This service uses the following dependencies:
- `aws-sdk/client-s3`: used to communicate with AWS S3 service.
- `aws-lambda`: used to define the Lambda handler function.
- `pg`: used to connect and interact with PostgreSQL database.

### Lambda Handler Function
The `handler` function takes an event parameter of type `S3Event`, which is passed by `AWS S3` when an object is created in the bucket. The function is `async` because it performs I/O operations with `AWS S3` and `PostgreSQL` database.
