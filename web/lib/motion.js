// Tokens de duração e easing — importar em todos os componentes com animação
export const DURATION = {
  fast:   0.15,
  normal: 0.25,
  slow:   0.4,
}

export const EASE = {
  out:   [0.0, 0.0, 0.2, 1],
  in:    [0.4, 0.0, 1.0, 1],
  inOut: [0.4, 0.0, 0.2, 1],
  spring: { type: 'spring', stiffness: 300, damping: 30 },
}

// Fade + Slide para cards / painéis
export const fadeSlideUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.normal, ease: EASE.out } },
}

// Stagger de containers
export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
}

// Fade simples para dropdowns / tooltips
export const fadeIn = {
  hidden:  { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1,    transition: { duration: DURATION.fast, ease: EASE.out } },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: DURATION.fast, ease: EASE.in } },
}

// Slide lateral para sidebar mobile
export const slideSidebar = {
  hidden:  { x: '-100%' },
  visible: { x: 0, transition: { duration: DURATION.slow, ease: EASE.out } },
  exit:    { x: '-100%', transition: { duration: DURATION.normal, ease: EASE.in } },
}

// Page transition
export const pageTransition = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0,  transition: { duration: DURATION.slow, ease: EASE.out } },
  exit:    { opacity: 0, y: -8, transition: { duration: DURATION.normal, ease: EASE.in } },
}

// Toast / notificações
export const toastVariants = {
  hidden:  { opacity: 0, x: 32, scale: 0.95 },
  visible: { opacity: 1, x: 0,  scale: 1, transition: { duration: DURATION.normal, ease: EASE.out } },
  exit:    { opacity: 0, x: 32, scale: 0.95, transition: { duration: DURATION.fast, ease: EASE.in } },
}

// Micro-interações de botão
export const btnHover = { scale: 1.02 }
export const btnTap   = { scale: 0.97 }
