import express from 'express';
import Jimp from 'jimp';
import Image from '../models/Image';

// TODO: Connect MongoDB
// TODO: Connect S3
// TODO: Write to S3 + Write to DB
// TODO: Check what to do on new request
// TODO: Cron job to delete old images

const port = process.env.PORT ? process.env.PORT : 3000;
const app = express();

app.get('/', (req, res) => {

    if (!req.query.w && !req.query.h) {
        return res.sendStatus(400);
    } else if (!req.query.url) {
        return res.sendStatus(400);
    } 

    Jimp.read(req.query.url).then((image) => {
        return image.resize(Number.parseInt(req.query.w), Jimp.AUTO);
    }).then((resizedImage) => {
        return resizedImage.getBufferAsync(resizedImage.getMIME());
    }).then((newImageBuffer) => {
        res.send(newImageBuffer);
    }).catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });

});

app.listen(port, () => {
  console.log(`Peggy J. listening at http://localhost:${port}`)
})