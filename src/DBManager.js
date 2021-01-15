import Image from '../models/Image';

class DBManager {
    static registerImage(data) {
        var image = new Image(data);
        return image.save();
    }
}

export default DBManager;