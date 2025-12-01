// In a real application, this should be provided via environment variables and handled securely.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_API_KEY = process.env.API_KEY;

// The scope for Google Drive file creation
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

/**
 * Gets an OAuth 2.0 access token from the user.
 */
function getAccessToken(): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!window.google?.accounts?.oauth2) {
            // A brief delay to allow the GSI script to load
            setTimeout(() => {
                 if (!window.google?.accounts?.oauth2) {
                    return reject(new Error('Google Identity Services library not loaded.'));
                 }
                 requestToken(resolve, reject);
            }, 500);
        } else {
            requestToken(resolve, reject);
        }
    });
}

function requestToken(resolve: (token: string) => void, reject: (reason?: any) => void) {
     try {
        const tokenClient = window.google!.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: DRIVE_SCOPE,
            callback: (tokenResponse) => {
                if (tokenResponse.error) {
                    return reject(new Error(tokenResponse.error_description || 'Unknown error during authentication.'));
                }
                resolve(tokenResponse.access_token);
            },
        });
        tokenClient.requestAccessToken();
    } catch (error) {
        reject(error);
    }
}


/**
 * Shares a video file to Google Drive.
 * @param videoUrl The local object URL of the video to share.
 * @returns The shareable web view link for the uploaded file.
 */
export async function shareVideoToDrive(videoUrl: string): Promise<string> {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
        throw new Error("Google Client ID is not configured. Sharing is disabled.");
    }
     if (!GOOGLE_API_KEY) {
        throw new Error("API Key is not configured. Sharing is disabled.");
    }

    try {
        const accessToken = await getAccessToken();
        const videoBlob = await fetch(videoUrl).then(res => res.blob());
        
        const metadata = {
            name: `ai-memory-${Date.now()}.mp4`,
            mimeType: 'video/mp4',
        };

        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', videoBlob);
        
        // 1. Upload the file
        const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
            body: formData,
        });

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(`Failed to upload file: ${errorData.error.message}`);
        }

        const fileData = await uploadResponse.json();
        const fileId = fileData.id;

        if (!fileId) {
            throw new Error('File ID not found after upload.');
        }

        // 2. Set permissions to "anyone with the link can edit"
        const permissionResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?key=${GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                role: 'writer', // 'writer' role allows editing
                type: 'anyone',
            }),
        });

        if (!permissionResponse.ok) {
            const errorData = await permissionResponse.json();
            throw new Error(`Failed to set permissions: ${errorData.error.message}`);
        }
        
        // 3. Get the updated file metadata to retrieve the shareable link
        const fileMetaResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink&key=${GOOGLE_API_KEY}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        
        if (!fileMetaResponse.ok) {
            throw new Error('Could not retrieve file metadata after setting permissions.');
        }

        const updatedFileData = await fileMetaResponse.json();
        
        if (!updatedFileData.webViewLink) {
             throw new Error('Shareable link (webViewLink) not found in file metadata.');
        }

        return updatedFileData.webViewLink;

    } catch (error) {
        console.error('Error sharing to Google Drive:', error);
        if (error instanceof Error) {
            throw new Error(`Sharing failed: ${error.message}`);
        }
        throw new Error('An unknown error occurred during the sharing process.');
    }
}