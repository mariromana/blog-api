import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
    filename: String,
    filepath: String,
    contentType: String,
    size: Number,
    uploadDate: { type: Date, default: Date.now },
});

export default mongoose.model('File', FileSchema);
