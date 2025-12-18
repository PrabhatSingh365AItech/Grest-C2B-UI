import React, { useState, useEffect } from 'react'
import { useZxing } from 'react-zxing'
import { IoMdArrowRoundBack } from 'react-icons/io'
import styles from '../styles/Scanner.module.css'
import { Camera } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

const Scanner = (props) => {
  const [result, setResult] = useState('')
  const [error, setError] = useState(null)
  const [permissionGranted, setPermissionGranted] = useState(false)

  const checkPermissions = async () => {
    try {
      const platform = Capacitor.getPlatform()

      // Check permissions on native platforms (iOS & Android)
      if (platform === 'ios' || platform === 'android') {
        const permission = await Camera.checkPermissions()
        if (permission.camera !== 'granted') {
          const request = await Camera.requestPermissions()
          if (request.camera !== 'granted') {
            throw new Error('Camera permission denied')
          }
        }
      }
      setPermissionGranted(true)
      return true
    } catch (err) {
      console.error('Permission error:', err)
      setError(err.message || 'Camera permission required')
      return false
    }
  }

  const { ref } = useZxing({
    onDecodeResult(result) {
      const code = result.getText()
      console.log('Barcode detected:', code)
      setResult(code)
      props.setImei(code)
      props.scanBoxSwitch()
    },
    onError(error) {
      console.error('Scanner error:', error)
      if (!permissionGranted) {
        checkPermissions()
      }
    },
    constraints: {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
  })

  useEffect(() => {
    checkPermissions()
  }, [])

  return (
    <div className={`my-auto ${styles.scan_page_wrap}`}>
      <div className="flex flex-row gap-4 w-full items-center justify-center">
        <button
          className="mb-2 flex items-center"
          onClick={() => props.scanBoxSwitch()}
        >
          <IoMdArrowRoundBack size={20} className="mr-1" />
          Back
        </button>
      </div>

      {error && (
        <div className="text-red-500 p-4 text-center">
          {error}
          <button
            className="ml-2 text-blue-500 underline"
            onClick={checkPermissions}
          >
            Retry
          </button>
        </div>
      )}

      <div
        style={{
          position: 'relative',
          height: '300px',
          overflow: 'hidden',
          backgroundColor: '#000',
        }}
        className="border-2 border-primary rounded"
      >
        <video
          ref={ref}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      <p className="mx-5 mt-2">
        <span className="text-xs font-medium">
          {result ? `Scanned: ${result}` : 'Point camera at barcode'}
        </span>
      </p>
    </div>
  )
}

export default Scanner
