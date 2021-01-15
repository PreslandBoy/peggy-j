require('dotenv').config()
import express from 'express';
import Jimp from 'jimp';
import mongoose from 'mongoose';
import S3 from '@auth0/s3';
import randstr from 'randomstring';
import fs from 'fs';
import Image from '../models/Image';
import mime from 'mime-types';
import cloneBuffer from 'clone-buffer';

// TODO: Connect MongoDB
// TODO: Connect S3
// TODO: Write to S3 + Write to DB
// TODO: Check what to do on new request
// TODO: Cron job to delete old images

const port = process.env.PORT ? process.env.PORT : 3000;
const app = express();

const s3 = S3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: {
        accessKeyId: process.env.S3_KEY_ID,
        secretAccessKey: process.env.S3_SECRET,
        // any other options are passed to new AWS.S3()
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    },
})

app.get('/', (req, res) => {

    if (!req.query.w && !req.query.h) {
        return res.sendStatus(400);
    } else if (!req.query.url) {
        return res.sendStatus(400);
    }

    var mimeType;
    var extension;

    Jimp.read(req.query.url).then((image) => {
        return image.resize(Number.parseInt(req.query.w), Jimp.AUTO);
    }).then((resizedImage) => {
        mimeType = resizedImage.getMIME();
        extension = `.${mime.extension(mimeType)}`
        return resizedImage.getBufferAsync(mimeType);
    }).then((newImageBuffer) => {

        var key = randstr.generate();

        return new Promise((resolve, reject) => {
            fs.writeFile(`./temp/${key}${extension}`, newImageBuffer, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        key: key,
                        buffer: newImageBuffer
                    });
                }
            });
        });

    }).then((image) => {
        res.send(image.buffer);
        var s3Uploader = s3.uploadFile({
            localFile: `./temp/${image.key}${extension}`,
            s3Params: {
                Bucket: process.env.S3_BUCKET,
                Key: `${process.env.NODE_ENV}/${image.key}${extension}`
            }
        });

        s3Uploader.on('end', () => {
            console.log('Uploaded to S3...');
            deleteTempFile(`./temp/${image.key}${extension}`);
        })

        s3Uploader.on('progress', () => {
            console.log("progress", s3Uploader.progressAmount, s3Uploader.progressTotal);
        })

        s3Uploader.on('error', (err) => {
            console.log(err);
            deleteTempFile(`./temp/${image.key}${extension}`);
        })
        
    }).catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });

});

function deleteTempFile(path) {
    fs.unlink(path, (err) => {
        if (err) {
            console.log(err);
        }
    });
}

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('DB Connected...')



    app.listen(port, () => {
        console.log(`Peggy J. listening at http://localhost:${port}`)
    })
})