var CronJob = require('cron').CronJob;
import Image from '../models/Image';
import moment from 'moment';
import progress from 'cli-progress';

class CronJobs {
    constructor(s3) {
        this.s3 = s3;
        this.garbageCollectionJob = new CronJob('0 0 * * 3,6', this.doGarbageCollection);
    }

    start() {
        this.garbageCollectionJob.start();
    }

    doGarbageCollection() {
        console.log('Doing garbage collection...')
        Image.find({
            accessedAt: {
                $lt: moment().subtract(7, 'days')
            }
        }).exec().then((data) => {
            if (data.length > 0) {
                var deleter = this.s3.deleteImages(data.map((imageData) => imageData.s3Path));
            
                deleter.on('error', console.log);

                deleter.on('end', () => {
                    Image.deleteMany({
                        _id: {
                            $in: data.map((imageData) => imageData._id)
                        }
                    }).then((dbResult) => {
                        console.log(`Deleted ${dbResult.deletedCount} images from S3 and DB`);
                    }).catch(console.log);
                })
            } else {
                console.log('No garbage to collect.');
            }
        })
    }
}

export default CronJobs;