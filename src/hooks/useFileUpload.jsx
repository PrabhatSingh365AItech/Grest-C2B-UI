import { useState } from 'react'
import toast from 'react-hot-toast'
import { FILE_KEYS, UPLOAD_STATUS } from '../constants/priceConstants'
import { fileUploader } from '../utils/priceUtils.jsx'

export const useFileUpload = (token, imeinumber) => {
  const [uploadStatus, setUploadStatus] = useState({
    [FILE_KEYS.ADHAAR_FRONT]: { status: UPLOAD_STATUS.PENDING, progress: 0 },
    [FILE_KEYS.ADHAAR_BACK]: { status: UPLOAD_STATUS.PENDING, progress: 0 },
    [FILE_KEYS.PHONE_BILL]: { status: UPLOAD_STATUS.PENDING, progress: 0 },
    [FILE_KEYS.PHONE_FRONT]: { status: UPLOAD_STATUS.PENDING, progress: 0 },
    [FILE_KEYS.PHONE_BACK]: { status: UPLOAD_STATUS.PENDING, progress: 0 },
    [FILE_KEYS.PHONE_LEFT]: { status: UPLOAD_STATUS.PENDING, progress: 0 },
    [FILE_KEYS.PHONE_RIGHT]: { status: UPLOAD_STATUS.PENDING, progress: 0 },
    [FILE_KEYS.PHONE_TOP]: { status: UPLOAD_STATUS.PENDING, progress: 0 },
    [FILE_KEYS.PHONE_BOTTOM]: { status: UPLOAD_STATUS.PENDING, progress: 0 },
    [FILE_KEYS.SIGNATURE]: { status: UPLOAD_STATUS.PENDING, progress: 0 }, // <-- Added new signature
    [FILE_KEYS.CEIR]: { status: UPLOAD_STATUS.PENDING, progress: 0 }, // <-- Added new CEIR
  })

  const uploadIndividualFile = async (
    fileToUpload,
    fileName,
    fileType,
    fileKey
  ) => {
    if (!fileToUpload || !imeinumber) {
      toast.error('Please enter IMEI number first')
      return
    }

    // Added check for signature
    if (!imeinumber && fileKey === FILE_KEYS.SIGNATURE) {
      toast.error('Please enter IMEI number before saving signature')
      return
    }

    // Update status to uploading
    setUploadStatus((prev) => ({
      ...prev,
      [fileKey]: { status: UPLOAD_STATUS.UPLOADING, progress: 0 },
    }))

    try {
      const fullFileName = `${imeinumber}-${fileName}`
      await fileUploader(token, fileToUpload, fullFileName, fileType)

      // Update status to success
      setUploadStatus((prev) => ({
        ...prev,
        [fileKey]: { status: UPLOAD_STATUS.SUCCESS, progress: 100 },
      }))

      console.log(`${fileName} uploaded successfully!`)

      toast.success(`${fileName} uploaded successfully!`)
    } catch (error) {
      // Update status to error
      setUploadStatus((prev) => ({
        ...prev,
        [fileKey]: { status: UPLOAD_STATUS.ERROR, progress: 0 },
      }))

      toast.error(`Failed to upload ${fileName}. Please try again.`)
      console.error(`Upload error for ${fileName}:`, error)
    }
  }

  const handleFileChange = (setMethod, e, fileName, fileKey) => {
    const doc = e.target.files[0]
    setMethod(doc)

    // Upload file immediately after selection
    if (doc) {
      uploadIndividualFile(doc, fileName, doc.type, fileKey)
    }
  }

  return {
    uploadStatus,
    setUploadStatus,
    uploadIndividualFile,
    handleFileChange,
  }
}
