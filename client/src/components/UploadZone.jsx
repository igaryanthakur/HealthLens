import { useRef, useState } from 'react'
import { FileText, UploadCloud } from 'lucide-react'

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png'

export default function UploadZone({ onFileSelected, error, disabled = false }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFile(file) {
    if (!file || disabled) return
    onFileSelected(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleInputChange(e) {
    handleFile(e.target.files[0])
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {error && (
          <div className="mb-4 bg-error-container text-error rounded-xl p-4 text-sm border border-error/20">
            {error}
          </div>
        )}

        <div
          role="button"
          tabIndex={0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={[
            'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors',
            'bg-surface-container-lowest shadow-ambient',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-outline-variant/40 hover:border-primary/50',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            disabled={disabled}
            onChange={handleInputChange}
          />

          <UploadCloud className="mx-auto text-primary mb-4" size={48} />
          <h2 className="text-xl font-semibold text-on-surface mb-2">
            Upload your medical report
          </h2>
          <p className="text-on-surface-variant text-sm mb-6">
            Drag and drop a PDF or image here, or click to browse
          </p>

          <div className="inline-flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">
            <FileText size={14} />
            PDF, JPG, JPEG, PNG
          </div>
        </div>
      </div>
    </div>
  )
}
