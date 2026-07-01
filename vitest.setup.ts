import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// 各テスト後に React Testing Library の DOM をクリーンアップ
afterEach(() => {
  cleanup()
})
