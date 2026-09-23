import api from './api';

/**
 * Uploads a large video or file in small chunks (e.g. 2MB)
 * Prevents Nginx 413 "Request Entity Too Large" and network timeout issues.
 *
 * @param {File|Blob} file - The file object from <input type="file">
 * @param {Object} options
 * @param {number} [options.chunkSize=2097152] - Chunk size in bytes (default 2MB)
 * @param {Function} [options.onProgress] - Callback: ({ percent, currentChunk, totalChunks, status })
 * @returns {Promise<string>} - The final public URL of the uploaded video
 */
export async function uploadVideoInChunks(file, options = {}) {
    const {
        chunkSize = 2 * 1024 * 1024, // 2MB safe chunk size
        onProgress = () => {}
    } = options;

    if (!file) {
        throw new Error('No file provided for upload.');
    }

    const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
    const uploadId = `up_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fileName = file.name || 'video.mp4';

    onProgress({
        percent: 0,
        currentChunk: 0,
        totalChunks,
        status: `Preparing upload (0/${totalChunks})...`
    });

    // Upload each chunk sequentially
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkBlob = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunkBlob, fileName);
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', String(chunkIndex));
        formData.append('totalChunks', String(totalChunks));
        formData.append('fileName', fileName);

        let attempt = 0;
        let success = false;
        let lastError = null;

        // Retry up to 3 times per chunk for rock-solid stability
        while (attempt < 3 && !success) {
            try {
                attempt++;
                // Try chunk endpoint
                try {
                    await api.post('/upload/chunk', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                } catch (err) {
                    // Fallback to /upload/public/chunk if 401 or route variant
                    if (err.response?.status === 401 || err.response?.status === 404) {
                        await api.post('/upload/public/chunk', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                    } else {
                        throw err;
                    }
                }
                success = true;
            } catch (err) {
                lastError = err;
                console.warn(`Chunk ${chunkIndex + 1}/${totalChunks} upload attempt ${attempt} failed:`, err.message);
                if (attempt < 3) {
                    // Wait 500ms before retrying
                    await new Promise(r => setTimeout(r, 500));
                }
            }
        }

        if (!success) {
            throw new Error(`Failed to upload chunk ${chunkIndex + 1} of ${totalChunks}: ${lastError?.response?.data?.message || lastError?.message || 'Network error'}`);
        }

        // Calculate progress percentage (0 - 92% reserved for chunks, 92 - 100% for merging)
        const chunkPercent = Math.round(((chunkIndex + 1) / totalChunks) * 92);
        onProgress({
            percent: chunkPercent,
            currentChunk: chunkIndex + 1,
            totalChunks,
            status: `Uploading video: ${chunkPercent}% (Chunk ${chunkIndex + 1}/${totalChunks})...`
        });
    }

    // All chunks uploaded! Request backend to stream-merge them
    onProgress({
        percent: 95,
        currentChunk: totalChunks,
        totalChunks,
        status: 'Merging and finalizing video on server...'
    });

    let mergeRes;
    try {
        mergeRes = await api.post('/upload/chunk/complete', {
            uploadId,
            fileName,
            totalChunks
        });
    } catch (err) {
        // Fallback to public complete route
        if (err.response?.status === 401 || err.response?.status === 404) {
            mergeRes = await api.post('/upload/public/chunk/complete', {
                uploadId,
                fileName,
                totalChunks
            });
        } else {
            throw err;
        }
    }

    const finalUrl = mergeRes?.data?.data;
    if (!finalUrl) {
        throw new Error('Server merged chunks but did not return a valid video URL.');
    }

    onProgress({
        percent: 100,
        currentChunk: totalChunks,
        totalChunks,
        status: 'Video upload completed successfully!'
    });

    return finalUrl;
}
