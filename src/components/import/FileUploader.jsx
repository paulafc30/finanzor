import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileText } from 'lucide-react'
import Button from '../ui/Button.jsx'

/**
 * Drop zone + botón para subir un archivo CSV.
 * Llama a onFile(file) cuando el usuario selecciona uno.
 */
export default function FileUploader({ onFile, disabled }) {
  const { t } = useTranslation('import')
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFiles(files) {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file) return
    onFile?.(file)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={[
        'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition',
        dragOver
          ? 'border-accent bg-accent/5'
          : 'border-white/10 bg-bg-elevated hover:border-white/20',
      ].join(' ')}
    >
      <div className="rounded-full bg-accent/15 p-3">
        <Upload size={24} className="text-accent" />
      </div>

      <div>
        <p className="text-sm font-medium text-white">
          {t('uploader.dropText')}
        </p>
        <p className="mt-1 text-xs text-white/50">
          {t('uploader.hint')}
        </p>
      </div>

      <Button
        size="sm"
        variant="secondary"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        <FileText size={14} />
        {t('uploader.selectFile')}
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.tsv,text/csv,text/tab-separated-values"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
