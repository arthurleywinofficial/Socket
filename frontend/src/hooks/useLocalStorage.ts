import { useEffect, useState } from 'react'

type Setter<T> = (value: T) => void

function useLocalStorage<T>(key: string, initialValue: T): [T, Setter<T>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch {
      // ignore
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}

export default useLocalStorage
