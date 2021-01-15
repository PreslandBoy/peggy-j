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
import LocalFileManager from './LocalFileManager';
import S3FileManager from './S3FileManager';
import DBManager from './DBManager';
import progress from 'cli-progress';

// TODO: Connect MongoDB
// TODO: Connect S3
// TODO: Write to S3 + Write to DB
// TODO: Check what to do on new request
// TODO: Cron job to delete old images

const port = process.env.PORT ? process.env.PORT : 3000;
const app = express();

const s3 = new S3FileManager();

app.get('/', (req, res) => {

    if (!req.query.w && !req.query.h) {
        return res.sendStatus(400);
    } else if (!req.query.url) {
        return res.sendStatus(400);
    }

    var mimeType;
    var extension;
    var originalWidth;
    var originalHeight;
    var resizedJimp;
    var image;

    Jimp.read(req.query.url).then((image) => {
        originalWidth = image.bitmap.width;
        originalHeight = image.bitmap.height;
        return image.resize(Number.parseInt(req.query.w), Jimp.AUTO);
    }).then((resizedImage) => {
        resizedJimp = resizedImage;
        mimeType = resizedImage.getMIME();
        extension = `.${mime.extension(mimeType)}`
        return resizedImage.getBufferAsync(mimeType);
    }).then((newImageBuffer) => {
        var key = randstr.generate();
        return LocalFileManager.writeTempFile(`./temp/${key}${extension}`, key, newImageBuffer);
    }).then((theImage) => {
        image = theImage;

        res.send(theImage.buffer);

        var progressBar = new progress.SingleBar({}, progress.Presets.shades_classic);

        var uploader = s3.uploadImage(theImage, extension);
        console.log('Uploading to S3...');
        progressBar.start(100, 0);

        uploader.on('progress', () => {
            progressBar.update(Math.round((uploader.progressAmount/uploader.progressTotal)*100));
        })

        return new Promise((resolve, reject) => {
            uploader.on('end', () => {
                progressBar.stop();
                console.log('Uploaded to S3...');
                resolve();
            })

            uploader.on('error', (err) => {
                progressBar.stop();
                reject(err);
            })
        })

    }).then(() => {
        LocalFileManager.deleteTempFile(`./temp/${image.key}${extension}`);
        return DBManager.registerImage({
            originalUrl: req.query.url,
            s3Path: `${process.env.NODE_ENV}/${image.key}${extension}`,
            originalWidth: originalWidth,
            originalHeight: originalHeight,
            savedWidth: resizedJimp.bitmap.width,
            savedHeight: resizedJimp.bitmap.height
        })
    }).then((data) => {
        console.log('Saved to DB...');
    }).catch((err) => {
        console.log(err);
        LocalFileManager.deleteTempFile(`./temp/${image.key}${extension}`);
        res.sendStatus(500);
    });

});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('DB Connected...')



    app.listen(port, () => {
        console.log(`Peggy J. listening at http://localhost:${port}`)
    })
})