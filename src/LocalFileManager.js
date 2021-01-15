import fs from 'fs';

class LocalFileManager {
    static writeTempFile(filename, key, buffer) {
        return new Promise((resolve, reject) => {
            fs.writeFile(filename, buffer, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        key: key,
                        buffer: buffer
                    });
                }
            });
        });
    }

    static deleteTempFile(path) {
        return new Promise((resolve, reject) => {
            fs.unlink(path, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

export default LocalFileManager;