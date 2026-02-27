export function Footer() {
  return (
    <footer className="border-t border-border bg-card px-4 py-3">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <span>Gradio v2.4.0</span>
        <span>&copy; {new Date().getFullYear()} Gradio Technologies. All rights reserved.</span>
      </div>
    </footer>
  )
}
