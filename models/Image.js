var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');

var schema = new mongoose.Schema({
    originalUrl: { type: 'String' },
    s3Path: { type: 'String' },
    originalWidth: { type: 'Number' },
    originalHeight: { type: 'Number' },
    savedWidth: { type: 'Number' },
    savedHeight: { type: 'Number' },
    accessedAt: { type: 'Date' }
});

schema.plugin(timestamps)

export default mongoose.model('Image', schema);