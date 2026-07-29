interface ImageDividerProps {
  src: string
  alt: string
  position: 'left' | 'right'
  children: React.ReactNode
}

export function ImageDivider({ src, alt, position, children }: ImageDividerProps) {
  const gradient = position === 'left'
    ? 'bg-gradient-to-r from-indigo-950/80 via-indigo-950/30 to-purple-950/80'
    : 'bg-gradient-to-l from-purple-950/80 via-indigo-950/50 to-transparent'

  const contentAlign = position === 'left' ? 'justify-start' : 'justify-center md:justify-end'
  const textAlign = position === 'left' ? 'text-left' : 'text-center md:text-right'

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="relative rounded-xl md:rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] min-h-[200px] md:min-h-0">
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className={`absolute inset-0 ${gradient}`} />
        <div className={`absolute inset-0 flex items-center px-4 md:px-16 ${contentAlign}`}>
          <div className={`max-w-md ${textAlign}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
