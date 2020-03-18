const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class Notpromise {
    // 初始化，传入 resolve 和 reject 方法，同步执行 executor
    constructor(executor) {
        this.state = PENDING
        this.value = undefined
        this.reason = undefined
        this.onfulfilledqueue = []
        this.onrejectedqueue = []

        const resolve = (value) => {
            if (value instanceof Notpromise) {
                value.then(resolve, reject)
            }
            setTimeout(() => {
                if (this.state == PENDING) {
                    this.state = FULFILLED
                    this.value = value
                    this.onfulfilledqueue.forEach((onfulfilled) => {
                        onfulfilled(this.value)
                    })
                }
            })
        }

        const reject = (reason) => {
            setTimeout(() => {
                if (this.state == PENDING) {
                    this.state = REJECTED
                    this.reason = reason
                    this.onrejectedqueue.forEach((onrejected) => {
                        onrejected(this.reason)
                    })
                }
            })
        }

        try {
            executor(resolve, reject)
        } catch (e) {
            reject(e)
        }
    }

    // resolve 是在异步操作完成之后调用，调用的时候，切换状态，执行 onfulfilled 队列、onrejected 队列。


    static resolve(val) {
        return new Notpromise((resolve, reject) => {
            resolve(val)
        })
    }

    // then 只负责把 onfulfilled, onrejected 回调注册到队列里，返回一个新的 promise。
    then(onFulfilled, onRejected) {

        let newPromise

        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
        onRejected = typeof onRejected === 'function' ? onRejected : r => { throw r }

        switch (this.state) {
            case PENDING:
                return (newPromise = new Notpromise((resolve, reject) => {
                    this.onfulfilledqueue.push(value => {
                        //为什么这边 onFulfilled(value) 可能会throw error 而下面不会？
                        //这个是在promise chain中间，如果失败没有处理，就会有问题。
                        //如果是chain末尾那个，即使处理异常，也不会有问题？（待确认）
                        tryResolvePromise(newPromise, onFulfilled, value, resolve, reject)
                    })
                    this.onrejectedqueue.push(reason => {
                        tryResolvePromise(newPromise, onRejected, reason, resolve, reject)
                    })
                }))
            case FULFILLED:
                return (newPromise = new Notpromise((resolve, reject) => {
                    setTimeout(() => { //为什么这边需要setTimeout？因为 onFulfilled 必须在栈空的时候运行。
                        // resolvePromise(newPromise, onFulfilled(this.value), resolve, reject) //这个也是可行的
                        tryResolvePromise(newPromise, onFulfilled, this.value, resolve, reject)
                    })
                }))
            case REJECTED:
                return (newPromise = new Notpromise((resolve, reject) => {
                    setTimeout(() => {
                        // resolvePromise(newPromise, onRejected(this.reason), resolve, reject)//这个也是可行的
                        tryResolvePromise(newPromise, onRejected, this.reason, resolve, reject)
                    })
                }))
        }
    }
}


// x.then(resolve, reject)

// x 是用户传进来的 onfulfilled 方法的返回值，有可能是对象、函数、字符串、自己定义的promise、等。
// resolve 和 reject 是内部的标准方法，只需要调用，不需要用户实现。


// 递归消解 x，直到 x 不是一个 thenable，然后 resolve(x)

function tryResolvePromise(promise2, method, param, resolve, reject) {
    try {
        resolvePromise(promise2, method(param), resolve, reject)
    } catch (e) {
        reject(e)
    }

}

// 不论 promise1 被 reject 还是被 resolve 时 promise2 都会被 resolve，只有出现异常时才会被 rejected
function resolvePromise(promise2, x, resolve, reject) {
    let called = false
    try {
        if (x === promise2) {
            reject(new TypeError('循环引用'))
            return
        }

        if (x instanceof Notpromise) {
            x.then(
                y => {
                    resolvePromise(promise2, y, resolve, reject)
                },
                reject
            )
            return
        }

        if (x && (typeof x === 'function' || typeof x === 'object')) { //如果这边不判断 x && 会怎么样？


            let then = x.then
            if (typeof then === 'function') {
                then.call(x,
                    // x.then( //为什么这个不行?
                    y => {
                        if (called) return
                        called = true
                        resolvePromise(promise2, y, resolve, reject)
                    },
                    r => {
                        if (called) return
                        called = true
                        reject(r)
                    }
                )
            } else {
                resolve(x)
            }

            return
        }

        resolve(x)

    } catch (e) {
        if (called) return
        called = true
        reject(e)
    }

}


module.exports = {
    Notpromise
}