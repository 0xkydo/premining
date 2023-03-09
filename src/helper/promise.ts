export class Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void = () => {}
  reject: (reason?: any) => void = () => {}

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}

export function delay(ms: number) {
  const deferred = new Deferred<void>()

  setTimeout(() => deferred.resolve(), ms)
  return deferred.promise
}