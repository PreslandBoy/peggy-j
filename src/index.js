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
import moment from 'moment';
import CronJobs from './CronJobs';

// TODO: Connect MongoDB
// TODO: Connect S3
// TODO: Write to S3 + Write to DB
// TODO: Check what to do on new request
// TODO: Cron job to delete old images

const port = process.env.PORT ? process.env.PORT : 3000;
const app = express();

const s3 = new S3FileManager();
const cronJobs = new CronJobs(s3);

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
    var imageJimp;
    var image;

    Jimp.read(req.query.url).then((image) => {
        originalWidth = image.bitmap.width;
        originalHeight = image.bitmap.height;
        imageJimp = image;
        return DBManager.getExistingImageData(req.query.url, originalWidth, req.query.w);
    }).then((savedData) => {

        if (savedData) {
            // get saved image
            var downloader = s3.downloadImage(savedData.s3Path);

            var progressBar = new progress.SingleBar({}, progress.Presets.shades_classic);
            console.log('Downloading from S3...');
            progressBar.start(100, 0);

            downloader.on('progress', () => {
                progressBar.update(Math.round((downloader.progressAmount/downloader.progressTotal)*100));
            })

            downloader.on('end', (buffer) => {
                progressBar.stop();
                console.log('Downloaded from S3.');
                res.send(buffer)
            })

            downloader.on('error', (err) => {
                console.log(err);
                progressBar.stop();
                res.sendStatus(500);
            })

        } else {
            resizeAndSave().catch((err) => {
                console.log(err);
                LocalFileManager.deleteTempFile(`./temp/${image.key}${extension}`);
                res.sendStatus(500);
            });
        }

    })

    function resizeAndSave() {

        var key = randstr.generate();

        imageJimp.resize(Number.parseInt(req.query.w), Jimp.AUTO)

        mimeType = imageJimp.getMIME();
        extension = `.${mime.extension(mimeType)}`;

        return imageJimp.getBufferAsync(mimeType).then((newImageBuffer) => {
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
                    console.log('Uploaded to S3.');
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
                savedWidth: imageJimp.bitmap.width,
                savedHeight: imageJimp.bitmap.height,
                accessedAt: moment()
            })
        }).then((data) => {
            console.log('Saved to DB.');
        })
    }

});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('DB Connected.')



    app.listen(port, () => {
        console.log(`Peggy J. listening at http://localhost:${port}`)
    })
})