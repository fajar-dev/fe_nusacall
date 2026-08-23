export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      error: 'red',
      warning: 'yellow',
      neutral: 'neutral'
    },
    button: {
      defaultVariants: {
        size: 'lg'
      }
    },
    input: {
      defaultVariants: {
        size: 'lg'
      }
    },
    selectMenu: {
      defaultVariants: {
        size: 'lg'
      }
    },
    select: {
      defaultVariants: {
        size: 'lg'
      }
    },
    textarea: {
      defaultVariants: {
        size: 'lg'
      }
    },
    modal: {
      slots: {
        content: 'sm:max-w-lg',
        overlay: '!backdrop-blur-xs !bg-white/10',
        body: 'border-0 !py-0',
        header: 'border-0'
      }
    }
  }
})