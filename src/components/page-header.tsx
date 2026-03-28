import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, className, children }: PageHeaderProps) {
  return (
    <div className={cn("border-b border-zinc-800 px-6 py-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          {description && (
            <p className="text-sm text-zinc-400 mt-0.5">{description}</p>
          )}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
