"use strict"

let { Notpromise } = require('./notpromise')


let np = new Notpromise((resolve, reject) => {
    console.log("start")
    console.log(resolve)
    resolve("succ1")
})

np
    .then((res) => {
        console.log("print in then:" + res)
        return "succ2"
    })
    .then((res) => {
        console.log("print in then2:" + res)
        return Notpromise.resolve("succ3")
    }).then((res) => {
        console.log("print in then3:" + res)
        return this
    }).then((res) => {
        console.log("print in then3:" + res)
        return "succ5"
    })