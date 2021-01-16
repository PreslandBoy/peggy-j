import Image from '../models/Image';
import moment from 'moment';

class DBManager {
    static registerImage(data) {
        var image = new Image(data);
        return image.save();
    }

    static getExistingImageData(url, originalWidth, desiredWidth) {
        return new Promise((resolve, reject) => {
            Image.findOne({
                originalUrl: url,
                originalWidth: originalWidth,
                savedWidth: desiredWidth
            }).exec().then((data) => {
                if (data) {
                    data.accessedAt = moment();
                    data.save().catch(console.log);
                }
                resolve(data);
            }).catch(reject);
        })
    }
}

export default DBManager;