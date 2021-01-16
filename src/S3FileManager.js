import S3 from '@auth0/s3';

class S3FileManager {
    constructor() {
        this.client = S3.createClient({
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
    }

    uploadImage(image, extension) {
        return this.client.uploadFile({
            localFile: `./temp/${image.key}${extension}`,
            s3Params: {
                Bucket: process.env.S3_BUCKET,
                Key: `${process.env.NODE_ENV}/${image.key}${extension}`
            }
        });
    }

    downloadImage(key) {
        return this.client.downloadBuffer({
            Bucket: process.env.S3_BUCKET,
            Key: key
        });
    }

    deleteImages(keys) {
        return this.client.deleteObjects({
            Bucket: process.env.S3_BUCKET,
            Delete: {
                Objects: keys.map((key) => ({
                    Key: key
                }))
            }
        });
    }
}

export default S3FileManager;