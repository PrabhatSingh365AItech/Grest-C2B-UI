import axios from 'axios'
import { CgSpinner } from 'react-icons/cg'
import { UPLOAD_STATUS } from '../constants/priceConstants'
import { Capacitor } from '@capacitor/core'

// ----------------------------
// STATUS ICON UTILITY
// ----------------------------
export const getStatusIcon = (status) => {
  switch (status) {
    case UPLOAD_STATUS.UPLOADING:
      return <CgSpinner className="animate-spin text-blue-500" size={16} />
    case UPLOAD_STATUS.SUCCESS:
      return <span className="text-green-500">✓</span>
    case UPLOAD_STATUS.ERROR:
      return <span className="text-red-500">✗</span>
    default:
      return null
  }
}

// ----------------------------
// FILE → BLOB (Android / Web / iOS)
// ----------------------------
const fileToBlob = async (file) => {
  // If already a proper Blob/File, return as-is to preserve integrity
  if (file instanceof Blob || file instanceof File) {
    return file
  }

  // For edge cases where file needs conversion
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      // Preserve original file type if available
      const blobType = file.type || 'application/octet-stream'
      resolve(new Blob([reader.result], { type: blobType }))
    }

    reader.onerror = reject
    reader.onabort = () => reject(new Error('FileReader aborted'))
    reader.readAsArrayBuffer(file)
  })
}

// ----------------------------
// FILE → BASE64 (iOS only)
// ----------------------------
const fileToBase64 = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.onabort = () => reject(new Error('FileReader aborted'))
    reader.readAsDataURL(file)
  })
}

// ----------------------------
// MERGED FILE UPLOADER (iOS + Web + Android)
// ----------------------------
export const fileUploader = async (authToken, file, fileName, fileType) => {
  try {
    const isIOS = Capacitor.getPlatform() === 'ios'

    // ----------------------------------------------------------------
    // 1️⃣ iOS — Upload through backend using FormData
    // ----------------------------------------------------------------
    if (isIOS) {
      // Create blob with explicit MIME type
      const fileBlob = await fileToBlob(file)

      // Ensure blob has correct type
      const typedBlob = new Blob([fileBlob], { type: fileType })

      const formData = new FormData()
      // Append with explicit filename and type
      formData.append('file', typedBlob, fileName)
      formData.append('fileName', fileName)
      formData.append('fileType', fileType)

      // Debug logging
      console.log('iOS Upload - fileName:', fileName)
      console.log('iOS Upload - fileType:', fileType)
      console.log('iOS Upload - blob size:', typedBlob.size)
      console.log('iOS Upload - blob type:', typedBlob.type)

      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_ENDPOINT}/api/s3/upload-file`,
        formData,
        {
          headers: {
            Authorization: authToken,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000,
        }
      )

      // Return file URL from backend
      return (
        response?.data?.fileUrl ||
        response?.data?.data?.fileUrl ||
        response?.data?.url
      )
    }

    // ----------------------------------------------------------------
    // 2️⃣ Android & Web — Direct S3 Upload With Presigned URL
    // ----------------------------------------------------------------
    const resURL = await axios.get(
      `${import.meta.env.VITE_REACT_APP_ENDPOINT}/api/s3/get-presigned-url`,
      {
        params: { fileName, fileType },
        headers: { Authorization: authToken },
      }
    )

    if (!resURL?.data?.url) {
      throw new Error('Failed to get presigned URL')
    }

    const presignedUrl = resURL.data.url
    const fileBlob = await fileToBlob(file)

    await axios.put(presignedUrl, fileBlob, {
      headers: {
        'Content-Type': fileType,
      },
      transformRequest: [(data, headers) => {
        delete headers.Authorization
        return data
      }],
    })

    // Extract S3 file URL (remove query params)
    return presignedUrl.split('?')[0]

  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}
